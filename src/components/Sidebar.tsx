import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Volume2, Mic, Video, User as UserIcon, 
  Settings, Users, LogOut, ChevronDown, ChevronUp, Menu, X 
} from 'lucide-react';
import { useUsers } from '../context/UserContext';

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // ✅ 1. สร้าง Ref เพื่ออ้างอิงถึงกรอบของเมนูตั้งค่า
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { currentUser, logout } = useUsers();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ 2. เพิ่ม useEffect เพื่อคอยฟังเหตุการณ์ "คลิกเมาส์" ทั่วทั้งหน้าจอ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // ถ้าคลิกไปโดนส่วนอื่น ที่ไม่ใช่ลูกหลานของ menuRef (คือไม่ได้คลิกโดนปุ่มหรือกล่องเมนู)
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false); // สั่งปิดเมนู
      }
    }

    // เปิดเรดาร์จับการคลิก (จะจับเมื่อเมนูเปิดอยู่เท่านั้น เพื่อไม่ให้หน่วงเครื่อง)
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // คลีนอัปเมื่อ Component ตาย หรือ ค่า isMenuOpen เปลี่ยน
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* ─── SIDEBAR สำหรับหน้าจอปกติ (PC / Notebook / Mac) ─── */}
      <aside className="hidden md:flex w-[320px] bg-[#3B7BBD] h-screen flex-col p-6 text-white shadow-xl relative z-[1000] flex-shrink-0">
        <div className="flex justify-center mt-4 mb-10">
          <div className="w-44 h-44 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-md">
            <img src="/logo.png" alt="FAR FORWARD Logo" className="w-[75%] h-[75%] object-contain" />
          </div>
        </div>

        <nav className="flex flex-col gap-5 flex-grow px-2">
          <SidebarButton to="/" icon={<Home size={28} />} line1="Home /" line2="หน้าหลัก" />
          <SidebarButton to="/audio" icon={<Volume2 size={28} />} line1="Audio /" line2="เสียงไร้สาย" />
          <SidebarButton to="/broadcast" icon={<Mic size={28} />} line1="Broadcast/" line2="ประกาศเสียงสด" />
          <SidebarButton to="/cctv" icon={<Video size={28} />} line1="CCTV /" line2="กล้องวงจรปิด" />
        </nav>

        {/* ✅ 3. เอา menuRef มาคลุมพื้นที่ปุ่มตั้งค่าและกล่อง Dropdown ไว้ */}
        <div ref={menuRef} className="relative mt-auto pt-4 flex flex-col items-center justify-center pb-2">
          
          {/* เมนู dropdown */}
          {isMenuOpen && (
            <div className="absolute bottom-14 bg-white text-gray-800 rounded-lg shadow-xl p-1.5 w-44 z-50">
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

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center justify-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition-all cursor-pointer">
            <div className="bg-white rounded-full p-1 text-[#3B7BBD]"><UserIcon size={20} /></div>
            <span className="font-bold text-sm tracking-wide ml-1">{currentUser?.name} ({currentUser?.role})</span>
            {isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </aside>

      {/* ─── NAVIGATION สำหรับหน้าจอมือถือ / ย่อจอเล็ก ─── */}
      <header className="md:hidden bg-[#3B7BBD] text-white p-4 flex justify-between items-center shadow-md z-[1000] flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-full p-1" />
          <span className="font-bold text-sm tracking-wide">Smart Pole System</span>
        </div>
        <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="p-1.5 hover:bg-white/10 rounded-lg">
          {isMobileNavOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </header>

      {/* เมนูสไลด์ลงมาเมื่อกดปุ่มบนมือถือ */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-[#2c6198] text-white absolute top-[72px] left-0 w-full z-[999] p-4 flex flex-col gap-3 shadow-xl max-h-[calc(100vh-72px)] overflow-y-auto">
          <Link to="/" onClick={() => setIsMobileNavOpen(false)} className="p-3 bg-white text-black font-bold rounded-xl flex items-center gap-3"><Home size={20}/> หน้าหลัก</Link>
          <Link to="/audio" onClick={() => setIsMobileNavOpen(false)} className="p-3 bg-white text-black font-bold rounded-xl flex items-center gap-3"><Volume2 size={20}/> เสียงไร้สาย</Link>
          <Link to="/broadcast" onClick={() => setIsMobileNavOpen(false)} className="p-3 bg-white text-black font-bold rounded-xl flex items-center gap-3"><Mic size={20}/> ประกาศเสียงสด</Link>
          <Link to="/cctv" onClick={() => setIsMobileNavOpen(false)} className="p-3 bg-white text-black font-bold rounded-xl flex items-center gap-3"><Video size={20}/> กล้องวงจรปิด</Link>
          
          {currentUser?.role === 'ADMIN' && (
            <div className="border-t border-white/20 pt-2 flex flex-col gap-2">
              <Link to="/add-node" onClick={() => setIsMobileNavOpen(false)} className="p-2 text-sm font-bold hover:bg-white/10 rounded flex items-center gap-2"><Settings size={16}/> จัดการอุปกรณ์</Link>
              <Link to="/add-user" onClick={() => setIsMobileNavOpen(false)} className="p-2 text-sm font-bold hover:bg-white/10 rounded flex items-center gap-2"><Users size={16}/> จัดการสิทธิ์</Link>
            </div>
          )}
          <button onClick={handleLogout} className="p-2 text-sm font-bold text-red-300 hover:bg-red-900/20 rounded flex items-center gap-2 text-left mt-2">
            <LogOut size={16}/> ออกจากระบบ ({currentUser?.name})
          </button>
        </div>
      )}
    </>
  );
}

function SidebarButton({ to, icon, line1, line2 }: { to: string, icon: ReactNode, line1: string, line2: string }) {
  return (
    <Link to={to} className="bg-white text-black flex items-center px-4 py-3 rounded-2xl shadow-md hover:scale-[1.01] transition-transform">
      <div className="mr-4 text-gray-900">{icon}</div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[15px] font-extrabold">{line1}</span>
        <span className="text-[15px] font-extrabold">{line2}</span>
      </div>
    </Link>
  );
}