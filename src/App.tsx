import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
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

function PrivateRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useUsers();
  return currentUser ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { currentUser } = useUsers();

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