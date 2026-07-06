import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Volume2, Mic, Video, User as UserIcon, 
  Settings, Users, LogOut, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useUsers } from '../context/UserContext';

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useUsers();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[320px] bg-[#3B7BBD] h-screen flex flex-col p-6 text-white shadow-xl relative z-[1000]">
      {/* ส่วนบน: โลโก้ */}
      <div className="flex justify-center mt-4 mb-10">
        <div className="w-52 h-52 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-md">
          <img 
            src="/logo.png" 
            alt="FAR FORWARD Logo" 
            className="w-[75%] h-[75%] object-contain" 
          />
        </div>
      </div>

      {/* ส่วนเมนูนำทาง */}
      <nav className="flex flex-col gap-5 flex-grow px-2">
        <SidebarButton to="/" icon={<Home size={32} />} line1="Home /" line2="หน้าหลัก" />
        <SidebarButton to="/audio" icon={<Volume2 size={32} />} line1="Audio /" line2="เสียงไร้สาย" />
        <SidebarButton to="/broadcast" icon={<Mic size={32} />} line1="Broadcast/" line2="ประกาศเสียงสด" />
        <SidebarButton to="/cctv" icon={<Video size={32} />} line1="CCTV /" line2="กล้องวงจรปิด" />
      </nav>

      {/* ส่วนล่าง: Profile & Dropdown */}
      <div className="relative mt-auto flex flex-col items-center justify-center pb-2">
        
        {/* เมนู dropdown */}
        {isMenuOpen && (
          <div className="absolute bottom-12 bg-white text-gray-800 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.2)] p-1.5 w-44 z-50">
            
            {/* เช็คสิทธิ์: ถ้าเป็น ADMIN ถึงจะเห็นปุ่มจัดการ */}
            {currentUser?.role === 'ADMIN' && (
              <>
                <Link to="/add-node" className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded-md text-[13px] font-bold transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Settings size={16} className="text-gray-600" /> จัดการอุปกรณ์
                </Link>
                <Link to="/add-user" className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded-md text-[13px] font-bold transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Users size={16} className="text-gray-600" /> จัดการสิทธิ์
                </Link>
              </>
            )}
            
            <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 hover:bg-red-50 text-red-600 rounded-md text-[13px] font-bold transition-colors">
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        )}

        {/* ปุ่มโปรไฟล์ */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          <div className="bg-white rounded-full p-1 text-[#3B7BBD]">
            <UserIcon size={24} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm tracking-wide ml-1">
            {currentUser?.name} ({currentUser?.role})
          </span>
          {isMenuOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
    </aside>
  );
}

// Sub-component สำหรับจัด Layout ของปุ่ม
function SidebarButton({ to, icon, line1, line2 }: { to: string, icon: ReactNode, line1: string, line2: string }) {
  return (
    <Link 
      to={to} 
      className="bg-white text-black flex items-center px-6 py-4 rounded-2xl shadow-md hover:scale-[1.02] transition-transform"
    >
      <div className="mr-6 text-gray-900">
        {icon}
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[18px] font-extrabold">{line1}</span>
        <span className="text-[18px] font-extrabold">{line2}</span>
      </div>
    </Link>
  );
}