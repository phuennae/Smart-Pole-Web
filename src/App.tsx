import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AudioControl from './pages/AudioControl';
import Broadcast from './pages/Broadcast';
import CCTVPage from './pages/CCTVPage';
import CCTVMonitor from './pages/CCTVMonitor';
import CCTVPlayback from './pages/CCTVPlayback';
import AddNode from './pages/AddNode'; 
import { NodeProvider } from './context/NodeContext';

export default function App() {
  return (
    <NodeProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/audio" element={<AudioControl />} />
              <Route path="/broadcast" element={<Broadcast />} />
              <Route path="/cctv" element={<CCTVPage />} />
              <Route path="/cctv-monitor/:nodeId" element={<CCTVMonitor />} />
              <Route path="/cctv-playback/:nodeId" element={<CCTVPlayback />} />
              <Route path="/add-node" element={<AddNode />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </NodeProvider>
  );
}