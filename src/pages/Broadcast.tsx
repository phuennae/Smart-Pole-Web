import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Mic, Square } from 'lucide-react'; // เพิ่มไอคอน Square สำหรับปุ่ม Stop
import { useNodes } from '../context/NodeContext';
import 'leaflet/dist/leaflet.css';

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

export default function Broadcast() {
  const { nodes } = useNodes();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [isBroadcasting, setIsBroadcasting] = useState(false); // เช็คสถานะว่ากำลังพูดอยู่ไหม
  const [isLoading, setIsLoading] = useState(false);

  const toggleNode = (id: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedNodes(newSelected);
  };

  // ฟังก์ชันเริ่มประกาศสด
  const handleStartBroadcast = async () => {
    // ถ้าไม่ได้เลือกเสาไหนเลย จะถือว่าส่งไปทุกเสา (พฤติกรรมตามที่เขียนใน PHP)
    const nodesArray = Array.from(selectedNodes);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('nodes', JSON.stringify(nodesArray));
      
      await fetch('http://localhost/api/broadcast_live.php', {
        method: 'POST',
        body: formData
      });
      
      setIsBroadcasting(true);
    } catch (error) {
      console.error("Broadcast Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันหยุดประกาศ
  const handleStopBroadcast = async () => {
    const nodesArray = Array.from(selectedNodes);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('nodes', JSON.stringify(nodesArray));
      
      await fetch('http://localhost/api/broadcast_stop.php', {
        method: 'POST',
        body: formData
      });
      
      setIsBroadcasting(false);
    } catch (error) {
      console.error("Stop Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-gray-100 font-sans w-full">
      
      {/* แผงควบคุม */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] bg-white p-3 md:p-4 rounded-2xl shadow-xl w-[calc(100%-32px)] sm:w-64">
        
        {/* สลับปุ่ม Start / Stop ตามสถานะ */}
        {!isBroadcasting ? (
          <button 
            onClick={handleStartBroadcast}
            disabled={isLoading}
            className="w-full bg-[#48A0D8] text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            <Mic size={18} /> {isLoading ? 'กำลังส่งคำสั่ง...' : 'Start / เริ่มประกาศ'}
          </button>
        ) : (
          <button 
            onClick={handleStopBroadcast}
            disabled={isLoading}
            className="w-full bg-red-500 text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 hover:bg-red-600 transition-all animate-pulse"
          >
            <Square size={18} fill="currentColor" /> {isLoading ? 'กำลังส่งคำสั่ง...' : 'Stop / หยุดประกาศ'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setSelectedNodes(new Set(nodes.map(n => n.id)))} className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">เลือกทั้งหมด</button>
          <button onClick={() => setSelectedNodes(new Set())} className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิกทั้งหมด</button>
        </div>
      </div>

      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        <AutoFit />
        
        {nodes.map((node) => {
          const isSelected = selectedNodes.has(node.id);
          
          const icon = L.divIcon({
            className: 'custom-pole-icon',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; width: 80px; transition: all 0.3s;">
                <img src="/pole.png" style="width: 30px; height: 60px; object-fit: contain; filter: ${isSelected ? 'drop-shadow(0 0 8px rgba(72,160,216,0.8))' : 'none'};" />
                <div class="${isSelected ? 'bg-[#48A0D8]' : 'bg-black'} text-white px-2 py-0.5 rounded-full font-bold shadow-lg text-[10px] mt-1 border border-white text-center whitespace-nowrap">
                  ${node.name}
                </div>
              </div>
            `,
            iconSize: [80, 100],
            iconAnchor: [40, 90]
          });

          return (
            <Marker 
              key={node.id} 
              position={[node.lat, node.lng]} 
              icon={icon}
              eventHandlers={{ click: () => toggleNode(node.id) }} 
            />
          );
        })}
      </MapContainer>
    </main>
  );
}