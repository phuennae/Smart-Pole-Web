import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Play, Square, Clock, Pause, Settings2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

const WS_URL = `ws://${window.location.hostname}:8080`;
// const WS_URL = 'ws://localhost:8080';

interface Recording {
  id: string;
  start: string;
  end: string;
}

export default function CCTVPlayback() {
  const navigate = useNavigate();
  const { nodeId } = useParams();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  
  // State สำหรับ Popup
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/jsmpeg@1.0.0/dist/jsmpeg.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (playerRef.current) playerRef.current.destroy();
    };
  }, []);

  const showNotification = (message: string) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'search');
      formData.append('camera_id', nodeId || '');
      formData.append('date', date);

      const res = await fetch(`${API_URL}/playback_proxy.php`, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      
      if (result.success) {
        setRecordings(result.recordings);
        setSelectedSegment(null);
        stopPlayback();
      } else {
        // เปลี่ยนจาก alert() เป็น Popup ของเราเอง
        showNotification('ไม่พบข้อมูลบันทึกวิดีโอในวันที่เลือก');
      }
    } catch (error) {
      console.error("Search Error:", error);
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const playPlayback = () => {
    if (!selectedSegment || !canvasRef.current) return;
    
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const wsUrl = `${WS_URL}/playback_ws.php?camera_id=${nodeId}&start=${encodeURIComponent(selectedSegment.start)}&end=${encodeURIComponent(selectedSegment.end)}`;
    
    playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: true
    });
    
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = Number(e.target.value);
    setSpeed(newSpeed);

    if (playerRef.current && selectedSegment && canvasRef.current) {
      const wasPlaying = isPlaying;
      playerRef.current.destroy();

      const wsUrl = `${WS_URL}/playback_ws.php?camera_id=${nodeId}&start=${encodeURIComponent(selectedSegment.start)}&end=${encodeURIComponent(selectedSegment.end)}`;
      
      playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: true
      });

      if (!wasPlaying) {
        setTimeout(() => {
          if (playerRef.current) playerRef.current.pause();
          setIsPlaying(false);
        }, 1000);
      } else {
        setIsPlaying(true);
      }
    }
  };

  const getTimelineStyle = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    
    const leftPercent = (startMin / (24 * 60)) * 100;
    const widthPercent = ((endMin - startMin) / (24 * 60)) * 100;
    
    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 0.5)}%` };
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen font-sans relative">
      {/* 🚀 Minimal Popup Notification */}
      <div 
        className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
          showPopup ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md shadow-xl border border-orange-100 px-6 py-3 rounded-full flex items-center gap-3">
          <AlertCircle className="text-orange-500" size={20} />
          <span className="font-bold text-gray-700">{popupMessage}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(`/cctv-monitor/${nodeId}`)} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับไปหน้า Monitor
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={20} /> ค้นหาไฟล์</h3>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 mb-1 block">วันที่</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full p-3 bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-[#48A0D8]" 
                />
              </div>
              <button onClick={handleSearch} disabled={isLoading} className="w-full bg-[#48A0D8] text-white p-3 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95">
                {isLoading ? 'กำลังค้นหา...' : 'ค้นหาบันทึก'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Playback Viewer</h3>
              
              <div className="bg-black w-full aspect-video rounded-2xl flex items-center justify-center text-white mb-6 overflow-hidden relative">
                <canvas ref={canvasRef} className="w-full h-full block"></canvas>
                
                {!isPlaying && !playerRef.current && (
                   <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold">
                     {selectedSegment ? 'กดปุ่ม Play เพื่อเริ่มเล่น' : 'กรุณาค้นหาและเลือกช่วงเวลา'}
                   </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 mb-2">Timeline (24 ชั่วโมง)</div>
                <div className="h-16 bg-gray-200 rounded-lg relative overflow-hidden cursor-pointer shadow-inner">
                  {recordings.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`absolute h-full bg-blue-500/60 border-r border-white/50 transition-all hover:opacity-100 ${selectedSegment?.id === rec.id ? 'bg-blue-600 shadow-[0_0_0_2px_white_inset]' : ''}`}
                      style={getTimelineStyle(rec.start, rec.end)}
                      onClick={() => setSelectedSegment(rec)}
                      title={`${rec.start} - ${rec.end}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 flex-wrap">
                {!isPlaying ? (
                  <button onClick={playPlayback} disabled={!selectedSegment} className="bg-green-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all shadow-md active:scale-95">
                    <Play size={24} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={togglePause} className="bg-orange-500 text-white p-3 rounded-xl transition-all shadow-md active:scale-95">
                    <Pause size={24} fill="currentColor" />
                  </button>
                )}
                
                <button onClick={stopPlayback} disabled={!playerRef.current} className="bg-red-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all shadow-md active:scale-95">
                  <Square size={24} fill="currentColor" />
                </button>

                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200">
                  <Settings2 size={18} className="text-gray-500" />
                  <select 
                    value={speed}
                    onChange={handleSpeedChange}
                    className="bg-transparent text-gray-700 font-bold border-0 outline-none cursor-pointer"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1.0x (Normal)</option>
                    <option value="2">2.0x</option>
                    <option value="4">4.0x</option>
                  </select>
                </div>

                <div className="ml-auto font-mono font-bold text-gray-700 flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
                  <Clock size={18} className="text-[#48A0D8]" /> 
                  {selectedSegment ? selectedSegment.start.split('T')[1].substring(0, 5) + ' - ' + selectedSegment.end.split('T')[1].substring(0, 5) : '--:--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}