import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { useNodes, type NodeItem } from '../context/NodeContext';
import { API_URL } from '../config';

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

// --- CCTVPoleMarker Component (รับหน้าที่เช็คสถานะ Real-time) ---
function CCTVPoleMarker({ node }: { node: NodeItem }) {
  const navigate = useNavigate();
  // ตั้งค่าเริ่มต้นเป็น Offline เสมอ เพื่อความชัวร์
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/get_node_status.php?id=${node.id}`);
        const data = await res.json();
        
        if (isMounted && data.status === 'success') {
          setOnline(data.online); // อัปเดตจากค่า API จริงๆ
        } else if (isMounted) {
          setOnline(false);
        }
      } catch (err) {
        if (isMounted) setOnline(false); // ถ้า API พังหรือเรียกไม่ได้ ให้แดงไว้ก่อน
      }
    };

    fetchStatus(); // ดึงครั้งแรก
    const intervalId = setInterval(fetchStatus, 10000); // ดึงทุกๆ 10 วิ

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [node.id]);

  // สร้าง HTML สำหรับ Custom Marker
  const iconMarkup = renderToString(
    <div className="flex flex-col items-center">
      <img src="/pole.png" className="w-[30px] h-[60px] object-contain mb-1" />
      
      <div className="w-[100px] shadow-lg rounded-xl overflow-hidden border border-white">
        
        {/* สีหัวกล่อง และจุดกระพริบ เช็คจาก State 'online' ที่ดึงมาสดๆ */}
        <div className={`px-2 py-1 flex items-center justify-center gap-1.5 ${online ? 'bg-[#48A0D8]' : 'bg-gray-600'}`}>
           <div className={`w-2 h-2 shrink-0 rounded-full ${online ? 'bg-[#76E136] animate-pulse shadow-[0_0_4px_rgba(118,225,54,0.8)]' : 'bg-red-500'}`} />
           <span className="text-white font-bold text-[10px] truncate">
             {node.name}
           </span>
        </div>

        {/* ปุ่มด้านล่าง เปลี่ยนตามสถานะ */}
        {online ? (
          <div className="bg-black text-white text-[10px] font-bold w-full py-1 flex items-center justify-center gap-1 hover:bg-gray-800 transition-colors cursor-pointer">
            <Eye size={10} /> View
          </div>
        ) : (
          <div className="bg-black text-gray-400 text-[10px] font-bold w-full py-1 flex items-center justify-center gap-1 hover:bg-gray-800 transition-colors cursor-pointer">
            <EyeOff size={10} /> View (Offline)
          </div>
        )}
      </div>
    </div>
  );

  const customIcon = L.divIcon({
    html: iconMarkup,
    className: 'custom-cctv-icon',
    iconSize: [100, 120],
    iconAnchor: [50, 110], 
  });

  return (
    <Marker 
      position={[node.lat, node.lng]} 
      icon={customIcon}
      eventHandlers={{
        click: () => {
          // ยอมให้กดเข้าไปหน้า Monitor ได้เสมอ เพื่อให้ไปโชว์ "ไม่พบภาพ" ข้างใน
          navigate(`/cctv-monitor/${node.id}`);
        }
      }}
    />
  );
}

// --- Main Page ---
export default function CCTVPage() {
  const { nodes } = useNodes();

  return (
    <main className="flex-1 h-screen relative bg-gray-100 font-sans">
      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        <AutoFit />
        
        {/* เปลี่ยนมาใช้ CCTVPoleMarker แทน Marker ธรรมดา */}
        {nodes.map((node) => (
          <CCTVPoleMarker key={node.id} node={node} />
        ))}
      </MapContainer>
    </main>
  );
}