
import React, { useState, useEffect } from 'react';
import { InventoryItem, User } from '../types';
import { uploadToCloud, fetchFromCloud, getCloudMetadata, mockGoogleLogin, mockGoogleLogout, checkGoogleSession, GoogleProfile } from '../services/cloudService';
import { UploadCloud, DownloadCloud, CheckCircle2, RefreshCw, AlertTriangle, LogOut, HardDrive, ShieldCheck } from 'lucide-react';

interface CloudSyncProps {
  users: Record<string, User & { password: string }>;
  inventory: InventoryItem[];
  onRestore: (users: Record<string, User & { password: string }>, inventory: InventoryItem[]) => void;
}

const CloudSync: React.FC<CloudSyncProps> = ({ users, inventory, onRestore }) => {
  const [googleUser, setGoogleUser] = useState<GoogleProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [cloudMeta, setCloudMeta] = useState<{ hasData: boolean; lastSynced: string | null }>({ hasData: false, lastSynced: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const session = checkGoogleSession();
    if (session) {
      setGoogleUser(session);
    }
    refreshMeta();
  }, []);

  const refreshMeta = () => {
    const meta = getCloudMetadata();
    setCloudMeta(meta);
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const profile = await mockGoogleLogin();
      setGoogleUser(profile);
      setMessage({ type: 'success', text: 'Đăng nhập thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Không thể kết nối tới Google.' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsAuthenticating(true);
    await mockGoogleLogout();
    setGoogleUser(null);
    setIsAuthenticating(false);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!googleUser) return;
    setIsSyncing(true);
    setMessage(null);
    try {
      const result = await uploadToCloud(users, inventory);
      if (result.success) {
        setMessage({ type: 'success', text: 'Đã sao lưu dữ liệu lên Google Drive thành công!' });
        refreshMeta();
      } else {
        setMessage({ type: 'error', text: 'Lỗi kết nối Drive. Không thể sao lưu.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi không mong muốn.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    if (!googleUser || !cloudMeta.hasData) return;
    
    if (!window.confirm("CẢNH BÁO: Dữ liệu hiện tại trên máy sẽ bị ghi đè bởi bản sao lưu từ Google Drive. Bạn có chắc chắn muốn tiếp tục?")) {
      return;
    }

    setIsSyncing(true);
    setMessage(null);
    try {
      const result = await fetchFromCloud();
      if (result.success && result.data) {
        onRestore(result.data.users, result.data.inventory);
        setMessage({ type: 'success', text: 'Đã khôi phục dữ liệu từ Google Drive về máy!' });
      } else {
        setMessage({ type: 'error', text: 'Không tìm thấy file backup trên Drive.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi không mong muốn.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có bản sao lưu';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // --- UNATHENTICATED VIEW ---
  if (!googleUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-fade-in p-6">
         <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" 
                  alt="Google Drive" 
                  className="w-12 h-12"
                />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Liên kết Google Drive</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
               Lưu trữ cơ sở dữ liệu kho hàng của bạn một cách an toàn trên Google Drive cá nhân. 
               Đồng bộ hóa giữa các thiết bị và không bao giờ lo mất dữ liệu.
            </p>

            <button
               onClick={handleGoogleLogin}
               disabled={isAuthenticating}
               className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all shadow-sm group"
            >
               {isAuthenticating ? (
                 <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
               ) : (
                 <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
               )}
               <span>{isAuthenticating ? 'Đang kết nối...' : 'Đăng nhập bằng Google'}</span>
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
               <ShieldCheck className="w-4 h-4" />
               <span>Bảo mật bởi Google OAuth 2.0</span>
            </div>
         </div>
      </div>
    );
  }

  // --- AUTHENTICATED DASHBOARD VIEW ---
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
         <div className="flex items-center gap-4">
            <img src={googleUser.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-slate-100" />
            <div>
               <h3 className="font-bold text-slate-800">{googleUser.name}</h3>
               <p className="text-sm text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {googleUser.email}
               </p>
            </div>
         </div>
         <button 
           onClick={handleGoogleLogout}
           className="text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
         >
           <LogOut className="w-4 h-4" /> Ngắt kết nối
         </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-slide-in ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Upload Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <UploadCloud className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 flex-1">
               <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-xl font-bold mb-2">Sao Lưu Dữ Liệu</h3>
               <p className="text-blue-100 text-sm mb-6">
                  Tải toàn bộ danh sách kho hàng và tài khoản nhân viên hiện tại lên thư mục ứng dụng trên Google Drive.
               </p>
            </div>

            <button
                onClick={handleUpload}
                disabled={isSyncing}
                className="relative z-10 w-full py-3 bg-white text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-md"
            >
                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Sao Lưu Ngay'}
            </button>
        </div>

        {/* Download Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-slate-100">
               <HardDrive className="w-32 h-32" />
            </div>

            <div className="relative z-10 flex-1">
               <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <DownloadCloud className="w-6 h-6 text-slate-600" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Khôi Phục Dữ Liệu</h3>
               <div className="space-y-3 mb-6">
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Bản sao lưu gần nhất</p>
                     <p className="font-medium flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4" alt="Drive" />
                        {formatDate(cloudMeta.lastSynced)}
                     </p>
                  </div>
               </div>
            </div>

            <button
                onClick={handleDownload}
                disabled={!cloudMeta.hasData || isSyncing}
                className="relative z-10 w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Tải Về & Khôi Phục'}
            </button>
        </div>

      </div>
      
      <div className="text-center text-xs text-slate-400 mt-8">
        <p>Kho Thông Minh AI yêu cầu quyền truy cập vào thư mục ứng dụng riêng trên Google Drive.</p>
      </div>
    </div>
  );
};

export default CloudSync;
