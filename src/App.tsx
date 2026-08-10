import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AudioControl from './pages/AudioControl';
import Broadcast from './pages/Broadcast';
import CCTVPage from './pages/CCTVPage';
import CCTVMonitor from './pages/CCTVMonitor';
import CCTVPlayback from './pages/CCTVPlayback';
import AddNode from './pages/AddNode';
import AddUser from './pages/AddUser';
import Login from './pages/Login';
import EnergyMonitor from './pages/EnergyMonitor';
import { NodeProvider } from './context/NodeContext';
import { UserProvider, useUsers } from './context/UserContext';
import ActivityLogs from './pages/ActivityLogs';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useUsers();
  return currentUser ? children : <Navigate to="/login" />;
}

function AppContent() {
  // ✅ ดึงฟังก์ชัน logout ออกมาจาก Context เพื่อใช้ตอนหมดเวลา
  const { currentUser, logout } = useUsers(); 
  const timeoutRef = useRef<any>(null);

  // ✅ ฟังก์ชันจับเวลา Auto Logout (30 นาที)
  useEffect(() => {
    // ถ้ายังไม่ได้ล็อกอิน ก็ไม่ต้องเริ่มจับเวลา
    if (!currentUser) return;

    // ตั้งเวลา 30 นาที (1800000 มิลลิวินาที) ให้ตรงกับฝั่ง check_session.php
    const TIMEOUT_MS = 30 * 60 * 1000; 

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // เมื่อปล่อยทิ้งไว้จนครบเวลา ให้ทำการ Logout ทันที
        if (logout) {
          logout();
          alert("เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่");
        }
      }, TIMEOUT_MS);
    };

    // เหตุการณ์ที่จะนับว่า "มีการใช้งานอยู่" (ขยับเมาส์, กดคีย์บอร์ด, เลื่อนจอ, แตะหน้าจอ)
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // ผูก Event ไว้กับหน้าต่างเบราว์เซอร์
    events.forEach(event => window.addEventListener(event, resetTimer));

    // เริ่มจับเวลาครั้งแรกเมื่อเข้าสู่ระบบ
    resetTimer();

    // เคลียร์ Event ออกเมื่อผู้ใช้ออกจากระบบ หรือปิดแท็บ
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser, logout]);

  return (
    // md:flex-row แปลว่าถ้าจอใหญ่กว่า 768px (PC/Notebook) ให้เรียงซ้ายขวา แต่ถ้าจอเล็ก (มือถือ) ให้เรียงบนลงล่าง flex-col
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gray-100">
      {currentUser && <Sidebar />}
      
      {/* ส่วนเนื้อหาหลักจะยืดเต็มพื้นที่ที่เหลือ */}
      <div className="flex-grow h-full overflow-y-auto relative w-full">
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/audio" element={<PrivateRoute><AudioControl /></PrivateRoute>} />
          <Route path="/broadcast" element={<PrivateRoute><Broadcast /></PrivateRoute>} />
          <Route path="/cctv" element={<PrivateRoute><CCTVPage /></PrivateRoute>} />
          <Route path="/cctv-monitor/:nodeId" element={<PrivateRoute><CCTVMonitor /></PrivateRoute>} />
          <Route path="/cctv-playback/:nodeId" element={<PrivateRoute><CCTVPlayback /></PrivateRoute>} />
          <Route path="/add-node" element={<PrivateRoute><AddNode /></PrivateRoute>} />
          <Route path="/add-user" element={<PrivateRoute><AddUser /></PrivateRoute>} />
          <Route path="/energy-monitor/:nodeId" element={<EnergyMonitor />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <NodeProvider>
      <UserProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </UserProvider>
    </NodeProvider>
  );
}