import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AudioControl from './pages/AudioControl';
import Broadcast from './pages/Broadcast';
import CCTVPage from './pages/CCTVPage';
import CCTVMonitor from './pages/CCTVMonitor';
import CCTVPlayback from './pages/CCTVPlayback';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar /> {/* Sidebar อยู่คงที่ที่นี่ */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/audio" element={<AudioControl />} />
            <Route path="/broadcast" element={<Broadcast/>} />
            <Route path="/cctv" element={<CCTVPage/>} />
            <Route path="/cctv-monitor/:nodeId" element={<CCTVMonitor />} />
            <Route path="/cctv-playback/:nodeId" element={<CCTVPlayback />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}