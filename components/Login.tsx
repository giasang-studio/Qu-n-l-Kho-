import React, { useState } from 'react';
import { User } from '../types';
import { Box, Lock, User as UserIcon, ArrowRight, Loader2, UserPlus, CheckCircle } from 'lucide-react';

interface LoginProps {
  users: Record<string, User & { password: string }>;
  onLogin: (user: User) => void;
  onRegister: (user: User & { password: string }) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Extra State
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsername('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(() => {
      if (isRegistering) {
        // Registration Logic
        if (users[username]) {
          setError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự.');
          setIsLoading(false);
          return;
        }

        const newUser: User & { password: string } = {
          username,
          password,
          name: fullName || username,
          role: 'staff' // Default role for new users
        };

        onRegister(newUser);
      } else {
        // Login Logic
        const userRecord = users[username];
        
        if (userRecord && userRecord.password === password) {
          const { password: _, ...userInfo } = userRecord;
          onLogin(userInfo);
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không đúng.');
          setIsLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden transition-all duration-300">
           <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)', backgroundSize: '20px 20px'}}></div>
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 transform hover:scale-105 transition-transform duration-300">
                <Box className="w-8 h-8 text-blue-600" />
             </div>
             <h1 className="text-2xl font-bold text-white">Quản lý Vật Tư</h1>
             <p className="text-blue-100 mt-1">
               {isRegistering ? 'Đăng ký tài khoản nhân viên mới' : 'Đăng nhập để quản lý vật tư'}
             </p>
           </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-800"
                  placeholder="Nhập tên tài khoản"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Extra Fields for Registration */}
            {isRegistering && (
              <div className="animate-fade-in space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và Tên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-800"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Confirm Password */}
            {isRegistering && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-800"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2 animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Đang xử lý...
                </>
              ) : isRegistering ? (
                <>
                  <UserPlus className="ml-2 h-4 w-4 mr-2" />
                  Đăng Ký
                </>
              ) : (
                <>
                  Đăng Nhập
                  <ArrowRight className="ml-2 h-4 w-4 mr-2" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
             <p className="text-sm text-slate-600">
               {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
               <button 
                 onClick={toggleMode}
                 className="ml-1 font-semibold text-blue-600 hover:text-blue-500 hover:underline focus:outline-none"
               >
                 {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
               </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;