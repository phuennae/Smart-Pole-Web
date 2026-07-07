import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Mic } from 'lucide-react';
import { useNodes } from '../context/NodeContext';
import 'leaflet/dist/leaflet.css';

export default function Broadcast() {
  const { nodes } = useNodes();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedNodes(newSelected);
  };

  return (
    // กำหนดให้ความสูงเป็น h-[calc(100vh-72px)] บนมือถือ และ h-screen บน PC
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-gray-100 font-sans w-full">
      
      {/* แผงควบคุม: ปรับตำแหน่งจาก absolute ขวาบน ให้ขยับตามขนาดจอและเล็กลงเมื่ออยู่บนมือถือ */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] bg-white p-3 md:p-4 rounded-2xl shadow-xl w-[calc(100%-32px)] sm:w-64">
        <button className="w-full bg-[#48A0D8] text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 hover:bg-blue-600 transition-all">
          <Mic size={18} /> Start / เริ่มประกาศ
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setSelectedNodes(new Set(nodes.map(n => n.id)))} className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">เลือกทั้งหมด</button>
          <button onClick={() => setSelectedNodes(new Set())} className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิกทั้งหมด</button>
        </div>
      </div>

      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {nodes.map((node) => {
          const isSelected = selectedNodes.has(node.id);
          
          const icon = L.divIcon({
            className: 'custom-pole-icon',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; width: 80px;">
                <img src="/pole.png" style="width: 30px; height: 60px; object-fit: contain;" />
                <div class="${isSelected ? 'bg-blue-500' : 'bg-black'} text-white px-2 py-0.5 rounded-full font-bold shadow-lg text-[10px] mt-1 border border-white text-center whitespace-nowrap">
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