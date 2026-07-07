import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { useNodes } from '../context/NodeContext';

// --- AutoFit Component (จัดกล้องให้เห็นหมุดกล้องทั้งหมดอัตโนมัติ) ---
function AutoFit() {
  const map = useMap();
  const { nodes } = useNodes();

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      // สร้าง list ของพิกัด [lat, lng]
      const bounds = nodes.map(n => [n.lat, n.lng] as [number, number]);
      // สั่งขยับแผนที่ไปล้อมรอบหมุดทั้งหมด
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [nodes, map]);

  return null;
}

export default function CCTVPage() {
  const navigate = useNavigate();
  const { nodes } = useNodes(); // ดึงข้อมูลกล้อง/โหนดจาก Context

  return (
    <main className="flex-1 h-screen relative bg-gray-100 font-sans">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {/* เพิ่ม AutoFit เพื่อให้แผนที่โฟกัสไปที่ตำแหน่งกล้องทันที */}
        <AutoFit />
        
        {nodes.map((node) => {
          // สร้าง HTML สำหรับ Custom Marker
          const iconMarkup = renderToString(
            <div className="flex flex-col items-center">
              <img src="/pole.png" className="w-[30px] h-[60px] object-contain mb-1" />
              
              {/* กล่อง Node มินิมอล */}
              <div className="w-[100px] shadow-lg rounded-xl overflow-hidden border border-white">
                <div className="bg-[#48A0D8] text-white font-bold text-[10px] w-full py-0.5 text-center truncate px-1">
                  {node.name}
                </div>
                {/* ถ้าออนไลน์โชว์ปุ่ม View, ถ้าออฟไลน์โชว์ Offline */}
                {node.status === 'online' ? (
                  <div className="bg-black text-white text-[10px] font-bold w-full py-1 flex items-center justify-center gap-1 hover:bg-gray-800 transition-colors cursor-pointer">
                    <Eye size={10} /> View
                  </div>
                ) : (
                  <div className="bg-black text-gray-400 text-[10px] font-bold w-full py-1 flex items-center justify-center gap-1 opacity-80 cursor-default">
                    <EyeOff size={10} /> Offline
                  </div>
                )}
              </div>
            </div>
          );

          const customIcon = L.divIcon({
            html: iconMarkup,
            className: 'custom-cctv-icon',
            iconSize: [100, 120],
            iconAnchor: [50, 110], // ปักหมุดที่ปลายเสา
          });

          return (
            <Marker 
              key={node.id} 
              position={[node.lat, node.lng]} 
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  // ถ้าออนไลน์ค่อยยอมให้กดไปหน้า Monitor
                  if (node.status === 'online') {
                    navigate(`/cctv-monitor/${node.id}`);
                  } else {
                    alert("กล้องขณะนี้สถานะ Offline ไม่สามารถดูภาพสดได้");
                  }
                }
              }}
            />
          );
        })}
      </MapContainer>
    </main>
  );
}