import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Volume2, Pencil, Expand, 
  ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Square,
  ZoomIn, ZoomOut
} from 'lucide-react';

interface Camera {
  id: number;
  name: string;
  ip: string;
  ptz_ip: string;
  ptz_port: number;
  ptz_username: string;
  ptz_password?: string;
  location: string;
}

export default function CCTVMonitor() {
  const navigate = useNavigate();
  const { nodeId } = useParams(); // นี่คือ ID ของกล้อง
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(80);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  // 1. ดึงข้อมูลกล้องตัวนี้
  useEffect(() => {
    const fetchCamera = async () => {
      try {
        const res = await fetch('http://localhost/api/get_cameras.php');
        const result = await res.json();
        if (result.status === 'success') {
          const found = result.data.find((c: Camera) => c.id.toString() === nodeId);
          setCamera(found || null);
        }
      } catch (error) {
        console.error("Error fetching camera:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCamera();
  }, [nodeId]);

  // 2. ฟังก์ชันควบคุม PTZ
  const handlePTZ = async (command: string) => {
    if (!camera || !camera.ptz_ip) return;
    
    try {
      const payload = {
        action: command === 'stop' ? 'stop' : 'move',
        command: command,
        ptz_ip: camera.ptz_ip,
        ptz_port: camera.ptz_port,
        ptz_username: camera.ptz_username,
        ptz_password: camera.ptz_password || '',
        speed: 0.5
      };

      await fetch('http://localhost/api/ptz_proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("PTZ Control Error:", error);
    }
  };

  if (isLoading) return <div className="flex-1 h-screen flex items-center justify-center font-bold text-gray-500 animate-pulse">กำลังโหลดข้อมูลกล้อง...</div>;
  if (!camera) return <div className="flex-1 h-screen flex items-center justify-center font-bold text-red-500">ไม่พบข้อมูลกล้อง</div>;

  return (
    <main className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/cctv')} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับ
        </button>

        <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#48A0D8] p-5 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold">{camera.name}</h2>
            <button 
              onClick={() => navigate(`/cctv-playback/${nodeId}`)}
              className="bg-white/20 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-white/30 transition-all cursor-pointer"
            >
              Playback / ดูภาพย้อนหลัง
            </button>
          </div>

          <div className="w-full h-[400px] bg-black relative flex items-center justify-center">
            {/* แสดง Video Feed (ถ้าเป็น IP กล้องปกติ) */}
            <iframe src={camera.ip} className="w-full h-full border-0" allowFullScreen></iframe>
            
            {/* Toolbar ขวาล่าง */}
            <div className="absolute bottom-6 right-6 flex gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsVolumeOpen(!isVolumeOpen)} 
                  className={`p-3 rounded-2xl shadow-lg transition-all ${isVolumeOpen ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Volume2 size={20} className={isVolumeOpen ? "text-[#48A0D8]" : "text-gray-700"} />
                </button>
                {isVolumeOpen && (
                  <div className="absolute bottom-16 right-0 bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 flex items-center gap-4 w-64 z-50">
                    <Volume2 size={20} className="text-[#48A0D8]" />
                    <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full h-2 rounded-lg cursor-pointer" />
                    <span className="text-sm font-bold w-10 text-right">{volume}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ปุ่มควบคุม PTZ */}
        <div className="mt-10 flex flex-col items-center">
           <h4 className="font-bold text-gray-700 mb-4">ควบคุมทิศทางกล้อง</h4>
           
           <div className="grid grid-cols-3 gap-3 mb-3">
              <div></div>
              <button onMouseDown={() => handlePTZ('up')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowUp size={28} /></button>
              <div></div>
              
              <button onMouseDown={() => handlePTZ('left')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowLeftIcon size={28} /></button>
              <button onClick={() => handlePTZ('stop')} className="bg-red-600 p-5 rounded-2xl text-white hover:bg-red-700 shadow-lg transition-all"><Square size={28} /></button>
              <button onMouseDown={() => handlePTZ('right')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowRight size={28} /></button>
              
              <div></div>
              <button onMouseDown={() => handlePTZ('down')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowDown size={28} /></button>
              <div></div>
           </div>

           <div className="flex gap-4">
              <button onMouseDown={() => handlePTZ('zoomin')} onMouseUp={() => handlePTZ('stop')} className="bg-gray-700 p-4 rounded-xl text-white hover:bg-gray-800 transition-all"><ZoomIn /></button>
              <button onMouseDown={() => handlePTZ('zoomout')} onMouseUp={() => handlePTZ('stop')} className="bg-gray-700 p-4 rounded-xl text-white hover:bg-gray-800 transition-all"><ZoomOut /></button>
           </div>
        </div>
      </div>
    </main>
  );
}