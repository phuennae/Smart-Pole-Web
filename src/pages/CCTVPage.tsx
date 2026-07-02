import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { useNodes } from '../context/NodeContext'; // นำเข้า Context

export default function CCTVPage() {
  const navigate = useNavigate();
  const { nodes } = useNodes(); // ดึงข้อมูลเสาทั้งหมดจาก Context ส่วนกลาง

  return (
    <main className="flex-1 h-screen relative bg-gray-100 font-sans">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {/* เปลี่ยนจาก cctvNodes เป็น nodes ที่ดึงมาจาก Context */}
        {nodes.map((node) => {
          // สร้าง HTML: รูปเสาด้านบน + กล่อง Node โค้งมน
          const iconMarkup = renderToString(
            <div className="flex flex-col items-center">
              <img src="/pole.png" className="w-[30px] h-[60px] object-contain mb-1" />
              
              {/* กล่อง Node มินิมอล โค้งมน */}
              <div className="w-[100px] shadow-lg rounded-xl overflow-hidden border border-white">
                <div className="bg-[#48A0D8] text-white font-bold text-[10px] w-full py-0.5 text-center">
                  {node.name}
                </div>
                {node.status === 'online' ? (
                  <div className="bg-black text-white text-[10px] font-bold w-full py-1 flex items-center justify-center gap-1 hover:bg-gray-800 transition-colors cursor-pointer">
                    <Eye size={10} /> View
                  </div>
                ) : (
                  <div className="bg-black text-gray-400 text-[10px] font-bold w-full py-1 flex items-center justify-center gap-1 opacity-80">
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
              // ใส่ Event ตรงนี้เพื่อให้กดที่ตัว Marker (ทั้งเสาและกล่อง) แล้วเด้งไปหน้า monitor
              eventHandlers={{
                click: () => {
                  if (node.status === 'online') navigate(`/cctv-monitor/${node.id}`);
                }
              }}
            />
          );
        })}
      </MapContainer>
    </main>
  );
}