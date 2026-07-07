import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { Icon } from 'leaflet';
import { Share } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';

// --- AutoFit Component (จัดกล้องให้เห็นหมุดทั้งหมด) ---
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

const smartPoleIcon = new Icon({
  iconUrl: '/pole.png',
  iconSize: [40, 80],
  iconAnchor: [20, 80],
  popupAnchor: [0, -80]
});

// --- PoleMarker Component (รับหน้าที่เช็คสถานะ Real-time) ---
function PoleMarker({ node }: { node: NodeItem }) {
  const [statusData, setStatusData] = useState({
    online: false,
    data: { voltage: '-', current: '-', power: '-', energy: '-' }
  });

  useEffect(() => {
    let isMounted = true;

    const fetchRealTimeStatus = async () => {
      try {
        const res = await fetch(`http://localhost/api/get_node_status.php?id=${node.id}`);
        const result = await res.json();
        
        if (isMounted && result.status === 'success') {
          setStatusData({
            online: result.online,
            data: result.data || { voltage: '-', current: '-', power: '-', energy: '-' }
          });
        }
      } catch (err) {
        if (isMounted) setStatusData(prev => ({ ...prev, online: false }));
      }
    };

    fetchRealTimeStatus(); // ดึงครั้งแรก
    const intervalId = setInterval(fetchRealTimeStatus, 10000); // ดึงทุก 10 วินาที

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [node.id]);

  const { online, data } = statusData;

  return (
    <Marker position={[node.lat, node.lng]} icon={smartPoleIcon}>
      <Popup closeButton={false} className="custom-popup" minWidth={280} maxWidth={280}>
        <div className="w-[280px] flex flex-col font-sans shadow-2xl rounded-[20px] overflow-hidden border-0">
          
          {/* Header สีฟ้า (ดีไซน์เดิม) */}
          <div className="bg-[#48A0D8] px-4 py-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-2.5">
              {/* สลับสีจุดหน้าชื่อ ตามสถานะ */}
              <div className={`w-3.5 h-3.5 rounded-full ${online ? 'bg-[#76E136] animate-pulse shadow-[0_0_8px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
              <span className="font-bold text-2xl tracking-wide">{node.name}</span>
            </div>
            
            {/* ซ่อน/แสดง ปุ่มดูกราฟ ตามสถานะ */}
            {online && (
              <button className="bg-white text-black text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow-md hover:bg-gray-100 transition-colors">
                กราฟ <Share size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Body พื้นหลัง Gradient (ดีไซน์เดิมเป๊ะๆ) */}
          <div className="px-5 py-6 bg-gradient-to-br from-[#faebe1] to-[#e8d5c8]">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-gray-900 text-xl tracking-wide">V</span>
                <div>
                  <span className="text-[#3271A5] font-extrabold text-xl">{online ? data.voltage : '-'}</span>
                  <span className="text-gray-900 font-extrabold text-xs ml-1">v</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-gray-900 text-xl tracking-wide">A</span>
                <div>
                  <span className="text-[#3271A5] font-extrabold text-xl">{online ? data.current : '-'}</span>
                  <span className="text-gray-900 font-extrabold text-xs ml-1">A</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-gray-900 text-xl tracking-wide">W</span>
                <div>
                  <span className="text-[#3271A5] font-extrabold text-xl">{online ? data.power : '-'}</span>
                  <span className="text-gray-900 font-extrabold text-xs ml-1">w</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-gray-900 text-xl tracking-wide">Wh</span>
                <div>
                  <span className="text-[#3271A5] font-extrabold text-xl">{online ? data.energy : '-'}</span>
                  <span className="text-gray-900 font-extrabold text-xs ml-1">wh</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </Popup>
    </Marker>
  );
}

// --- Main Page ---
export default function Home() {
  const { nodes } = useNodes();

  return (
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-gray-100">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        <AutoFit />
        
        {nodes.map((node) => (
           <PoleMarker key={node.id} node={node} />
        ))}
      </MapContainer>
    </main>
  );
}