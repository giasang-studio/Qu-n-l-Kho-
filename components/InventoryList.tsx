
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, Trash2, Edit2, AlertCircle, AlertTriangle, X, Tag, Printer, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

interface InventoryListProps {
  inventory: InventoryItem[];
  onDelete: (id: string) => void;
  onAdd: (item: InventoryItem) => void;
  onClearAll: () => void;
}

const NAME_TYPE_FILTERS = ['Mực', 'Rulo sấy', 'Drum', 'Gạt', 'Web dầu'];
const MACHINE_FILTERS = ['Toshiba', 'Ricoh', 'Konica'];
const UNIT_OPTIONS = ['Cái', 'Gói'];
const CONDITION_OPTIONS = ['Mới', 'Đã qua sử dụng'];

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onDelete, onAdd, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNameType, setFilterNameType] = useState('All'); // Keeps the Name Type filter
  const [filterMachine, setFilterMachine] = useState('All'); // Machine Brand filter
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({});

  const filteredItems = inventory.filter(item => {
    // 1. Text Search
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Name Type Filter
    const matchesNameType = filterNameType === 'All' || item.name.toLowerCase().includes(filterNameType.toLowerCase());

    // 3. Machine Filter
    const matchesMachine = filterMachine === 'All' || item.name.toLowerCase().includes(filterMachine.toLowerCase());

    return matchesSearch && matchesNameType && matchesMachine;
  });

  const handleOpenAddModal = () => {
    let nameParts = [];
    let prefilledCategory = '';
    let prefilledUnit = 'Cái'; // Default

    // Logic to build name based on Name Type Filter
    if (filterNameType !== 'All') {
      nameParts.push(filterNameType);
      
      switch (filterNameType) {
        case 'Mực':
          prefilledCategory = 'Mực In';
          prefilledUnit = 'Gói'; // Auto-set unit for Mực
          break;
        case 'Drum':
        case 'Gạt':
          prefilledCategory = 'Linh Kiện';
          prefilledUnit = 'Cái';
          break;
        case 'Rulo sấy':
          prefilledCategory = 'Nhiệt & Sấy';
          prefilledUnit = 'Cái';
          break;
        case 'Web dầu':
          prefilledCategory = 'Vật Tư Tiêu Hao';
          prefilledUnit = 'Cái';
          break;
        default:
          prefilledCategory = 'Khác';
          prefilledUnit = 'Cái';
      }
    }

    // Logic to append Machine Brand
    if (filterMachine !== 'All') {
        nameParts.push(filterMachine);
    }

    const prefilledName = nameParts.length > 0 ? nameParts.join(' ') + ' ' : '';

    setNewItem({
      name: prefilledName,
      category: prefilledCategory,
      unit: prefilledUnit, 
      condition: 'Mới' // Default condition
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.quantity) {
      const item: InventoryItem = {
        id: Date.now().toString(),
        name: newItem.name,
        category: newItem.category || 'Khác',
        quantity: Number(newItem.quantity),
        unit: newItem.unit || 'Cái',
        minStock: 0, // Removed user input, default to 0
        location: newItem.location || 'Kho chung',
        lastUpdated: new Date().toISOString(),
        condition: newItem.condition || 'Mới'
      };
      onAdd(item);
      setNewItem({});
      setIsAddModalOpen(false);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const confirmClearAll = () => {
      onClearAll();
      setIsDeleteAllModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        {/* Search and Filter Group */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Name Type Filter */}
            <div className="relative w-full sm:w-40">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                    value={filterNameType}
                    onChange={(e) => setFilterNameType(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white text-slate-700 cursor-pointer shadow-sm hover:bg-slate-50"
                >
                    <option value="All">Loại vật tư</option>
                    {NAME_TYPE_FILTERS.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
            </div>

            {/* Machine Filter */}
            <div className="relative w-full sm:w-40">
                <Printer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                    value={filterMachine}
                    onChange={(e) => setFilterMachine(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white text-slate-700 cursor-pointer shadow-sm hover:bg-slate-50"
                >
                    <option value="All">Dòng máy</option>
                    {MACHINE_FILTERS.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full xl:w-auto">
            {inventory.length > 0 && (
                <button 
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors border border-red-200 whitespace-nowrap shadow-sm hover:shadow"
                >
                  <Trash2 className="w-5 h-5" />
                  Xóa tất cả
                </button>
            )}
            <button 
              onClick={handleOpenAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Thêm Vật Phẩm
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Tên Sản Phẩm</th>
                <th className="px-6 py-4">Tình Trạng</th>
                <th className="px-6 py-4">Danh Mục</th>
                <th className="px-6 py-4 text-center">Kho Còn</th>
                <th className="px-6 py-4">Vị Trí</th>
                <th className="px-6 py-4 text-center">Cảnh Báo</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-all duration-200 group">
                    <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">
                        {item.condition === 'Mới' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <CheckCircle2 className="w-3 h-3" />
                                Mới
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                <Clock className="w-3 h-3" />
                                Đã dùng
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {item.quantity} <span className="text-slate-400 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.location}</td>
                    <td className="px-6 py-4 text-center">
                      {item.quantity <= item.minStock ? (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium border border-red-100 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Sắp hết
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium border border-emerald-100">
                          Ổn định
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in relative">
            <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Thêm Vật Phẩm Mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Sản Phẩm *</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  value={newItem.name || ''}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tình Trạng</label>
                    <div className="relative">
                        <select
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-800"
                            value={newItem.condition || 'Mới'}
                            onChange={e => setNewItem({...newItem, condition: e.target.value as any})}
                        >
                            {CONDITION_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Danh Mục</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      value={newItem.category || ''}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số Lượng *</label>
                    <input 
                      required
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      value={newItem.quantity || ''}
                      onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đơn Vị</label>
                    <div className="relative">
                        <select
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-800"
                            value={newItem.unit || 'Cái'}
                            onChange={e => setNewItem({...newItem, unit: e.target.value})}
                        >
                            {UNIT_OPTIONS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>
              </div>

              {/* Min Stock Removed */}
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vị Trí</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    value={newItem.location || ''}
                    onChange={e => setNewItem({...newItem, location: e.target.value})}
                  />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
             <div className="flex items-center gap-3 mb-4 text-red-600">
               <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Xóa Sản Phẩm?</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Bạn có chắc chắn muốn xóa <strong>{itemToDelete.name}</strong> không? Hành động này không thể hoàn tác.
             </p>
             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium shadow-sm"
                >
                  Xóa bỏ
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete ALL Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-in border-2 border-red-100">
             <div className="flex items-center gap-3 mb-4 text-red-600">
               <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Xóa TOÀN BỘ?</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Bạn đang chuẩn bị xóa sạch <strong>tất cả vật tư</strong> trong kho. <br/><br/>
               ⚠️ Dữ liệu sẽ mất vĩnh viễn và không thể khôi phục! Bạn có chắc chắn không?
             </p>
             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmClearAll}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-bold shadow-md hover:shadow-lg"
                >
                  XÓA TẤT CẢ
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
