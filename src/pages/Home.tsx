import 'leaflet/dist/leaflet.css';
// ลบ useState ออก เพราะไม่ได้ใช้แล้ว
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Share } from 'lucide-react';
import { useNodes } from '../context/NodeContext';

const smartPoleIcon = new Icon({
  iconUrl: '/pole.png',
  iconSize: [40, 80],
  iconAnchor: [20, 80],
  popupAnchor: [0, -80]
});

export default function Home() {
  const { nodes } = useNodes();

  return (
    <main className="flex-1 h-screen relative">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {nodes.map((node) => (
           <Marker key={node.id} position={[node.lat, node.lng]} icon={smartPoleIcon}>
            <Popup closeButton={false} className="custom-popup" minWidth={280} maxWidth={280}>
              
              <div className="w-[280px] flex flex-col font-sans shadow-2xl rounded-[20px] overflow-hidden border-0">
                
                {/* Header สีฟ้า */}
                <div className="bg-[#48A0D8] px-4 py-3 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${node.status === 'online' ? 'bg-[#76E136] animate-pulse shadow-[0_0_8px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
                    <span className="font-bold text-2xl tracking-wide">{node.name}</span>
                  </div>
                  <button className="bg-white text-black text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow-md hover:bg-gray-100 transition-colors">
                    กราฟ <Share size={14} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Body (พื้นหลัง Gradient สีครีมพีช) */}
                <div className="px-5 py-6 bg-gradient-to-br from-[#faebe1] to-[#e8d5c8]">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    
                    {/* ข้อมูล V */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">V</span>
                      <div>
                        {/* ใช้ ?. และ ?? เพื่อจัดการกรณีที่ไม่มี data */}
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data?.voltage ?? '-'}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">v</span>
                      </div>
                    </div>

                    {/* ข้อมูล A */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">A</span>
                      <div>
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data?.current ?? '-'}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">A</span>
                      </div>
                    </div>

                    {/* ข้อมูล W */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">W</span>
                      <div>
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data?.power ?? '-'}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">w</span>
                      </div>
                    </div>

                    {/* ข้อมูล Wh */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">Wh</span>
                      <div>
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data?.energy ?? '-'}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">wh</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </main>
  );
}