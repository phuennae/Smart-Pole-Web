import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock, Play, Pause, Volume2, ChevronDown, CloudUpload, Calendar, X, Trash2, Music, BatteryCharging, Focus } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';
import { useUsers } from '../context/UserContext';
import { API_URL } from '../config';
import { logAction } from '../logger';

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

// --- Recenter Control ---
function RecenterControl({ nodes }: { nodes: NodeItem[] }) {
  const map = useMap();

  const handleRecenter = () => {
    if (nodes && nodes.length > 0) {
      const bounds = nodes.map(node => [node.lat, node.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [80, 80] }); 
    }
  };

  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '35px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar shadow-xl">
        <button
          onClick={handleRecenter}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded flex items-center justify-center transition-colors"
          style={{ width: '34px', height: '34px', border: 'none', outline: 'none' }}
          title="ซูมกลับมายังเสาทั้งหมด"
        >
          <Focus size={20} className="text-gray-900" />
        </button>
      </div>
    </div>
  );
}

// --- Types ---
interface Schedule { id: number; days: string; time: string; file: string; volume: number; }

// --- AudioPoleMarker Component ---
function AudioPoleMarker({ 
  node, 
  isSelected, 
  onSelect 
}: { 
  node: NodeItem; 
  isSelected: boolean; 
  onSelect: (node: NodeItem) => void; 
}) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/get_node_status.php?id=${node.id}`);
        const data = await res.json();
        
        if (isMounted && data.status === 'success') {
          setOnline(data.online);
        } else if (isMounted) {
          setOnline(false);
        }
      } catch (err) {
        if (isMounted) setOnline(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [node.id]);

  const statusDot = online ? 'bg-[#76E136]' : 'bg-red-500';
  const filterStyle = online 
    ? (isSelected ? 'drop-shadow(0 0 10px rgba(72,160,216,0.9))' : 'none') 
    : 'grayscale(100%) opacity(60%)';

  const customIcon = L.divIcon({
    className: 'custom-audio-icon',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 100px; transition: all 0.3s; cursor: pointer; transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'}">
        <img src="/pole.png" style="width: 40px; height: 80px; object-fit: contain; filter: ${filterStyle};" />
        <div class="${isSelected ? 'bg-[#48A0D8]' : 'bg-gray-900'} text-white px-2.5 py-1 rounded-full font-bold shadow-lg text-[11px] mt-1 border border-white text-center whitespace-nowrap flex items-center justify-center gap-1.5 transition-colors duration-300">
          <div class="w-1.5 h-1.5 rounded-full ${statusDot} ${online && isSelected ? 'animate-pulse' : ''}"></div>
          ${node.name}
        </div>
      </div>
    `,
    iconSize: [100, 110],
    iconAnchor: [50, 100]
  });

  return (
    <Marker 
      position={[node.lat, node.lng]} 
      icon={customIcon}
      eventHandlers={{ click: () => onSelect(node) }}
    />
  );
}

