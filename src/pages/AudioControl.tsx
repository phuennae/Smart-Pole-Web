import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Clock, Play, Pause, Volume2, ChevronDown, CloudUpload, Calendar, X, Trash2 } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';

// --- AutoFit Component ---
function AutoFit() {
  const map = useMap();
  const { nodes } = useNodes();

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const bounds = nodes.map(n => [n.lat, n.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [nodes, map]);

  return null;
}

// --- Types ---
interface Schedule { id: number; days: string; time: string; file: string; volume: number; }

const smartPoleIcon = new Icon({ iconUrl: '/pole.png', iconSize: [40, 80], iconAnchor: [20, 80], popupAnchor: [0, -80] });

// --- AudioPoleMarker Component ---
function AudioPoleMarker({ node }: { node: NodeItem }) {
  const [online, setOnline] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [volume, setVolume] = useState(node.volume ?? 80); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. ดึงข้อมูล Real-time
  useEffect(() => {
    let isMounted = true;

    const fetchStatusAndFiles = async () => {
      try {
        const statusRes = await fetch(`http://localhost/api/get_node_status.php?id=${node.id}`);
        const statusData = await statusRes.json();

        if (isMounted && statusData.status === 'success') {
          const isOnline = statusData.online;
          setOnline(isOnline);

          // เช็คชื่อเพลงที่กำลังเล่นจริงจาก ESP32
          // 🔥 แก้ไขบั๊กสถานะเพลง: เช็คเพิ่มว่าหากบอร์ดส่งค่ามาเป็น None หรือค่าว่าง ให้ถือว่าไม่ได้เล่นเพลง
          if (statusData.song && statusData.song !== "" && statusData.song.toLowerCase() !== "none" && statusData.song.toLowerCase() !== "/none") {
            setIsPlaying(true);
            setSelectedFile(statusData.song.replace(/^\//, '')); 
          } else {
            setIsPlaying(false);
          }

          if (isOnline) {
            try {
              const fileRes = await fetch(`http://localhost/api/get_node_files.php?ip=${node.ip}&port=${node.port}`);
              const fileData = await fileRes.json();
              if (isMounted && fileData.status === 'success') {
                setFiles(fileData.files || []);
              } else {
                if (isMounted) setFiles([]);
              }
            } catch (fileErr) {
              console.error("Error fetching files:", fileErr);
              if (isMounted) setFiles([]); 
            }
          } else {
            if (isMounted) setFiles([]);
          }
        } else if (isMounted) {
          setOnline(false);
        }
      } catch (err) {
        console.error("Status check error:", err);
        if (isMounted) setOnline(false);
      }
    };

    fetchStatusAndFiles();
    const intervalId = setInterval(fetchStatusAndFiles, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [node.id, node.ip, node.port]);

  // 2. ฟังก์ชันสั่งเล่นเพลง
  const handlePlay = async () => {
    // 🔥 แก้ไขบั๊ก: ถ้ายังไม่ได้เลือกไฟล์เพลง หรือยังไม่ได้โหลดรายการไฟล์สำเร็จ จะไม่ยอมให้สั่งเล่น
    if (!selectedFile || selectedFile === "" || !online) {
      alert("กรุณาเลือกไฟล์เพลงก่อนกดเล่นครับ");
      return;
    }
    
    try {
      let filePath = selectedFile;
      if (filePath[0] !== '/') {
        filePath = '/' + filePath;
      }
      const url = `http://localhost/api/process_broadcast.php?action=play_single&ip=${node.ip}&port=${node.port}&file=${encodeURIComponent(filePath)}`;
      await fetch(url, { method: 'GET' });
      setIsPlaying(true);
    } catch (error) {
      console.error("Play error:", error);
      alert('เกิดข้อผิดพลาดในการสั่งเล่นเพลง');
    }
  };

  // 3. ฟังก์ชันสั่งหยุดเพลง
  const handleStop = async () => {
    if (!online) return;
    try {
      const url = `http://localhost/api/process_broadcast.php?action=stop_single&ip=${node.ip}&port=${node.port}`;
      await fetch(url, { method: 'GET' });
      setIsPlaying(false);
      // 🔥 ป้องกันบั๊กจำค่าค้าง: เมื่อกดหยุดเพลงให้เคลียร์การเลือกไฟล์ไปด้วย
      setSelectedFile(''); 
    } catch (error) {
      console.error("Stop error:", error);
      alert('เกิดข้อผิดพลาดในการสั่งหยุดเพลง');
    }
  };

  // 4. ฟังก์ชันอัปโหลดไฟล์
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !online) return;
    
    // 🔥 แก้ไขตรวจสอบไฟล์: บังคับเช็คเฉพาะนามสกุลไฟล์ .mp3 เท่านั้น
    if (!file.name.match(/\.(mp3)$/i)) {
      alert("ระบบรองรับเฉพาะไฟล์เพลงนามสกุล .mp3 เท่านั้นครับ");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('ip', node.ip);
      formData.append('port', node.port.toString());
      
      const res = await fetch('http://localhost/api/upload_audio.php', { 
        method: 'POST', 
        body: formData 
      });

      if (!res.ok) {
        throw new Error(`Server Error: ${res.status}`);
      }

      const data = await res.json();
      
      if(data.status === 'success') {
          alert('อัปโหลดไฟล์สำเร็จ!');
          setFiles(prev => [...prev, file.name]);
      } else {
          alert('อัปโหลดล้มเหลว: ' + data.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // 5. ฟังก์ชันปรับเสียง
  const handleSetVolume = async (newVolume: number) => {
    if (!online) return;
    try {
      const url = `http://localhost/api/process_broadcast.php?action=vol_single&id=${node.id}&ip=${node.ip}&port=${node.port}&v=${newVolume}`;
      await fetch(url, { method: 'GET' });
    } catch (error) {
      console.error("Volume Error:", error);
    }
  };

  return (
    <>
      <Marker position={[node.lat, node.lng]} icon={smartPoleIcon}>
        <Popup closeButton={false} className="custom-popup" minWidth={320} maxWidth={320}>
          <div className="w-[320px] flex flex-col font-sans shadow-2xl rounded-[20px] overflow-hidden border-0">
            
            {/* Header */}
            <div className="bg-[#48A0D8] px-4 py-3 flex justify-between items-center text-white transition-colors duration-300 gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-3.5 h-3.5 shrink-0 rounded-full ${online ? 'bg-[#76E136] animate-pulse shadow-[0_0_8px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
                <span className="font-bold text-2xl tracking-wide truncate" title={node.name}>{node.name}</span>
              </div>
              <button onClick={() => setShowSchedule(true)} className="bg-white text-black text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow-md hover:bg-gray-100 transition-colors whitespace-nowrap shrink-0">
                <Clock size={14} fill="currentColor" /> ตั้งเวลา
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 bg-gradient-to-br from-[#faebe1] to-[#e8d5c8] relative">
              
              {isUploading && (
                 <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center font-bold text-[#48A0D8] animate-pulse rounded-b-[20px]">
                    กำลังอัปโหลดไฟล์...
                 </div>
              )}
              
              <div className="flex items-center gap-3 mb-5">
                <Volume2 size={26} className="text-black" strokeWidth={2.5} shrink-0 />
                <input 
                  type="range" 
                  value={volume} 
                  onChange={(e) => setVolume(Number(e.target.value))} 
                  onMouseUp={() => handleSetVolume(volume)}
                  onTouchEnd={() => handleSetVolume(volume)}
                  className="w-full h-2 rounded-lg cursor-pointer custom-slider" 
                  style={{ background: `linear-gradient(to right, #48A0D8 ${volume}%, black ${volume}%)` }} 
                  disabled={!online}
                />
                <span className="text-xs font-bold text-black w-8 text-right shrink-0">{volume}%</span>
              </div>

              <div className="flex justify-between items-center gap-4">
                <div className="flex gap-2 shrink-0">
                  {/* 🔥 ปุ่ม Play: จะถูก disabled หรือกดไม่ได้ ถ้ายังไม่ได้เลือกไฟล์เพลง เพื่อกันบั๊ก */}
                  <button 
                    onClick={handlePlay} 
                    className={`w-12 h-[34px] flex items-center justify-center rounded-xl shadow-md ${online && selectedFile ? 'bg-[#519455] hover:scale-105' : 'bg-gray-400 opacity-50 cursor-not-allowed'}`} 
                    disabled={!online || !selectedFile}
                  >
                    <Play size={16} fill="white" className="text-white" />
                  </button>
                  <button 
                    onClick={handleStop} 
                    className={`w-12 h-[34px] flex items-center justify-center rounded-xl shadow-md ${online ? 'bg-[#A63535] hover:scale-105' : 'bg-gray-400 opacity-50 cursor-not-allowed'}`} 
                    disabled={!online}
                  >
                    <Pause size={16} fill="white" className="text-white" />
                  </button>
                </div>
                
                {!online ? (
                  <div className="flex-1 flex justify-center items-center h-full min-h-[50px]">
                    <span className="font-serif text-[18px] font-bold text-black">Node Offline</span>
                  </div>
                ) : files.length > 0 ? (
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="relative">
                      <select 
                        value={selectedFile} 
                        onChange={(e) => setSelectedFile(e.target.value)} 
                        className="w-full appearance-none text-[12px] font-medium bg-white rounded-full px-4 py-[6px] shadow-sm truncate"
                      >
                        <option value="">เลือกไฟล์...</option>
                        {files.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {/* 🔥 เพิ่ม accept=".mp3" ในส่วน input ให้เปิดเลือกหน้าต่างเฉพาะ .mp3 เท่านั้นตั้งแต่แรก */}
                    <label className="w-full flex items-center justify-between text-[12px] font-medium bg-white rounded-full px-4 py-[6px] shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                      <span>อัปโหลด</span><CloudUpload size={16} />
                      <input type="file" accept=".mp3" className="hidden" onChange={handleUpload} />
                    </label>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-center items-center h-full min-h-[50px]">
                    <span className="text-[13px] font-bold text-gray-500 bg-white/50 px-4 py-1.5 rounded-full shadow-sm">ไม่พบไฟล์เพลง</span>
                  </div>
                )}

              </div>

              {online && (
                <div className="mt-4 pt-3 border-t border-gray-300/40 text-[12px] font-extrabold flex justify-between">
                  <span className="shrink-0">สถานะ</span>
                  {/* 🔥 หากไม่มีไฟล์ หรือไฟล์ระบุเป็นค่าว่าง/none จะไม่พ่น 'กำลังเล่น: none' ออกมาป่วนผู้ใช้ */}
                  <span className={`truncate text-right pl-2 ${isPlaying && selectedFile ? "text-[#519455]" : "text-[#A63535]"}`}>
                    {isPlaying && selectedFile ? `กำลังเล่น : ${selectedFile}` : 'หยุดเล่น'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      {showSchedule && (
        <ScheduleModal 
          node={node} 
          files={files} 
          onClose={() => setShowSchedule(false)} 
        />
      )}
    </>
  );
}

// --- Main Page Component ---
export default function AudioControl() {
  const { nodes } = useNodes();

  return (
    <main className="flex-1 h-screen relative bg-gray-100 font-sans">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        <AutoFit />

        {nodes.map((node) => (
          <AudioPoleMarker key={node.id} node={node} />
        ))}
      </MapContainer>
    </main>
  );
}

// --- Schedule Modal ---
function ScheduleModal({ node, files, onClose }: { node: NodeItem, files: string[], onClose: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newDays, setNewDays] = useState('ทุกวัน');
  const [newTime, setNewTime] = useState('');
  const [newFile, setNewFile] = useState('');
  const [newVolume, setNewVolume] = useState('80');

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost/api/get_schedules.php?node_id=${node.id}`);
      const result = await res.json();
      if (result.status === 'success') {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [node.id]);

  const handleSave = async () => {
    if (!newTime) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('node_id', node.id);
      formData.append('ip', node.ip);
      formData.append('port', node.port);
      formData.append('days', newDays);
      formData.append('time', newTime);
      formData.append('file', newFile || (files[0] ?? '-'));
      formData.append('volume', newVolume);

      await fetch('http://localhost/api/add_schedule.php', { method: 'POST', body: formData });
      
      setNewTime('');
      await fetchSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm('ต้องการลบเวลานี้ใช่หรือไม่?')) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('id', scheduleId.toString());
      formData.append('node_id', node.id);
      formData.append('ip', node.ip);
      formData.append('port', node.port);

      await fetch('http://localhost/api/delete_schedule.php', { method: 'POST', body: formData });
      
      await fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#EAEAEA] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-300">
        
        <div className="bg-[#48A0D8] p-5 flex justify-between items-center text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3"><Calendar size={24} /> ตารางเวลา : {node.name}</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8">
          <div className="bg-gray-200 p-6 rounded-2xl grid grid-cols-4 gap-4 items-end mb-8 relative">
             {isSaving && (
               <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                 <div className="font-bold text-gray-700 animate-pulse flex items-center gap-2">
                    <Clock size={18} className="animate-spin" /> กำลังส่งข้อมูลไปยังเสา...
                 </div>
               </div>
             )}
             
             <div>
               <label className="block text-xs font-bold mb-1.5 ml-1">Days / วัน</label>
               <select onChange={(e) => setNewDays(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border-0 shadow-sm outline-none">
                  {['ทุกวัน', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์', 'วันทำงาน(จ-ศ)'].map(d=><option key={d}>{d}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold mb-1.5 ml-1">Time / เวลา</label>
               <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full p-2.5 rounded-xl text-sm border-0 shadow-sm outline-none" />
             </div>
             <div>
               <label className="block text-xs font-bold mb-1.5 ml-1">File / ไฟล์เพลง</label>
               <select onChange={(e) => setNewFile(e.target.value)} className="w-full p-2.5 rounded-xl text-sm border-0 shadow-sm outline-none">
                  {files.length > 0 ? files.map(f => <option key={f} value={f}>{f}</option>) : <option>ไม่มีไฟล์เพลง</option>}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold mb-1.5 ml-1">Volume / ระดับเสียง</label>
               <input type="number" onChange={(e) => setNewVolume(e.target.value)} placeholder="80" defaultValue="80" className="w-full p-2.5 rounded-xl text-sm border-0 shadow-sm outline-none" />
             </div>
          </div>
          
          <button onClick={handleSave} disabled={isSaving || !newTime} className="bg-[#519455] text-white px-10 py-2 rounded-full font-bold mx-auto block hover:bg-green-700 disabled:bg-gray-400 transition-all shadow-md">
            Save / บันทึก
          </button>

          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[150px]">
             <div className="grid grid-cols-12 p-4 font-bold text-sm bg-gray-50 border-b border-gray-200">
               <div className="col-span-3">Days / วัน</div>
               <div className="col-span-3">Time / เวลา</div>
               <div className="col-span-3">File / ไฟล์เพลง</div>
               <div className="col-span-2">Volume</div>
               <div className="col-span-1 text-center">ลบ</div>
             </div>
             
             {isLoading ? (
                <div className="p-8 text-center text-gray-500 font-bold animate-pulse">กำลังโหลดตารางเวลา...</div>
             ) : schedules.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold">ยังไม่มีตารางเวลาสำหรับเสานี้</div>
             ) : (
                schedules.map(s => (
                 <div key={s.id} className="grid grid-cols-12 p-4 border-b border-gray-100 items-center text-sm hover:bg-gray-50">
                    <div className="col-span-3 font-bold">{s.days}</div>
                    <div className="col-span-3">{s.time}</div>
                    <div className="col-span-3">{s.file}</div>
                    <div className="col-span-2">{s.volume}%</div>
                    <div className="col-span-1 text-center">
                       <button onClick={() => handleDelete(s.id)} disabled={isSaving} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                          <Trash2 size={18}/>
                       </button>
                    </div>
                 </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}