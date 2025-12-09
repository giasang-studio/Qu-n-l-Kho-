
import React, { useState, useEffect } from 'react';
import { InventoryItem, AppView, User } from './types';
import { INITIAL_INVENTORY, MOCK_USERS } from './constants';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import Assistant from './components/Assistant';
import Login from './components/Login';
import { LayoutDashboard, Package, Bot, Menu, Box, LogOut, UserCircle, X, AlertTriangle, ArrowRight } from 'lucide-react';

// Keys for LocalStorage
const STORAGE_KEYS = {
  USERS: 'ai_warehouse_users_v1',
  INVENTORY: 'ai_warehouse_inventory_v1',
  SESSION: 'ai_warehouse_session_v1',
};

// --- Real Time Clock Component ---
const RealTimeClock = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Vietnam.svg" 
        alt="Vietnam Flag" 
        className="w-10 h-7 object-cover rounded shadow-sm border border-slate-100"
      />
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold text-slate-800 leading-none mb-1">
          {date.toLocaleTimeString('vi-VN')}
        </span>
        <span className="text-xs text-slate-500 font-medium capitalize">
          {date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

function App() {
  // 1. Initialize State from LocalStorage (or fallback to constants)
  
  // User Database State
  const [userDatabase, setUserDatabase] = useState<Record<string, User & { password: string }>>(() => {
    try {
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      return savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    } catch (e) {
      console.error("Error loading users from storage", e);
      return MOCK_USERS;
    }
  });

  // Current User Session State
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (e) {
      return null;
    }
  });

  // Inventory Data State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const savedInventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return savedInventory ? JSON.parse(savedInventory) : INITIAL_INVENTORY;
    } catch (e) {
      console.error("Error loading inventory from storage", e);
      return INITIAL_INVENTORY;
    }
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modal States
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([]);
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);

  // 2. Effects

  // Save Users
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(userDatabase));
  }, [userDatabase]);

  // Save Inventory & Check Low Stock (Update state only)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    
    // Always keep criticalItems state updated when inventory changes, 
    // but DON'T open modal here to avoid annoying popups during normal usage.
    if (user) {
        const lowStock = inventory.filter(item => item.quantity <= 2);
        setCriticalItems(lowStock);
    }
  }, [inventory, user]);

  // Effect to show modal ONCE when user logs in (or refreshes page with active session)
  useEffect(() => {
     if (user) {
         // Scan inventory immediately upon login
         const lowStock = inventory.filter(item => item.quantity <= 2);
         
         if (lowStock.length > 0) {
             setCriticalItems(lowStock);
             // Short delay to ensure UI is ready
             const timer = setTimeout(() => {
                 setIsCriticalModalOpen(true);
             }, 500);
             return () => clearTimeout(timer);
         }
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only run when 'user' changes (Login event)

  // Save Session
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [user]);

  // Handlers

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleRegister = (newUser: User & { password: string }) => {
    setUserDatabase(prev => ({
      ...prev,
      [newUser.username]: newUser
    }));
    
    const { password, ...userInfo } = newUser;
    setUser(userInfo);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    setTimeout(() => {
      setUser(null);
    }, 100);
  };

  const handleDeleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearInventory = () => {
    setInventory([]);
  };

  const handleAddItem = (newItem: InventoryItem) => {
    // Normalize name to check for duplicates (case-insensitive, trim spaces)
    const normalizedName = newItem.name.trim().toLowerCase();
    
    // Find if item already exists with SAME name AND SAME condition
    // If you have "Drum (Mới)" and "Drum (Đã qua sử dụng)", they should be separate items.
    const existingItem = inventory.find(i => 
      i.name.trim().toLowerCase() === normalizedName && 
      (i.condition || 'Mới') === (newItem.condition || 'Mới')
    );

    if (existingItem) {
        // MERGE LOGIC: Update existing item
        const updatedQuantity = existingItem.quantity + newItem.quantity;
        
        setInventory(prev => prev.map(item => 
            item.id === existingItem.id 
                ? { 
                    ...item, 
                    quantity: updatedQuantity,
                    lastUpdated: new Date().toISOString()
                  }
                : item
        ));
    } else {
        // CREATE LOGIC: Add new item
        // Ensure condition is set if undefined
        const itemToAdd = {
          ...newItem,
          condition: newItem.condition || 'Mới'
        };
        setInventory(prev => [itemToAdd, ...prev]);
    }
  };

  const handleUpdateQuantity = (id: string, change: number) => {
    setInventory(prev => {
        const itemIndex = prev.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            const item = prev[itemIndex];
            const newQuantity = Math.max(0, item.quantity + change);
            
            return prev.map(i => i.id === id ? { ...i, quantity: newQuantity, lastUpdated: new Date().toISOString() } : i);
        }
        return prev;
    });
  };

  // Render Login screen if not authenticated
  if (!user) {
    return (
      <Login 
        users={userDatabase} 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
      />
    );
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-blue-50 text-blue-600 font-medium' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Box className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản lý Vật Tư</h1>
          </div>
          
          {/* User Info (Small) */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                 <UserCircle className="w-6 h-6 text-indigo-600" />
             </div>
             <div className="overflow-hidden">
                 <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                 <p className="text-xs text-slate-500 capitalize">{user.role}</p>
             </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Tổng Quan" />
            <NavItem view={AppView.INVENTORY} icon={Package} label="Vật Tư" />
            <NavItem view={AppView.ASSISTANT} icon={Bot} label="Trợ Lý AI" />
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Trạng thái</p>
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Đang hoạt động
                </div>
            </div>
            
            <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
                <LogOut className="w-4 h-4" />
                Đăng Xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Top Header (Mobile Only) */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between lg:hidden z-10 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Box className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800">Quản lý Vật Tư</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto h-full print:max-w-none print:h-auto">
            {/* Page Header with Clock */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {currentView === AppView.DASHBOARD && 'Tổng Quan'}
                        {currentView === AppView.INVENTORY && 'Danh Sách Vật Tư'}
                        {currentView === AppView.ASSISTANT && 'Trợ Lý Ảo'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {currentView === AppView.DASHBOARD && `Chào mừng quay lại, ${user.name}.`}
                        {currentView === AppView.INVENTORY && 'Quản lý nhập xuất và vị trí lưu kho vật tư.'}
                        {currentView === AppView.ASSISTANT && 'Hỏi đáp và hỗ trợ quản lý bằng AI.'}
                    </p>
                </div>
                {/* Clock Integration */}
                <RealTimeClock />
            </div>

            {currentView === AppView.DASHBOARD && (
              <Dashboard inventory={inventory} />
            )}
            
            {currentView === AppView.INVENTORY && (
              <InventoryList 
                inventory={inventory} 
                onDelete={handleDeleteItem}
                onAdd={handleAddItem}
                onClearAll={handleClearInventory}
              />
            )}
            
            {currentView === AppView.ASSISTANT && (
              <Assistant 
                inventory={inventory}
                onQuickAdd={handleAddItem}
                onUpdateQuantity={handleUpdateQuantity}
              />
            )}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in relative">
            <button 
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-red-500 ml-1" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">Đăng Xuất</h3>
              <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại? Bạn sẽ cần đăng nhập lại để tiếp tục truy cập.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Ở lại
                </button>
                <button 
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02]"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warning Modal */}
      {isCriticalModalOpen && criticalItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 animate-scale-in overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-orange-50 p-6 border-b border-orange-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900">Cảnh báo Vật tư gần hết</h3>
                  <p className="text-sm text-slate-500">Có {criticalItems.length} vật tư còn 2 cái hoặc ít hơn.</p>
               </div>
            </div>

            {/* Modal Body: List of Items */}
            <div className="p-0 max-h-80 overflow-y-auto">
               <div className="divide-y divide-slate-100">
                  {criticalItems.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">Tại: {item.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-red-600">{item.quantity}</span>
                             <span className="text-xs text-slate-400">{item.unit}</span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <button 
                  onClick={() => {
                      setIsCriticalModalOpen(false);
                      setCurrentView(AppView.INVENTORY); // Redirect to inventory for action
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
               >
                  Kiểm tra kho ngay <ArrowRight className="w-4 h-4" />
               </button>
               <button 
                  onClick={() => setIsCriticalModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-white hover:text-slate-800 rounded-lg transition-colors"
               >
                  Đã hiểu
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;