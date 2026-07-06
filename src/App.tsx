import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react'; // เพิ่ม import นี้เพื่อแก้ Error
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
import { NodeProvider } from './context/NodeContext';
import { UserProvider, useUsers } from './context/UserContext';

// เปลี่ยนจาก JSX.Element เป็น ReactNode
function PrivateRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useUsers();
  return currentUser ? children : <Navigate to="/login" />;
}

// โครงสร้างหลัก
function AppContent() {
  const { currentUser } = useUsers();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ซ่อน Sidebar ถ้ายังไม่ได้ล็อกอิน */}
      {currentUser && <Sidebar />}
      
      <div className="flex-1 overflow-y-auto bg-gray-100">
        <Routes>
          {/* หน้า Login (ถ้าล็อกอินแล้ว ให้เด้งกลับไปหน้า Home อัตโนมัติ) */}
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          
          {/* หน้าอื่นๆ ทั้งหมดถูกหุ้มด้วย PrivateRoute เพื่อบังคับล็อกอินก่อน */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/audio" element={<PrivateRoute><AudioControl /></PrivateRoute>} />
          <Route path="/broadcast" element={<PrivateRoute><Broadcast /></PrivateRoute>} />
          <Route path="/cctv" element={<PrivateRoute><CCTVPage /></PrivateRoute>} />
          <Route path="/cctv-monitor/:nodeId" element={<PrivateRoute><CCTVMonitor /></PrivateRoute>} />
          <Route path="/cctv-playback/:nodeId" element={<PrivateRoute><CCTVPlayback /></PrivateRoute>} />
          <Route path="/add-node" element={<PrivateRoute><AddNode /></PrivateRoute>} />
          <Route path="/add-user" element={<PrivateRoute><AddUser /></PrivateRoute>} />
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