import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Play, Pause, Volume2, 
  X, Expand, FastForward 
} from 'lucide-react';

export default function CCTVPlayback() {
  const navigate = useNavigate();
  const { nodeId } = useParams();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(30);
  
  // Volume states
  const [volume, setVolume] = useState(80);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  const toggleSpeed = () => {
    setSpeed(prev => (prev === 4 ? 1 : prev * 2));
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        {/* แก้ไขปุ่มกลับ ให้ไปที่หน้า Monitor ของ node นั้นๆ */}
        <button 
          onClick={() => navigate(`/cctv-monitor/${nodeId}`)} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับ
        </button>

        {/* --- Block 1: Search Section --- */}
        <div className="bg-[#48A0D8] rounded-2xl shadow-lg p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Search size={22} /> Search / ค้นหาภาพย้อนหลัง
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
            <div className="col-span-3">
              <label className="block text-xs font-bold mb-1 ml-1">Start / เริ่มต้น</label>
              <div className="flex gap-2">
                <input type="date" className="p-2 rounded-xl text-black w-full border-0 outline-none" />
                <input type="time" className="p-2 rounded-xl text-black w-full border-0 outline-none" />
              </div>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-bold mb-1 ml-1">End / สิ้นสุด</label>
              <div className="flex gap-2">
                <input type="date" className="p-2 rounded-xl text-black w-full border-0 outline-none" />
                <input type="time" className="p-2 rounded-xl text-black w-full border-0 outline-none" />
              </div>
            </div>
            <div className="col-span-3">
              <button className="w-full bg-[#3684B5] text-white py-2.5 rounded-xl font-bold hover:bg-[#2E719D] transition-colors">
                Search / ค้นหา
              </button>
            </div>
          </div>
        </div>

        {/* --- Block 2: Playback Section --- */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold flex justify-between items-center">
            <span>{nodeId || "Node 4"}</span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-lg">Playback / ดูภาพย้อนหลัง</span>
          </div>

          {/* Video Feed Placeholder */}
          <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
            Video Feed
          </div>

          {/* Controls Footer */}
          <div className="p-4 bg-gray-100">
            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold text-gray-600">00:00:00</span>
              <input 
                type="range" value={progress} onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#48A0D8]" 
              />
              <span className="text-xs font-bold text-gray-600">00:00:00</span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-[#48A0D8] text-white rounded-xl hover:bg-blue-600 transition-all">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={toggleSpeed} className="px-4 py-2 bg-gray-200 rounded-xl font-bold text-sm hover:bg-gray-300 transition-all">
                {speed}x
              </button>

              {/* ปุ่มเสียง + Volume Popup (มินิมอล โค้งมน) */}
              <div className="relative">
                <button 
                  onClick={() => setIsVolumeOpen(!isVolumeOpen)} 
                  className={`p-3 rounded-xl transition-all ${isVolumeOpen ? 'bg-gray-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  <Volume2 size={20} className={isVolumeOpen ? "text-[#48A0D8]" : "text-gray-700"} />
                </button>

                {isVolumeOpen && (
                  <div className="absolute bottom-16 right-0 bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 flex items-center gap-4 w-64 animate-in fade-in zoom-in duration-200 z-50">
                    <Volume2 size={20} className="text-[#48A0D8]" />
                    <input 
                      type="range" min="0" max="100" value={volume} 
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #48A0D8 ${volume}%, #E5E7EB ${volume}%)` }}
                    />
                    <span className="text-sm font-bold w-10 text-right">{volume}%</span>
                  </div>
                )}
              </div>

              <button className="p-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-all"><X size={20} /></button>
              <button className="p-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all"><Expand size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}