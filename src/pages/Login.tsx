import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, User as UserIcon, Lock } from 'lucide-react';
import { useUsers } from '../context/UserContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useUsers();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Username หรือ Password ไม่ถูกต้อง');
    }
  };

  return (
    // เปลี่ยนเป็น flex-col บนมือถือ และ md:flex-row บนจอใหญ่
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-white font-sans">
      
      {/* ฝั่งซ้าย (หรือด้านบนบนมือถือ): โลโก้แถบสีน้ำเงิน */}
      <div className="w-full md:w-[320px] bg-[#3B7BBD] md:h-full flex flex-col items-center justify-center p-8 md:p-6 text-white shadow-xl z-10 shrink-0">
        <div className="w-32 h-32 md:w-56 md:h-56 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-md mb-4 md:mb-8">
          <img src="/logo.png" alt="FAR FORWARD Logo" className="w-[75%] h-[75%] object-contain" />
        </div>
        <h1 className="text-lg md:text-xl font-bold mb-1 text-center">Smart Pole Control Center System</h1>
        <h2 className="text-base md:text-lg font-medium text-center">ระบบเสียงตามสายอัจฉริยะ</h2>
      </div>

      {/* ฝั่งขวา (หรือด้านล่างบนมือถือ): ฟอร์มล็อกอิน */}
      <div className="flex-1 flex items-center justify-center bg-white p-4 relative">
        {/* เปลี่ยนจาก w-[600px] เป็น w-full max-w-[600px] เพื่อให้ย่อตามจอมือถือได้ */}
        <div className="w-full max-w-[600px] rounded-[20px] shadow-[0_0_20px_rgba(0,0,0,0.1)] overflow-hidden">
          
          {/* Header สีฟ้า */}
          <div className="bg-[#48A0D8] p-4 md:p-5 flex items-center gap-3 text-white">
            <div className="w-8 h-8 shrink-0 rounded-full border-2 border-white flex items-center justify-center">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-wide">Log in / กรุณาเข้าสู่ระบบเพื่อใช้งาน</span>
          </div>

          {/* Body ฟอร์ม */}
          <div className="bg-[#EAEAEA] px-6 py-10 md:px-12 md:py-16">
            <form onSubmit={handleLogin} className="flex flex-col gap-6 max-w-[400px] mx-auto">
              
              {/* ช่อง Username */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <UserIcon size={20} strokeWidth={2.5} />
                </div>
                <input 
                  type="text" 
                  placeholder="Username / ชื่อผู้ใช้งาน"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-0 shadow-sm outline-none focus:ring-2 ring-[#48A0D8] text-sm font-bold text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* ช่อง Password */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Lock size={20} strokeWidth={2.5} />
                </div>
                <input 
                  type="password" 
                  placeholder="Password / รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-0 shadow-sm outline-none focus:ring-2 ring-[#48A0D8] text-sm font-bold text-gray-700 placeholder-gray-400"
                />
              </div>

              {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

              {/* ปุ่ม Login */}
              <div className="flex justify-center mt-4">
                <button type="submit" className="bg-[#48A0D8] text-white px-8 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-blue-500 transition-colors w-full sm:w-auto">
                  Log in / เข้าสู่ระบบ
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}