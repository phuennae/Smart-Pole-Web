import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Video, Eye, VideoOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNodes, type NodeItem } from '../context/NodeContext';
import { API_URL } from '../config';

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

// --- CCTVPoleMarker Component (รับหน้าที่เช็คสถานะ Real-time) ---
function CCTVPoleMarker({ 
  node, 
  isSelected, 
  onSelect 
}: { 
  node: NodeItem; 
  isSelected: boolean; 
  onSelect: (node: NodeItem, online: boolean) => void; 
}) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/get_node_status.php?id=${node.id}`);
        const data = await res.json();
        
        if (isMounted && data.status === 'success') {
          setOnline(data.online);
        } else if (isMounted) {
          setOnline(false);
        }
      } catch (err) {
        if (isMounted) setOnline(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [node.id]);

  const statusDot = online ? 'bg-[#76E136]' : 'bg-red-500';
  const filterStyle = online 
    ? (isSelected ? 'drop-shadow(0 0 10px rgba(72,160,216,0.9))' : 'none') 
    : 'grayscale(100%) opacity(60%)';

  const customIcon = L.divIcon({
    className: 'custom-cctv-icon',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 100px; transition: all 0.3s; cursor: pointer; transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'}">
        <img src="/pole.png" style="width: 40px; height: 80px; object-fit: contain; filter: ${filterStyle};" />
        <div class="${isSelected ? 'bg-[#48A0D8]' : 'bg-gray-900'} text-white px-2.5 py-1 rounded-full font-bold shadow-lg text-[11px] mt-1 border border-white text-center whitespace-nowrap flex items-center justify-center gap-1.5 transition-colors">
          <div class="w-1.5 h-1.5 rounded-full ${statusDot} ${online && isSelected ? 'animate-pulse' : ''}"></div>
          ${node.name}
        </div>
      </div>
    `,
    iconSize: [100, 110],
    iconAnchor: [50, 100]
  });

  return (
    <Marker 
      position={[node.lat, node.lng]} 
      icon={customIcon}
      eventHandlers={{
        click: () => onSelect(node, online) 
      }}
    />
  );
}

// --- CCTVSidebar Component (แผงควบคุมกล้องฝั่งขวา ดีไซน์ใหม่) ---
function CCTVSidebar({ 
  node, 
  online, 
  onClose 
}: { 
  node: NodeItem; 
  online: boolean; 
  onClose: () => void; 
}) {
  const navigate = useNavigate();

  return (
    <div className="w-[360px] shrink-0 h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-200 flex flex-col z-10 relative transition-all duration-300">
      
      {/* Header สีขาว-เทา คลีนๆ */}
      <div className="bg-white px-6 py-6 border-b border-gray-100 flex flex-col relative shrink-0">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-5 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="pr-10">
          <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight truncate">{node.name}</h2>
          
          <div className="flex items-center gap-3 mt-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${online ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Body พื้นหลังเทา สไตล์ Dashboard */}
      <div className="flex-1 px-6 py-6 bg-[#F8FAFC] overflow-y-auto flex flex-col gap-5">
        <p className="text-[11px] font-extrabold text-gray-400 tracking-widest uppercase">
          CCTV Camera System
        </p>

        {/* การ์ดสถานะกล้อง */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center pb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${online ? 'bg-blue-50 text-[#48A0D8]' : 'bg-gray-100 text-gray-400'}`}>
            <Video size={32} />
          </div>
          <h3 className="font-bold text-gray-800 text-base">กล้องวงจรปิด</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">ระบบสตรีมสัญญาณภาพสด</p>
        </div>

        {/* ปุ่มคำสั่งตามสถานะ */}
        {online ? (
          <button 
            onClick={() => navigate(`/cctv-monitor/${node.id}`)}
            className="w-full bg-[#48A0D8] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-blue-500 transition-colors"
          >
            <Eye size={18} strokeWidth={2.5} /> ดูสัญญาณภาพสด (Live Monitor)
          </button>
        ) : (
          <div className="bg-white rounded-[16px] border border-red-100 shadow-sm p-5 text-center flex flex-col items-center">
            <div className="text-red-500 bg-red-50 p-2 rounded-full mb-2">
              <VideoOff size={20} />
            </div>
            <p className="text-sm font-bold text-red-600">ไม่สามารถดึงสัญญาณภาพได้</p>
            <p className="text-xs text-gray-400 mt-1">
              เนื่องจากเสาต้นนี้ตัดการเชื่อมต่อ (Offline) ชั่วคราว
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// --- Main Page ---
export default function CCTVPage() {
  const { nodes } = useNodes();
  
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);
  const [isSelectedOnline, setIsSelectedOnline] = useState(false);

  return (
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-[#F8FAFC] flex overflow-hidden font-sans">
      
      {/* ฝั่งซ้าย: แผนที่ระบบกล้อง */}
      <div className="flex-1 h-full relative z-0">
        <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <AutoFit />
          
          {nodes.map((node) => (
            <CCTVPoleMarker 
              key={node.id} 
              node={node} 
              isSelected={selectedNode?.id === node.id}
              onSelect={(targetNode, onlineStatus) => {
                setSelectedNode(targetNode);
                setIsSelectedOnline(onlineStatus);
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* ฝั่งขวา: Sidebar ข้อมูลและปุ่มสตรีมกล้อง */}
      {selectedNode && (
        <CCTVSidebar 
          node={selectedNode} 
          online={isSelectedOnline} 
          onClose={() => setSelectedNode(null)} 
        />
      )}

    </main>
  );
}