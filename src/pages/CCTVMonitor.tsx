import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Trash2, Volume2, Pencil, Expand, 
  ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Square 
} from 'lucide-react';

export default function CCTVMonitor() {
  const navigate = useNavigate();
  const { nodeId } = useParams();
  const [nodeName, setNodeName] = useState(nodeId || "Node 4");
  
  const [volume, setVolume] = useState(80);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  const handleControl = (direction: string) => console.log(`Camera: ${direction}`);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mapping: Record<string, string> = { ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right' };
      if (mapping[e.key]) handleControl(mapping[e.key]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        {/* ปุ่มกลับ - นำทางกลับไปที่หน้า /cctv แน่นอน */}
        <button 
          onClick={() => navigate('/cctv')} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับ
        </button>

        {/* Card หลัก */}
        <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#48A0D8] p-5 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold">{nodeName}</h2>
            <button 
              onClick={() => navigate(`/cctv-playback/${nodeId}`)}
              className="bg-white/20 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-white/30 transition-all cursor-pointer"
            >
              Playback / ดูภาพย้อนหลัง
            </button>
          </div>

          {/* พื้นที่วิดีโอ */}
          <div className="w-full h-[400px] bg-gray-200 relative flex items-center justify-center">
            <span className="text-gray-400 font-bold">Video Feed</span>
            
            {/* Toolbar ขวาล่าง */}
            <div className="absolute bottom-6 right-6 flex gap-3">
              <button className="p-3 bg-white rounded-2xl shadow-lg hover:bg-gray-50 text-gray-700 transition-all"><Trash2 size={20} /></button>
              
              {/* ปุ่มเสียง + Volume Popup */}
              <div className="relative">
                <button 
                  onClick={() => setIsVolumeOpen(!isVolumeOpen)} 
                  className={`p-3 rounded-2xl shadow-lg transition-all ${isVolumeOpen ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Volume2 size={20} className={isVolumeOpen ? "text-[#48A0D8]" : "text-gray-700"} />
                </button>

                {/* Pop-up ปรับระดับเสียง */}
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

              <button onClick={() => { const name = prompt("Rename", nodeName); if(name) setNodeName(name); }} className="p-3 bg-white rounded-2xl shadow-lg hover:bg-gray-50 text-gray-700 transition-all"><Pencil size={20} /></button>
              <button className="p-3 bg-white rounded-2xl shadow-lg hover:bg-gray-50 text-gray-700 transition-all"><Expand size={20} /></button>
            </div>
          </div>
        </div>

        {/* ปุ่มควบคุม (D-Pad) */}
        <div className="mt-10 flex flex-col items-center">
          <button onClick={() => handleControl('Up')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowUp size={28} /></button>
          <div className="flex gap-3 my-3">
            <button onClick={() => handleControl('Left')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowLeftIcon size={28} /></button>
            <button onClick={() => handleControl('Stop')} className="bg-red-600 p-5 rounded-2xl text-white hover:bg-red-700 shadow-lg transition-all"><Square size={28} /></button>
            <button onClick={() => handleControl('Right')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowRight size={28} /></button>
          </div>
          <button onClick={() => handleControl('Down')} className="bg-[#48A0D8] p-5 rounded-2xl text-white hover:bg-blue-600 shadow-lg transition-all"><ArrowDown size={28} /></button>
        </div>
      </div>
    </main>
  );
}