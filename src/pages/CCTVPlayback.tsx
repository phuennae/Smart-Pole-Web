import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Play, Square, Clock, Settings2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

interface Recording {
  id: string;
  start: string;
  end: string;
}

export default function CCTVPlayback() {
  const navigate = useNavigate();
  const { nodeId } = useParams();
  
  const idMapping: { [key: string]: string } = {
    "8": "7", 
  };
  const mappedNodeId = idMapping[String(nodeId)] || String(nodeId);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);

  // โหลดสคริปต์ JSMpeg เข้ามาในโปรเจกต์
  useEffect(() => {
    let script = document.querySelector('script[src*="jsmpeg"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = "/jsmpeg.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
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
      formData.append('camera_id', mappedNodeId);
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
    
    if (!(window as any).JSMpeg || !(window as any).JSMpeg.Player) {
      showNotification('กำลังโหลด Player กรุณาลองใหม่อีกครั้ง...');
      return;
    }
    
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // 🚀 ยิงตรงเข้า WebSocket พอร์ต 8090 ของเซิร์ฟเวอร์ Node.js ที่เปิดอยู่
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:8090/?camera_id=${mappedNodeId}&start=${encodeURIComponent(selectedSegment.start)}&end=${encodeURIComponent(selectedSegment.end)}`;
    
    try {
      playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false
      });
      setIsPlaying(true);
    } catch (e) {
      console.error("JSMpeg Error:", e);
      showNotification('ไม่สามารถเชื่อมต่อสตรีมวิดีโอได้');
    }
  };

  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(Number(e.target.value));
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
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen font-sans relative">
      <div 
        className={`fixed top-20 md:top-8 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ease-in-out ${
          showPopup ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-orange-100 px-5 md:px-6 py-3 rounded-2xl md:rounded-full flex items-center gap-3 w-max max-w-[90vw]">
          <AlertCircle className="text-orange-500 shrink-0" size={20} />
          <span className="font-bold text-gray-700 text-sm leading-tight text-center md:text-left">{popupMessage}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(`/cctv-monitor/${nodeId}`)} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับไปหน้า Monitor
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-lg border border-gray-100">
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
              <button onClick={handleSearch} disabled={isLoading} className="w-full bg-[#48A0D8] text-white p-3 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95 touch-manipulation">
                {isLoading ? 'กำลังค้นหา...' : 'ค้นหาบันทึก'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Playback Viewer</h3>
              
              <div className="bg-black w-full aspect-video rounded-2xl flex items-center justify-center text-white mb-6 overflow-hidden relative">
                <canvas ref={canvasRef} className="w-full h-full block bg-black"></canvas>
                
                {!isPlaying && (
                   <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-sm md:text-base text-center px-4 pointer-events-none">
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
                      className={`absolute h-full bg-blue-500/60 border-r border-white/50 transition-all hover:opacity-100 cursor-pointer ${selectedSegment?.id === rec.id ? 'bg-blue-600 shadow-[0_0_0_2px_white_inset]' : ''}`}
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

              <div className="flex items-center gap-3 md:gap-4 mt-6 flex-wrap">
                <button 
                  onClick={playPlayback} 
                  disabled={!selectedSegment || isPlaying} 
                  className="flex-1 md:flex-none justify-center bg-green-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all shadow-md active:scale-95 touch-manipulation flex items-center gap-2 px-6 font-bold"
                >
                  <Play size={20} fill="currentColor" /> Play
                </button>
                
                <button onClick={stopPlayback} disabled={!isPlaying} className="flex-1 md:flex-none justify-center bg-red-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all shadow-md active:scale-95 touch-manipulation">
                  <Square size={20} fill="currentColor" /> Stop
                </button>

                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200 flex-1 md:flex-none justify-center">
                  <Settings2 size={18} className="text-gray-500 shrink-0" />
                  <select 
                    value={speed}
                    onChange={handleSpeedChange}
                    className="bg-transparent text-gray-700 font-bold border-0 outline-none cursor-pointer w-full"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1.0x (Normal)</option>
                    <option value="2">2.0x</option>
                    <option value="4">4.0x</option>
                  </select>
                </div>

                <div className="w-full md:w-auto md:ml-auto font-mono font-bold text-gray-700 flex items-center justify-center md:justify-end gap-2 bg-gray-100 px-4 py-2.5 md:py-2 rounded-xl">
                  <Clock size={18} className="text-[#48A0D8] shrink-0" /> 
                  <span className="text-sm">
                    {selectedSegment ? selectedSegment.start.split('T')[1].substring(0, 5) + ' - ' + selectedSegment.end.split('T')[1].substring(0, 5) : '--:--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}