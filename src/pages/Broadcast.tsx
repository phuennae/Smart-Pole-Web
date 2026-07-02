import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Mic } from 'lucide-react';
import { useNodes } from '../context/NodeContext'; // นำเข้าฮุกความจริงชุดเดียวของระบบ

export default function Broadcast() {
  const { nodes } = useNodes(); // ดึงข้อมูลของทุกเสามาจาก Context ส่วนกลาง
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedNodes(newSelected);
  };

  return (
    <main className="flex-1 h-screen relative bg-gray-100 font-sans">
      {/* แผงควบคุมมุมขวาบน */}
      <div className="absolute top-6 right-6 z-[1000] bg-white p-4 rounded-2xl shadow-xl w-64">
        <button className="w-full bg-[#48A0D8] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 hover:bg-blue-600 transition-all">
          <Mic size={20} /> Start / เริ่มประกาศ
        </button>
        <div className="grid grid-cols-2 gap-2">
          {/* เปลี่ยนจาก mockNodes เป็น nodes จาก Context */}
          <button 
            onClick={() => setSelectedNodes(new Set(nodes.map(n => n.id)))} 
            className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            เลือกทั้งหมด
          </button>
          <button 
            onClick={() => setSelectedNodes(new Set())} 
            className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิกทั้งหมด
          </button>
        </div>
      </div>

      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {/* เปลี่ยนการ map ข้อมูลจาก mockNodes เป็น nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNodes.has(node.id);
          
          // สร้างไอคอนที่รวมทั้งรูปเสาและชื่อไว้ด้วยกัน
          const icon = L.divIcon({
            className: 'custom-pole-icon',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; width: 100px;">
                <img src="/pole.png" style="width: 40px; height: 80px; object-fit: contain;" />
                <div class="${isSelected ? 'bg-blue-500' : 'bg-black'} text-white px-3 py-1 rounded-full font-bold shadow-lg text-xs mt-1 border-2 border-white transition-all text-center">
                  ${node.name}
                </div>
              </div>
            `,
            iconSize: [100, 120],
            iconAnchor: [50, 110]
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