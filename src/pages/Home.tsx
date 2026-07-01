import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Share } from 'lucide-react'; // เปลี่ยนไอคอนให้ตรงกับดีไซน์ใหม่

// --- Mock Data & Config ---
const mockNodes = [
  { id: 'node-1', name: 'Node 1', lat: 18.7951, lng: 98.9525, status: 'online', data: { voltage: 12.1, current: 0.41, power: 4.9, energy: 12.1 } },
  { id: 'node-2', name: 'Node 2', lat: 18.7958, lng: 98.9520, status: 'offline', data: { voltage: '-', current: '-', power: '-', energy: '-' } },
  { id: 'node-3', name: 'Node 3', lat: 18.7945, lng: 98.9515, status: 'online', data: { voltage: 12.1, current: 0.41, power: 4.9, energy: 12.1 } },
  { id: 'node-4', name: 'Node 4', lat: 18.7960, lng: 98.9510, status: 'online', data: { voltage: 12.1, current: 0.41, power: 4.9, energy: 12.1 } }
];

const smartPoleIcon = new Icon({
  iconUrl: '/pole.png',
  iconSize: [40, 80],
  iconAnchor: [20, 80],
  popupAnchor: [0, -80]
});

export default function Home() {
  const [nodes] = useState(mockNodes);

  return (
    <main className="flex-1 h-screen relative">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {nodes.map((node) => (
          <Marker key={node.id} position={[node.lat, node.lng]} icon={smartPoleIcon}>
            {/* ใส่ custom-popup และกำหนดความกว้างให้ตรงกับการ์ดด้านใน */}
            <Popup closeButton={false} className="custom-popup" minWidth={280} maxWidth={280}>
              
              <div className="w-[280px] flex flex-col font-sans shadow-2xl rounded-[20px] overflow-hidden border-0">
                
                {/* Header สีฟ้า */}
                <div className="bg-[#48A0D8] px-4 py-3 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2.5">
                    {/* จุดสถานะ พร้อมไฟกระพริบ */}
                    <div className={`w-3.5 h-3.5 rounded-full ${node.status === 'online' ? 'bg-[#76E136] animate-pulse shadow-[0_0_8px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
                    <span className="font-bold text-2xl tracking-wide">{node.name}</span>
                  </div>
                  {/* ปุ่มกราฟทรงแคปซูล */}
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
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data.voltage}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">v</span>
                      </div>
                    </div>

                    {/* ข้อมูล A */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">A</span>
                      <div>
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data.current}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">A</span>
                      </div>
                    </div>

                    {/* ข้อมูล W */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">W</span>
                      <div>
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data.power}</span>
                        <span className="text-gray-900 font-extrabold text-xs ml-1">w</span>
                      </div>
                    </div>

                    {/* ข้อมูล Wh */}
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-gray-900 text-xl tracking-wide">Wh</span>
                      <div>
                        <span className="text-[#3271A5] font-extrabold text-xl">{node.data.energy}</span>
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