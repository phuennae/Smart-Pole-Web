import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Volume2, Expand, 
  ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Square,
  ZoomIn, ZoomOut, VideoOff, Video
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
  const { nodeId } = useParams(); 
  
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isNodeOnline, setIsNodeOnline] = useState(true); // เพิ่ม State เก็บสถานะว่าเครื่องออฟไลน์หรือไม่
  const [isLoading, setIsLoading] = useState(true);
  
  const [volume, setVolume] = useState(80);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. ดึงข้อมูลตัวกล้อง
        const camRes = await fetch('http://localhost/api/get_cameras.php');
        const camData = await camRes.json();
        if (camData.status === 'success') {
          const found = camData.data.find((c: Camera) => c.id.toString() === nodeId);
          setCamera(found || null);
        }

        // 2. ดึงข้อมูลสถานะ Online/Offline ของเสา
        const statusRes = await fetch(`http://localhost/api/get_node_status.php?id=${nodeId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'success') {
          setIsNodeOnline(statusData.online); // ถ้า online: true คือเสียบปลั๊กอยู่ (ภาพจะขึ้นแม้ไม่มี SD Card)
        } else {
          setIsNodeOnline(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsNodeOnline(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    // สั่งเช็คสถานะอัปเดตทุก 10 วินาที
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [nodeId]);

  const handlePTZ = async (command: string) => {
    if (!camera || !camera.ptz_ip || !isNodeOnline) return;
    
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
  if (!camera) return <div className="flex-1 h-screen flex items-center justify-center font-bold text-red-500">ไม่พบข้อมูลกล้องในระบบ</div>;

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
          <div className={`${isNodeOnline ? 'bg-[#48A0D8]' : 'bg-gray-600'} p-5 flex justify-between items-center text-white transition-colors`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isNodeOnline ? 'bg-[#76E136] animate-pulse shadow-[0_0_8px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
              <h2 className="text-xl font-bold">{camera.name}</h2>
            </div>
            <button 
              onClick={() => navigate(`/cctv-playback/${nodeId}`)}
              className="bg-white/20 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-white/30 transition-all cursor-pointer"
            >
              Playback / ดูภาพย้อนหลัง
            </button>
          </div>

          <div className="w-full h-[400px] bg-black relative flex items-center justify-center border-b border-gray-200">
            
            {/* เช็คเงื่อนไขโชว์ภาพวิดีโอ */}
            {!isNodeOnline ? (
              // กรณี 1: เสาไม่ได้เสียบปลั๊ก/ออฟไลน์ -> โชว์ ไม่พบภาพ ทันที
              <div className="text-center text-white flex flex-col items-center">
                <VideoOff size={48} className="text-red-500 mb-3" />
                <p className="font-bold text-xl">ไม่พบภาพ</p>
                <p className="text-gray-400 text-sm mt-1">สถานีนี้กำลังขาดการติดต่อ (Offline)</p>
              </div>
            ) : camera.ip.includes('rtsp://') ? (
              // กรณี 2: เสาออนไลน์ แต่ใช้ RTSP (ต้องผ่าน Server)
              <div className="text-center text-white">
                <Video size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="font-bold">ระบบ RTSP</p>
                <p className="text-sm text-gray-400">กำลังรอการเชื่อมต่อ Streaming Server</p>
              </div>
            ) : (
              // กรณี 3: เสาออนไลน์ เป็น HTTP/IP ปกติ -> โชว์ iframe 
              // (ไม่สนใจว่ามี SD card หรือไม่ ภาพก็จะโชว์)
              <iframe src={camera.ip} className="w-full h-full border-0" allowFullScreen></iframe>
            )}

            {/* Toolbar ขวาล่าง (โชว์เฉพาะตอนที่เครื่องออนไลน์) */}
            {isNodeOnline && (
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
                <button className="p-3 bg-white rounded-2xl shadow-lg hover:bg-gray-50 text-gray-700 transition-all">
                  <Expand size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ปุ่มควบคุม PTZ */}
        <div className={`mt-10 flex flex-col items-center transition-opacity ${!isNodeOnline ? 'opacity-50 pointer-events-none' : ''}`}>
           <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
             <i className="fas fa-gamepad text-[#48A0D8]"></i> ควบคุมทิศทางกล้อง
           </h4>
           
           <div className="grid grid-cols-3 gap-3 mb-3">
              <div></div>
              <button onMouseDown={() => handlePTZ('up')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all active:scale-95"><ArrowUp size={28} /></button>
              <div></div>
              
              <button onMouseDown={() => handlePTZ('left')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all active:scale-95"><ArrowLeftIcon size={28} /></button>
              <button onClick={() => handlePTZ('stop')} className="bg-red-600 p-5 rounded-2xl text-white hover:bg-red-700 shadow-lg transition-all active:scale-95"><Square size={28} /></button>
              <button onMouseDown={() => handlePTZ('right')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all active:scale-95"><ArrowRight size={28} /></button>
              
              <div></div>
              <button onMouseDown={() => handlePTZ('down')} onMouseUp={() => handlePTZ('stop')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all active:scale-95"><ArrowDown size={28} /></button>
              <div></div>
           </div>

           <div className="flex gap-4">
              <button onMouseDown={() => handlePTZ('zoomin')} onMouseUp={() => handlePTZ('stop')} className="bg-gray-700 py-3 px-6 rounded-xl font-bold text-white hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md active:scale-95"><ZoomIn size={18}/> ซูมเข้า</button>
              <button onMouseDown={() => handlePTZ('zoomout')} onMouseUp={() => handlePTZ('stop')} className="bg-gray-700 py-3 px-6 rounded-xl font-bold text-white hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md active:scale-95"><ZoomOut size={18}/> ซูมออก</button>
           </div>
        </div>
      </div>
    </main>
  );
}