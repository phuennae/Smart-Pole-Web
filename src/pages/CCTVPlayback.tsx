import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Play, Square, Clock, Video } from 'lucide-react';

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

  // จำลองการค้นหาไฟล์ย้อนหลัง (เชื่อมกับ playback_proxy.php ในอนาคต)
  const handleSearch = async () => {
    setIsLoading(true);
    // ในอนาคตเปลี่ยนเป็น fetch ไปที่ playback_proxy.php
    setTimeout(() => {
      // จำลองข้อมูลที่ได้จาก DB
      setRecordings([
        { id: '1', start: '2026-06-25T08:00:00', end: '2026-06-25T08:30:00' },
        { id: '2', start: '2026-06-25T14:00:00', end: '2026-06-25T15:00:00' }
      ]);
      setIsLoading(false);
    }, 800);
  };

  // ฟังก์ชันคำนวณตำแหน่ง Timeline (เหมือน logic ใน PHP เดิม)
  const getTimelineStyle = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    
    const leftPercent = (startMin / (24 * 60)) * 100;
    const widthPercent = ((endMin - startMin) / (24 * 60)) * 100;
    
    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 1)}%` };
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(`/cctv-monitor/${nodeId}`)} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับไปหน้า Monitor
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: ค้นหา */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={20} /> ค้นหาไฟล์</h3>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 mb-1 block">วันที่</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full p-3 bg-gray-50 rounded-xl border-0" 
                />
              </div>
              <button onClick={handleSearch} className="w-full bg-[#48A0D8] text-white p-3 rounded-xl font-bold hover:bg-blue-600 transition-all">
                {isLoading ? 'กำลังค้นหา...' : 'ค้นหาบันทึก'}
              </button>
            </div>
          </div>

          {/* Main: Video Player & Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Playback Viewer</h3>
              
              <div className="bg-black w-full aspect-video rounded-2xl flex items-center justify-center text-white/20 mb-6">
                {selectedSegment ? `เล่นไฟล์: ${selectedSegment.start}` : 'เลือกช่วงเวลาที่ Timeline ด้านล่างเพื่อเล่น'}
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 mb-2">Timeline (24 ชั่วโมง)</div>
                <div className="h-16 bg-gray-200 rounded-lg relative overflow-hidden cursor-pointer">
                  {recordings.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`absolute h-full bg-blue-500/50 border-r border-white/50 transition-all ${selectedSegment?.id === rec.id ? 'bg-blue-600' : ''}`}
                      style={getTimelineStyle(rec.start, rec.end)}
                      onClick={() => setSelectedSegment(rec)}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-6">
                <button 
                  disabled={!selectedSegment}
                  className="bg-green-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all"
                >
                  <Play size={24} />
                </button>
                <button 
                  disabled={!selectedSegment}
                  className="bg-red-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all"
                >
                  <Square size={24} />
                </button>
                <div className="ml-auto font-mono font-bold text-gray-700 flex items-center gap-2">
                  <Clock size={18} /> {selectedSegment ? selectedSegment.start.split('T')[1] : '--:--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}