// --- AudioSidebar Component ---
function AudioSidebar({ node, onClose }: { node: NodeItem; onClose: () => void }) {
  const { currentUser } = useUsers();
  
  const [online, setOnline] = useState(false);
  const [batteryPct, setBatteryPct] = useState<number | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [volume, setVolume] = useState<number>(80); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ เพิ่มฟังก์ชันนี้เพื่อยิงไปดึงค่าระดับเสียงล่าสุดจาก Database ทุกครั้งที่เปิด Sidebar
  useEffect(() => {
    let isMounted = true;

    const fetchLatestVolume = async () => {
      try {
        const res = await fetch(`${API_URL}/get_nodes.php`);
        const data = await res.json();
        const nodeList = Array.isArray(data) ? data : (data.data || []);
        const currentNode = nodeList.find((n: any) => n.id.toString() === node.id.toString());
        
        if (isMounted && currentNode && currentNode.last_volume != null) {
          setVolume(Number(currentNode.last_volume));
        } else if (isMounted) {
          // ถ้าไม่มีค่าใน DB ค่อยกลับไปใช้ 80
          setVolume(Number((node as any).last_volume ?? node.volume ?? 80));
        }
      } catch (err) {
        console.error("Fetch volume error", err);
        if (isMounted) setVolume(80);
      }
    };

    fetchLatestVolume();

    return () => { isMounted = false; };
  }, [node.id]);

  useEffect(() => {
    let isMounted = true;

    const fetchStatusAndFiles = async () => {
      try {
        const statusRes = await fetch(`${API_URL}/get_node_status.php?id=${node.id}`);
        const statusData = await statusRes.json();

        if (isMounted && statusData.status === 'success') {
          const isOnline = statusData.online;
          setOnline(isOnline);

          if (statusData.data && statusData.data.battery_pct !== undefined) {
            setBatteryPct(statusData.data.battery_pct);
          } else {
            setBatteryPct(null);
          }

          if (statusData.song && statusData.song !== "" && statusData.song.toLowerCase() !== "none" && statusData.song.toLowerCase() !== "/none") {
            setIsPlaying(true);
            setSelectedFile(statusData.song.replace(/^\//, '')); 
          } else {
            setIsPlaying(false);
          }

          if (isOnline) {
            try {
              const fileRes = await fetch(`${API_URL}/get_node_files.php?ip=${node.ip}&port=${node.port}`);
              const fileData = await fileRes.json();
              if (isMounted && fileData.status === 'success') {
                setFiles(fileData.files || []);
              } else {
                if (isMounted) setFiles([]);
              }
            } catch (fileErr) {
              if (isMounted) setFiles([]); 
            }
          } else {
            if (isMounted) setFiles([]);
          }
        } else if (isMounted) {
          setOnline(false);
        }
      } catch (err) {
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

  const handlePlay = async () => {
    if (!selectedFile || selectedFile === "" || !online) {
      alert("กรุณาเลือกไฟล์เพลงก่อนกดเล่นครับ");
      return;
    }
    
    try {
      let filePath = selectedFile;
      if (filePath[0] !== '/') filePath = '/' + filePath;
      const url = `${API_URL}/process_broadcast.php?action=play_single&ip=${node.ip}&port=${node.port}&file=${encodeURIComponent(filePath)}`;
      await fetch(url, { method: 'GET' });
      setIsPlaying(true);

      logAction(currentUser?.name || 'Unknown', `เปิดไฟล์เสียง: ${selectedFile}`, node.name);
      
    } catch (error) {
      console.error("Play error:", error);
      alert('เกิดข้อผิดพลาดในการสั่งเล่นเพลง');
    }
  };

  const handleStop = async () => {
    if (!online) return;
    try {
      const url = `${API_URL}/process_broadcast.php?action=stop_single&ip=${node.ip}&port=${node.port}`;
      await fetch(url, { method: 'GET' });
      setIsPlaying(false);
      setSelectedFile(''); 
    } catch (error) {
      console.error("Stop error:", error);
      alert('เกิดข้อผิดพลาดในการสั่งหยุดเพลง');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser?.role === 'USER') {
      alert("สิทธิ์ผู้ใช้งานทั่วไป ไม่สามารถอัปโหลดไฟล์เพลงได้ครับ");
      return;
    }

    const file = e.target.files?.[0];
    if (!file || !online) return;
    
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
      
      const res = await fetch(`${API_URL}/upload_audio.php`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);

      const data = await res.json();
      if(data.status === 'success') {
          alert('อัปโหลดไฟล์สำเร็จ!');
          setFiles(prev => [...prev, file.name]);
      } else {
          alert('อัปโหลดล้มหลว: ' + data.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSetVolume = async (newVolume: number) => {
    if (!online) return;
    try {
      const url = `${API_URL}/process_broadcast.php?action=vol_single&id=${node.id}&ip=${node.ip}&port=${node.port}&v=${newVolume}`;
      await fetch(url, { method: 'GET' });
    } catch (error) {
      console.error("Volume Error:", error);
    }
  };

  return (
    <>
      <div className="w-[360px] shrink-0 h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-200 flex flex-col z-10 relative transition-all duration-300">
        
        <div className="bg-white px-6 py-6 border-b border-gray-100 flex flex-col relative shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-5 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          <div className="pr-10">
            <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight truncate">{node.name}</h2>
            
            <div className="flex items-center gap-3 mt-3">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${online ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {online ? 'Online' : 'Offline'}
              </div>

              {online && batteryPct !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0F7FF] text-[#48A0D8] border border-[#D0E6FB]">
                  <BatteryCharging size={14} /> {batteryPct}%
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 bg-[#F8FAFC] overflow-y-auto relative">
          
          {isUploading && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center font-bold text-[#48A0D8] flex-col gap-3 animate-pulse">
                <CloudUpload size={40} />
                กำลังอัปโหลดไฟล์ลงเสา...
             </div>
          )}

          <div className="flex justify-between items-end mb-4 gap-2">
            <p className="text-[11px] font-extrabold text-gray-400 tracking-widest uppercase shrink-0">
              Audio Control
            </p>
            {online && (
              <span 
                title={isPlaying && selectedFile ? `กำลังเล่น : ${selectedFile}` : 'หยุดเล่น'}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border truncate max-w-[180px] ${isPlaying && selectedFile ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}
              >
                {isPlaying && selectedFile ? `▶ กำลังเล่น : ${selectedFile}` : '■ หยุดเล่น'}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            
            <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-5">
              {!online ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music size={24} />
                  </div>
                  <p className="text-sm font-bold text-red-600">อุปกรณ์ขาดการเชื่อมต่อ</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-600">เลือกไฟล์เพลง</label>
                    {files.length > 0 ? (
                      <div className="relative">
                        <select 
                          value={selectedFile} 
                          onChange={(e) => setSelectedFile(e.target.value)} 
                          className="w-full appearance-none text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-[#48A0D8]/50 truncate"
                        >
                          <option value="">-- เลือกไฟล์ --</option>
                          {files.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-gray-400">
                        ไม่พบไฟล์เพลงในระบบ
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handlePlay} 
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-sm ${online && selectedFile ? 'bg-[#519455] text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} 
                      disabled={!online || !selectedFile}
                    >
                      <Play size={18} fill="currentColor" /> เล่น
                    </button>
                    <button 
                      onClick={handleStop} 
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-sm ${online ? 'bg-[#A63535] text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} 
                      disabled={!online}
                    >
                      <Pause size={18} fill="currentColor" /> หยุด
                    </button>
                  </div>

                  {currentUser?.role !== 'USER' && (
                    <label className="w-full mt-1 flex items-center justify-center gap-2 text-sm font-bold bg-[#F0F7FF] text-[#48A0D8] border border-[#D0E6FB] rounded-xl px-4 py-2.5 hover:bg-[#E5F3FF] transition-colors cursor-pointer shadow-sm">
                      <CloudUpload size={18} />
                      <span>อัปโหลดไฟล์เพลงใหม่ (.mp3)</span>
                      <input type="file" accept=".mp3" className="hidden" onChange={handleUpload} />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-5">
               <div className="flex justify-between items-center mb-3">
                 <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5"><Volume2 size={16}/> ระดับเสียง</label>
                 <span className="text-sm font-extrabold text-[#48A0D8]">{volume}%</span>
               </div>
               <input 
                  type="range" 
                  value={volume} 
                  onChange={(e) => setVolume(Number(e.target.value))} 
                  onMouseUp={() => handleSetVolume(volume)}
                  onTouchEnd={() => handleSetVolume(volume)}
                  className="w-full h-2 rounded-lg cursor-pointer custom-slider opacity-90 hover:opacity-100 disabled:opacity-50" 
                  style={{ background: `linear-gradient(to right, #48A0D8 ${volume}%, #E2E8F0 ${volume}%)` }} 
                  disabled={!online}
                />
            </div>
            
            <button 
              onClick={() => setShowSchedule(true)} 
              className="mt-2 w-full bg-gray-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!online}
            >
              <Calendar size={18} /> จัดการตารางเปิด-ปิดไฟล์เสียง
            </button>

          </div>
        </div>
      </div>

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

export default function AudioControl() {
  const { nodes } = useNodes();
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);

  return (
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-[#F8FAFC] flex overflow-hidden">
      
      <div className="flex-1 h-full relative z-0">
        <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <AutoFit />
          <RecenterControl nodes={nodes} />

          {nodes.map((node) => (
            <AudioPoleMarker 
              key={node.id} 
              node={node} 
              isSelected={selectedNode?.id === node.id}
              onSelect={(targetNode) => setSelectedNode(targetNode)} 
            />
          ))}
        </MapContainer>
      </div>

      {selectedNode && (
        <AudioSidebar 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </main>
  );
}

// --- Schedule Modal (คงเดิม) ---
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
      const res = await fetch(`${API_URL}/get_schedules.php?node_id=${node.id}`);
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

      await fetch(`${API_URL}/add_schedule.php`, { method: 'POST', body: formData });
      
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

      await fetch(`${API_URL}/delete_schedule.php`, { method: 'POST', body: formData });
      
      await fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#F8FAFC] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        
        <div className="bg-white border-b border-gray-100 p-5 flex justify-between items-center text-gray-900">
          <h2 className="text-xl font-extrabold flex items-center gap-3"><Calendar size={22} className="text-[#48A0D8]" /> ตารางเวลา : {node.name}</h2>
          <button onClick={onClose} className="hover:bg-gray-100 text-gray-400 hover:text-gray-800 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-8">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl grid grid-cols-4 gap-4 items-end mb-8 relative shadow-sm">
             {isSaving && (
               <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                 <div className="font-bold text-[#48A0D8] animate-pulse flex items-center gap-2">
                    <Clock size={18} className="animate-spin" /> กำลังส่งข้อมูลไปยังเสา...
                 </div>
               </div>
             )}
             
             <div>
               <label className="block text-xs font-bold mb-2 ml-1 text-gray-600">Days / วัน</label>
               <select onChange={(e) => setNewDays(e.target.value)} className="w-full p-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 outline-none focus:ring-2 ring-[#48A0D8]/50">
                  {['ทุกวัน', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์', 'วันทำงาน(จ-ศ)'].map(d=><option key={d}>{d}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold mb-2 ml-1 text-gray-600">Time / เวลา</label>
               <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full p-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 outline-none focus:ring-2 ring-[#48A0D8]/50" />
             </div>
             <div>
               <label className="block text-xs font-bold mb-2 ml-1 text-gray-600">File / ไฟล์เพลง</label>
               <select onChange={(e) => setNewFile(e.target.value)} className="w-full p-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 outline-none focus:ring-2 ring-[#48A0D8]/50">
                  {files.length > 0 ? files.map(f => <option key={f} value={f}>{f}</option>) : <option>ไม่มีไฟล์เพลง</option>}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold mb-2 ml-1 text-gray-600">Volume / ระดับเสียง</label>
               <input type="number" onChange={(e) => setNewVolume(e.target.value)} placeholder="80" defaultValue="80" className="w-full p-2.5 rounded-xl text-sm font-medium bg-gray-50 border border-gray-200 outline-none focus:ring-2 ring-[#48A0D8]/50" />
             </div>
          </div>
          
          <button onClick={handleSave} disabled={isSaving || !newTime} className="bg-[#48A0D8] text-white px-10 py-3 rounded-xl font-bold mx-auto block hover:bg-blue-500 disabled:bg-gray-300 transition-all shadow-md">
            + เพิ่มตารางเวลา
          </button>

          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[150px]">
             <div className="grid grid-cols-12 p-4 font-bold text-xs uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
               <div className="col-span-3">Days / วัน</div>
               <div className="col-span-3">Time / เวลา</div>
               <div className="col-span-3">File / ไฟล์เพลง</div>
               <div className="col-span-2">Volume</div>
               <div className="col-span-1 text-center">ลบ</div>
             </div>
             
             {isLoading ? (
                <div className="p-8 text-center text-[#48A0D8] font-bold animate-pulse">กำลังโหลดตารางเวลา...</div>
             ) : schedules.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold">ยังไม่มีตารางเวลาสำหรับเสานี้</div>
             ) : (
                schedules.map(s => (
                 <div key={s.id} className="grid grid-cols-12 p-4 border-b border-gray-100 items-center text-sm font-medium hover:bg-gray-50 transition-colors">
                    <div className="col-span-3 text-gray-900 font-bold">{s.days}</div>
                    <div className="col-span-3 text-gray-600">{s.time}</div>
                    <div className="col-span-3 text-gray-600 truncate pr-2">{s.file}</div>
                    <div className="col-span-2 text-[#48A0D8] font-bold">{s.volume}%</div>
                    <div className="col-span-1 text-center">
                       <button onClick={() => handleDelete(s.id)} disabled={isSaving} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
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