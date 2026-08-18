import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Square, VideoOff, Video
} from 'lucide-react';
import { API_URL } from '../config';
import { useUsers } from '../context/UserContext';
import { logAction } from '../logger';

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
  const { currentUser } = useUsers();
  
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isNodeOnline, setIsNodeOnline] = useState(true); 
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Refs สำหรับ Lock การยิงคำสั่ง ไม่ให้คิวชนกัน (ป้องกันการ Pending)
  const isFetchingStatus = useRef(false);
  const lastCommand = useRef<string | null>(null);
  
  // ✅ เพิ่ม Ref สำหรับ AbortController (เอาไว้ตัดสายคำสั่งที่ค้าง)
  const ptzAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (camera && camera.name && currentUser) {
      logAction(currentUser.name, 'ดูกล้องวงจรปิด', camera.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera?.id]);

  // โหลดข้อมูลกล้องแค่ "ครั้งเดียว" ตอนเปิดหน้าต่าง
  useEffect(() => {
    let isCancelled = false;
    
    const fetchCameraOnce = async () => {
      setIsLoading(true);
      try {
        const camRes = await fetch(`${API_URL}/get_cameras.php`);
        const camData = await camRes.json();
        
        let cameraList: Camera[] = [];
        if (Array.isArray(camData)) {
          cameraList = camData;
        } else if (camData && Array.isArray(camData.data)) {
          cameraList = camData.data;
        }

        const idMapping: { [key: string]: string } = { "8": "7" };
        const targetCamId = idMapping[String(nodeId)] || String(nodeId);
        const found = cameraList.find((c: Camera) => c.id.toString() === targetCamId);
        
        if (!isCancelled) setCamera(found || null);
      } catch (error) {
        console.error("Error fetching camera:", error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchCameraOnce();
    return () => { isCancelled = true; };
  }, [nodeId]);

  // อัปเดตสถานะแบบมี Lock
  useEffect(() => {
    let isCancelled = false;

    const pollStatus = async () => {
      if (isFetchingStatus.current || isCancelled) return; 
      isFetchingStatus.current = true;

      try {
        const statusRes = await fetch(`${API_URL}/get_node_status.php?id=${nodeId}`);
        const statusData = await statusRes.json();
        if (!isCancelled) {
          setIsNodeOnline(statusData.status === 'success' && statusData.online); 
        }
      } catch (error) {
        if (!isCancelled) setIsNodeOnline(false);
      } finally {
        isFetchingStatus.current = false;
      }
    };

    pollStatus(); 
    const interval = setInterval(pollStatus, 8000); 
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [nodeId]);

  // ✅ ระบบควบคุม PTZ พร้อมตัวตัดสาย (Abort)
  const handlePTZ = useCallback(async (command: string) => {
    if (!camera || !camera.ptz_ip || !isNodeOnline) return;
    
    if (command !== 'stop' && lastCommand.current === command) return;
    lastCommand.current = command;
    
    // 🔴 ถ้ายิงคำสั่งใหม่เข้ามา แล้วคำสั่งเก่ายังค้าง (Pending) อยู่ ให้ตัดทิ้งทันที!
    if (ptzAbortController.current) {
      ptzAbortController.current.abort();
    }
    
    // สร้าง Controller ตัวใหม่สำหรับรอบนี้
    ptzAbortController.current = new AbortController();

    try {
      const payload = {
        action: command === 'stop' ? 'stop' : 'move',
        command: command,
        ptz_ip: camera.ptz_ip,
        ptz_port: camera.ptz_port || 80,
        ptz_username: camera.ptz_username || 'admin',
        ptz_password: camera.ptz_password || '',
        speed: 0.5
      };

      await fetch(`${API_URL}/ptz_proxy.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ptzAbortController.current.signal // 🔴 ผูก Signal ไว้กับตัวตัดสาย
      });
      
      if (command === 'stop') {
        lastCommand.current = null;
      }
    } catch (error: any) { 
      // 🔴 ถ้า Error เกิดจากการที่เราสั่งตัดสาย (Abort) ไม่ต้องตกใจและไม่ต้องแจ้งเตือน
      if (error.name === 'AbortError') {
        console.log(`เคลียร์คำสั่งที่ค้างสำเร็จ (เปลี่ยนเป็น: ${command})`);
      } else {
        console.error("PTZ Control Error:", error);
      }
      if (command === 'stop') lastCommand.current = null;
    }
  }, [camera, isNodeOnline]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; 
      
      switch (e.key) {
        case 'ArrowUp': handlePTZ('up'); break;
        case 'ArrowDown': handlePTZ('down'); break;
        case 'ArrowLeft': handlePTZ('left'); break;
        case 'ArrowRight': handlePTZ('right'); break;
        default: break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          handlePTZ('stop'); 
          break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePTZ]);

  const getSafeStreamUrl = (url: string) => {
    if (!url) return '';
    if (window.location.hostname === '192.168.88.254' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      return url.replace('171.99.250.125', window.location.hostname);
    }
    return url;
  };

  if (isLoading) return <div className="flex-1 h-screen flex items-center justify-center font-bold text-gray-500 animate-pulse">กำลังโหลดข้อมูลกล้อง...</div>;
  if (!camera) return <div className="flex-1 h-screen flex items-center justify-center font-bold text-red-500">ไม่พบข้อมูลกล้องในระบบ</div>;

  return (
    <main className="p-4 md:p-6 bg-gray-100 h-[calc(100vh-60px)] md:h-screen font-sans flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        
        <button 
          onClick={() => navigate('/cctv')} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-3 md:mb-4 hover:text-black transition-colors w-fit shrink-0"
        >
          <ArrowLeft size={20} /> กลับ
        </button>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 min-h-0">
          
          {/* 1. กล่องวิดีโอ */}
          <div className="flex-1 lg:flex-[2.5] bg-white rounded-2xl md:rounded-[32px] shadow-xl overflow-hidden border border-gray-100 flex flex-col min-h-0">
            {/* เปลี่ยนแถบ Header เป็นสีน้ำตาล */}
            <div className={`${isNodeOnline ? 'bg-[#9b765e]' : 'bg-gray-600'} p-3 md:p-5 flex justify-between items-center text-white transition-colors shrink-0`}>
              <div className="flex items-center gap-2 md:gap-3 truncate pr-2">
                <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ${isNodeOnline ? 'bg-[#76E136] animate-pulse shadow-[0_0_8px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
                <h2 className="text-sm md:text-xl font-bold truncate">{camera.name}</h2>
              </div>
              <button 
                onClick={() => navigate(`/cctv-playback/${nodeId}`)}
                className="bg-white/20 px-3 md:px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-bold hover:bg-white/30 transition-all cursor-pointer flex-shrink-0 active:scale-95 touch-manipulation select-none"
              >
                Playback / ดูภาพย้อนหลัง
              </button>
            </div>

            <div className="w-full flex-1 relative bg-[#0b0f19] flex items-center justify-center min-h-[200px]">
              {!isNodeOnline ? (
                <div className="text-center text-white flex flex-col items-center">
                  <VideoOff size={36} className="text-red-500 mb-2 md:mb-3 md:w-12 md:h-12" />
                  <p className="font-bold text-base md:text-xl">ไม่พบภาพ</p>
                  <p className="text-gray-400 text-xs md:text-sm mt-1">สถานีนี้กำลังขาดการติดต่อ (Offline)</p>
                </div>
              ) : camera.ip && camera.ip.includes('rtsp://') ? (
                <div className="text-center text-white">
                  <Video size={36} className="mx-auto mb-2 md:mb-3 text-gray-600 md:w-12 md:h-12" />
                  <p className="font-bold text-sm md:text-base">ระบบ RTSP</p>
                  <p className="text-xs md:text-sm text-gray-400">กำลังรอการเชื่อมต่อ Streaming Server</p>
                </div>
              ) : (
                <iframe src={getSafeStreamUrl(camera.ip)} className="w-full h-full absolute inset-0 border-0" allowFullScreen></iframe>
              )}
            </div>
          </div>

          {/* 2. กล่องควบคุม PTZ */}
          <div className={`w-full lg:w-[340px] shrink-0 bg-white rounded-2xl md:rounded-[32px] shadow-xl border border-gray-100 p-4 md:p-6 flex flex-col justify-center items-center transition-opacity ${!isNodeOnline ? 'opacity-50 pointer-events-none' : ''}`}>
             <h4 className="font-bold text-gray-700 mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
               <i className="fas fa-gamepad text-[#9b765e]"></i> ควบคุมทิศทางกล้อง
             </h4>
             
             <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div></div>
                <button 
                  onMouseDown={() => handlePTZ('up')} 
                  onMouseUp={() => handlePTZ('stop')}
                  onMouseLeave={() => handlePTZ('stop')}
                  onTouchStart={() => handlePTZ('up')}
                  onTouchEnd={() => handlePTZ('stop')}
                  // เปลี่ยนปุ่มเป็นสีน้ำตาล
                  className="bg-[#9b765e] p-5 rounded-xl md:rounded-2xl text-white hover:bg-[#8a6750] shadow-md transition-transform active:scale-90 touch-manipulation select-none flex items-center justify-center"
                >
                  <ArrowUp size={24} className="md:w-7 md:h-7" />
                </button>
                <div></div>
                
                <button 
                  onMouseDown={() => handlePTZ('left')} 
                  onMouseUp={() => handlePTZ('stop')}
                  onMouseLeave={() => handlePTZ('stop')}
                  onTouchStart={() => handlePTZ('left')}
                  onTouchEnd={() => handlePTZ('stop')}
                  className="bg-[#9b765e] p-5 rounded-xl md:rounded-2xl text-white hover:bg-[#8a6750] shadow-md transition-transform active:scale-90 touch-manipulation select-none flex items-center justify-center"
                >
                  <ArrowLeftIcon size={24} className="md:w-7 md:h-7" />
                </button>
                
                <button 
                  onClick={() => handlePTZ('stop')} 
                  className="bg-red-600 p-5 rounded-xl md:rounded-2xl text-white hover:bg-red-700 shadow-md transition-transform active:scale-90 touch-manipulation select-none flex items-center justify-center"
                >
                  <Square size={24} className="md:w-7 md:h-7" />
                </button>
                
                <button 
                  onMouseDown={() => handlePTZ('right')} 
                  onMouseUp={() => handlePTZ('stop')}
                  onMouseLeave={() => handlePTZ('stop')}
                  onTouchStart={() => handlePTZ('right')}
                  onTouchEnd={() => handlePTZ('stop')}
                  className="bg-[#9b765e] p-5 rounded-xl md:rounded-2xl text-white hover:bg-[#8a6750] shadow-md transition-transform active:scale-90 touch-manipulation select-none flex items-center justify-center"
                >
                  <ArrowRight size={24} className="md:w-7 md:h-7" />
                </button>
                
                <div></div>
                <button 
                  onMouseDown={() => handlePTZ('down')} 
                  onMouseUp={() => handlePTZ('stop')}
                  onMouseLeave={() => handlePTZ('stop')}
                  onTouchStart={() => handlePTZ('down')}
                  onTouchEnd={() => handlePTZ('stop')}
                  className="bg-[#9b765e] p-5 rounded-xl md:rounded-2xl text-white hover:bg-[#8a6750] shadow-md transition-transform active:scale-90 touch-manipulation select-none flex items-center justify-center"
                >
                  <ArrowDown size={24} className="md:w-7 md:h-7" />
                </button>
                <div></div>
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}