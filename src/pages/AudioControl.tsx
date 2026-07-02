import 'leaflet/dist/leaflet.css';
import { useState } from 'react'; // ลบ ChangeEvent ออกเพื่อแก้ Error
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Clock, Play, Pause, Volume2, ChevronDown, CloudUpload, Calendar, X, Trash2 } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';

// --- Types ---
interface Schedule { id: number; days: string; time: string; file: string; volume: number; }

const smartPoleIcon = new Icon({ iconUrl: '/pole.png', iconSize: [40, 80], iconAnchor: [20, 80], popupAnchor: [0, -80] });

// --- Main Page Component ---
export default function AudioControl() {
  const { nodes } = useNodes(); // ดึงข้อมูล nodes ทั้งหมดจาก Context
  const [scheduleNode, setScheduleNode] = useState<NodeItem | null>(null);

  return (
    <main className="flex-1 h-screen relative bg-gray-100 font-sans">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        {nodes.map((node) => (
          <Marker key={node.id} position={[node.lat, node.lng]} icon={smartPoleIcon}>
            <Popup closeButton={false} className="custom-popup" minWidth={320} maxWidth={320}>
              <AudioCard node={node} onOpenSchedule={() => setScheduleNode(node)} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {scheduleNode && <ScheduleModal node={scheduleNode} onClose={() => setScheduleNode(null)} />}
    </main>
  );
}

// --- Audio Card Sub-component ---
// เปลี่ยน Type จาก AudioNode เป็น NodeItem ที่มาจาก Context
function AudioCard({ node, onOpenSchedule }: { node: NodeItem, onOpenSchedule: () => void }) {
  const [volume, setVolume] = useState(node.volume ?? 80); // ถ้าไม่มี volume ให้ default เป็น 80
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');

  return (
    <div className="w-[320px] flex flex-col font-sans shadow-2xl rounded-[20px] overflow-hidden border-0">
      <div className="bg-[#48A0D8] px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full ${node.status === 'online' ? 'bg-[#76E136] animate-pulse' : 'bg-red-500'}`} />
          <span className="font-bold text-2xl tracking-wide">{node.name}</span>
        </div>
        <button onClick={onOpenSchedule} className="bg-white text-black text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow-md hover:bg-gray-100 transition-colors">
          <Clock size={14} fill="currentColor" /> ตั้งเวลา
        </button>
      </div>
      <div className="px-5 py-4 bg-gradient-to-br from-[#faebe1] to-[#e8d5c8]">
        <div className="flex items-center gap-3 mb-5">
          <Volume2 size={26} className="text-black" strokeWidth={2.5} />
          <input type="range" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full h-2 rounded-lg cursor-pointer custom-slider" style={{ background: `linear-gradient(to right, #48A0D8 ${volume}%, black ${volume}%)` }} disabled={node.status === 'offline'} />
          <span className="text-xs font-bold text-black w-8 text-right">{volume}%</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <button onClick={() => selectedFile && setIsPlaying(true)} className={`w-12 h-[34px] flex items-center justify-center rounded-xl shadow-md ${node.status === 'online' ? 'bg-[#519455] hover:scale-105' : 'bg-gray-400'}`}><Play size={16} fill="white" className="text-white" /></button>
            <button onClick={() => setIsPlaying(false)} className={`w-12 h-[34px] flex items-center justify-center rounded-xl shadow-md ${node.status === 'online' ? 'bg-[#A63535] hover:scale-105' : 'bg-gray-400'}`}><Pause size={16} fill="white" className="text-white" /></button>
          </div>
          {node.status === 'online' ? (
            <div className="flex flex-col gap-2 flex-1">
              <div className="relative"><select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)} className="w-full appearance-none text-[12px] font-medium bg-white rounded-full px-4 py-[6px] shadow-sm"><option value="">เลือกไฟล์...</option><option value="เพลงชาติไทย.mp3">เพลงชาติไทย.mp3</option></select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2" /></div>
              <button className="w-full flex items-center justify-between text-[12px] font-medium bg-white rounded-full px-4 py-[6px] shadow-sm"><span>อัปโหลด</span><CloudUpload size={16} /></button>
            </div>
          ) : <div className="text-sm font-bold text-gray-500">Offline</div>}
        </div>
        {node.status === 'online' && (
          <div className="mt-4 pt-3 border-t border-gray-300/40 text-[12px] font-extrabold flex justify-between">
            <span>สถานะ</span>
            <span className={isPlaying ? "text-[#519455]" : "text-[#A63535]"}>{isPlaying ? `กำลังเล่น : ${selectedFile}` : 'หยุดเล่น'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Schedule Modal ---
function ScheduleModal({ node, onClose }: { node: NodeItem, onClose: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>([{ id: 1, days: 'ทุกวัน', time: '08:00', file: 'เพลงชาติไทย.mp3', volume: 80 }]);
  const [newDays, setNewDays] = useState('ทุกวัน');
  const [newTime, setNewTime] = useState('');
  const [newFile, setNewFile] = useState('เพลงชาติไทย.mp3');
  const [newVolume, setNewVolume] = useState('80');

  const handleSave = () => {
    if (!newTime) return;
    setSchedules([...schedules, { id: Date.now(), days: newDays, time: newTime, file: newFile, volume: Number(newVolume) }]);
    setNewTime('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#EAEAEA] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-300">
        
        <div className="bg-[#48A0D8] p-5 flex justify-between items-center text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3"><Calendar size={24} /> ตารางเวลา : {node.name}</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8">
          <div className="bg-gray-200 p-6 rounded-2xl grid grid-cols-4 gap-4 items-end mb-8">
             <div>
                <label className="block text-xs font-bold mb-1.5 ml-1">Days / วัน</label>
                <select onChange={(e) => setNewDays(e.target.value)} className="w-full p-2.5 rounded-xl text-sm bg-white border-0 shadow-sm outline-none">
                    {['ทุกวัน', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์', 'วันทำงาน(จ-ศ)'].map(d=><option key={d}>{d}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold mb-1.5 ml-1">Time / เวลา</label>
                <input type="time" onChange={(e) => setNewTime(e.target.value)} className="w-full p-2.5 rounded-xl text-sm border-0 shadow-sm outline-none" />
             </div>
             <div>
                <label className="block text-xs font-bold mb-1.5 ml-1">File / ไฟล์เพลง</label>
                <select onChange={(e) => setNewFile(e.target.value)} className="w-full p-2.5 rounded-xl text-sm border-0 shadow-sm outline-none">
                    <option>เพลงชาติไทย.mp3</option>
                    <option>ออดพักเที่ยง.mp3</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold mb-1.5 ml-1">Volume / ระดับเสียง</label>
                <input type="number" onChange={(e) => setNewVolume(e.target.value)} placeholder="80" className="w-full p-2.5 rounded-xl text-sm border-0 shadow-sm outline-none" />
             </div>
          </div>
          
          <button onClick={handleSave} className="bg-[#519455] text-white px-10 py-2 rounded-full font-bold mx-auto block hover:bg-green-700 transition-all shadow-md">
            Save / บันทึก
          </button>

          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="grid grid-cols-12 p-4 font-bold text-sm bg-gray-50 border-b border-gray-200">
               <div className="col-span-3">Days / วัน</div>
               <div className="col-span-3">Time / เวลา</div>
               <div className="col-span-3">File / ไฟล์เพลง</div>
               <div className="col-span-2">Volume</div>
               <div className="col-span-1 text-center">ลบ</div>
             </div>
             {schedules.map(s => (
               <div key={s.id} className="grid grid-cols-12 p-4 border-b border-gray-100 items-center text-sm hover:bg-gray-50">
                 <div className="col-span-3 font-bold">{s.days}</div>
                 <div className="col-span-3">{s.time}</div>
                 <div className="col-span-3">{s.file}</div>
                 <div className="col-span-2">{s.volume}%</div>
                 <div className="col-span-1 text-center">
                    <button onClick={() => setSchedules(schedules.filter(i => i.id !== s.id))} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18}/>
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}