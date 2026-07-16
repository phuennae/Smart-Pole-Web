import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
// ✅ Import ไอคอน Focus สำหรับทำปุ่มรีเซ็นเตอร์
import { Share, X, Zap, Activity, Gauge, BatteryCharging, Focus } from 'lucide-react'; 
import { useNodes, type NodeItem } from '../context/NodeContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const TB_URL = "http://theoneiot.i234.me:9090";

// --- AutoFit Component (ทำงานตอนโหลดครั้งแรก) ---
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

// ✅ สร้าง component สำหรับปุ่ม Recenter (ซูมกลับมาหาเสาทั้งหมด)
function RecenterControl({ nodes }: { nodes: NodeItem[] }) {
  const map = useMap();

  const handleRecenter = () => {
    if (nodes && nodes.length > 0) {
      const bounds = nodes.map(node => [node.lat, node.lng] as [number, number]);
      // สั่งให้แผนที่ซูมกลับมายังขอบเขตของเสาทั้งหมด
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  };

  return (
    // จัดตำแหน่งให้อยู่ขวาล่าง (เพิ่ม margin เพื่อไม่ให้บังป้าย Attribution)
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '35px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar shadow-xl">
        <button
          onClick={handleRecenter}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded flex items-center justify-center transition-colors"
          style={{ width: '34px', height: '34px', border: 'none', outline: 'none' }}
          title="ซูมกลับมายังเสาทั้งหมด"
        >
          <Focus size={20} className="text-gray-900" />
        </button>
      </div>
    </div>
  );
}

// --- PoleMarker Component ---
function PoleMarker({ 
  node, 
  isSelected, 
  onSelect 
}: { 
  node: NodeItem; 
  isSelected: boolean; 
  onSelect: (node: NodeItem, isOnline: boolean) => void; 
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
    className: 'custom-home-icon',
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
      eventHandlers={{ click: () => onSelect(node, online) }}
    />
  );
}

// --- NodeSidebar Component ---
function NodeSidebar({ node, token, onClose }: { node: NodeItem; token: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState<any>({
    online: false,
    data: { voltage: '-', current: '-', power: '-', energy: '-', battery_pct: null }
  });

  useEffect(() => {
    let isMounted = true;

    const fetchRealTimeStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/get_node_status.php?id=${node.id}`);
        const result = await res.json();
        
        if (isMounted && result.status === 'success') {
          let energyVal = result.data?.energy || '-';
          const tbDeviceId = result.tb_device_id;

          if (tbDeviceId && token && result.online) {
            try {
              const rTb = await fetch(
                `${TB_URL}/api/plugins/telemetry/DEVICE/${tbDeviceId}/values/timeseries?keys=energy`,
                { headers: { "X-Authorization": "Bearer " + token } }
              );
              const dTb = await rTb.json();
              const eRaw = dTb.energy?.[0]?.value;
              if (eRaw !== undefined) {
                energyVal = parseFloat(eRaw).toString();
              }
            } catch (tbErr) {
              console.error(`Failed to fetch Energy from ThingsBoard for Node ${node.id}:`, tbErr);
            }
          }

          setStatusData({
            online: result.online,
            data: {
              ...(result.data || { voltage: '-', current: '-', power: '-', energy: '-', battery_pct: null }),
              energy: energyVal
            }
          });
        }
      } catch (err) {
        if (isMounted) setStatusData((prev: any) => ({ ...prev, online: false }));
      }
    };

    fetchRealTimeStatus();
    const intervalId = setInterval(fetchRealTimeStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [node.id, token]);

  const { online, data } = statusData;

  const DataCard = ({ title, value, unit, icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-2xl font-extrabold text-gray-800">{online ? value : '-'}</span>
          <span className="text-sm font-bold text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-[360px] shrink-0 h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-200 flex flex-col z-10 relative transition-all duration-300">
      
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

            {online && data?.battery_pct !== undefined && data.battery_pct !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0F7FF] text-[#48A0D8] border border-[#D0E6FB]">
                <BatteryCharging size={14} /> {data.battery_pct}%
              </div>
            )}
          </div>
        </div>

        {online && (
          <button 
            onClick={() => navigate(`/energy-monitor/${node.id}`)} 
            className="mt-5 w-full bg-[#48A0D8] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-blue-500 transition-colors"
          >
            <Share size={16} strokeWidth={2.5} /> ดูสถิติกราฟแบบละเอียด
          </button>
        )}
      </div>

      <div className="flex-1 px-6 py-6 bg-[#F8FAFC] overflow-y-auto">
        <p className="text-[11px] font-extrabold text-gray-400 mb-4 tracking-widest uppercase">
          Real-time Monitor
        </p>
        
        <div className="flex flex-col gap-3.5">
          <DataCard 
            title="Voltage" value={data.voltage} unit="V" 
            icon={<Zap size={22} />} colorClass="text-yellow-500" bgClass="bg-yellow-50"
          />
          <DataCard 
            title="Current" value={data.current} unit="A" 
            icon={<Activity size={22} />} colorClass="text-blue-500" bgClass="bg-blue-50"
          />
          <DataCard 
            title="Power" value={data.power} unit="W" 
            icon={<Gauge size={22} />} colorClass="text-purple-500" bgClass="bg-purple-50"
          />
          <DataCard 
            title="Energy" value={data.energy} unit="Wh" 
            icon={<BatteryCharging size={22} />} colorClass="text-green-500" bgClass="bg-green-50"
          />
        </div>

        {!online && (
          <div className="mt-6 text-center p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <X size={24} />
            </div>
            <p className="text-sm font-bold text-red-600">อุปกรณ์ขาดการเชื่อมต่อ</p>
            <p className="text-xs text-gray-500 mt-1">ไม่สามารถดึงข้อมูลพลังงานได้ในขณะนี้</p>
          </div>
        )}
      </div>

    </div>
  );
}

// --- Main Page ---
export default function Home() {
  const { nodes } = useNodes();
  const [token, setToken] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);

  useEffect(() => {
    const login = async () => {
      try {
        const r = await fetch(TB_URL + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "tenant@thingsboard.org", password: "tenant" })
        });
        const data = await r.json();
        setToken(data.token);
      } catch (error) {
        console.error("ThingsBoard Central Login Error:", error);
      }
    };
    login();
  }, []);

  return (
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-[#F8FAFC] flex overflow-hidden">
      
      <div className="flex-1 h-full relative z-0">
        <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <AutoFit />
          
          {/* ✅ วางปุ่ม Recenter Control ตรงนี้ */}
          <RecenterControl nodes={nodes} />

          {nodes.map((node) => (
             <PoleMarker 
               key={node.id} 
               node={node} 
               isSelected={selectedNode?.id === node.id}
               onSelect={(targetNode) => setSelectedNode(targetNode)} 
             />
          ))}
        </MapContainer>
      </div>

      {selectedNode && (
        <NodeSidebar node={selectedNode} token={token} onClose={() => setSelectedNode(null)} />
      )}

    </main>
  );
}