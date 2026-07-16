import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Mic, Square, AlertTriangle, CheckSquare, Square as SquareOutline, Radio, ChevronUp, ChevronDown, Focus } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';
import 'leaflet/dist/leaflet.css';
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

// ✅ อัปเกรดปุ่ม Recenter: สีและขนาดกลับมาเหมือนหน้าอื่นๆ แต่ยังคงดิ้นหลบแผงควบคุมได้
function RecenterControl({ nodes }: { nodes: NodeItem[] }) {
  const map = useMap();

  const handleRecenter = () => {
    if (nodes && nodes.length > 0) {
      const bounds = nodes.map(node => [node.lat, node.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  };

  return (
    <div className="leaflet-bottom leaflet-right">
      {/* ใช้คลาส Tailwind ประกาศิต (!) เพื่อดันหลบ UI แต่สไตล์ปุ่มเหมือนเดิมเป๊ะ */}
      <div className="leaflet-control leaflet-bar shadow-xl !mb-[110px] md:!mb-[35px] !mr-[10px]">
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

export default function Broadcast() {
  const { nodes } = useNodes();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const onlineCount = Object.values(onlineStatuses).filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;

    const fetchAllStatuses = async () => {
      if (nodes.length === 0) return;
      
      const newStatuses: Record<string, boolean> = {};
      
      for (const node of nodes) {
        try {
          const res = await fetch(`${API_URL}/get_node_status.php?id=${node.id}`);
          const data = await res.json();
          newStatuses[node.id] = data.status === 'success' ? data.online : false;
        } catch {
          newStatuses[node.id] = false;
        }
      }

      if (isMounted) setOnlineStatuses(newStatuses);
    };

    fetchAllStatuses();
    const intervalId = setInterval(fetchAllStatuses, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [nodes]);

  useEffect(() => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const id of next) {
        if (onlineStatuses[id] === false) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [onlineStatuses]);

  const toggleNode = (id: string) => {
    if (onlineStatuses[id] !== true) {
      alert("⚠️ เสานี้ Offline อยู่ ไม่สามารถเลือกได้ครับ");
      return;
    }

    const newSelected = new Set(selectedNodes);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedNodes(newSelected);

    if (!isMobileExpanded && window.innerWidth < 768) {
      setIsMobileExpanded(true);
    }
  };

  const handleSelectAll = () => {
    const onlineNodeIds = nodes.filter(n => onlineStatuses[n.id] === true).map(n => n.id);
    if (onlineNodeIds.length === 0) {
      alert("⚠️ ไม่มีเสาไฟที่ Online อยู่ในขณะนี้ครับ");
      return;
    }
    setSelectedNodes(new Set(onlineNodeIds));
  };

  const handleStartBroadcast = async () => {
    if (selectedNodes.size === 0) {
      alert("กรุณาเลือกเสาไฟบนแผนที่ก่อนครับ");
      return;
    }
    const nodesArray = Array.from(selectedNodes);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nodes', JSON.stringify(nodesArray));
      await fetch(`${API_URL}/broadcast_live.php`, { method: 'POST', body: formData });
      setIsBroadcasting(true);
    } catch (error) {
      console.error("Broadcast Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBroadcast = async () => {
    const nodesArray = Array.from(selectedNodes);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nodes', JSON.stringify(nodesArray));
      await fetch(`${API_URL}/broadcast_stop.php`, { method: 'POST', body: formData });
      setIsBroadcasting(false);
    } catch (error) {
      console.error("Stop Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAlarm = async () => {
    if (selectedNodes.size === 0) {
      alert("กรุณาเลือกเสาไฟที่ต้องการแจ้งเตือนก่อนครับ");
      return;
    }

    const confirmAlarm = window.confirm("🚨 ยืนยันการเปิดเสียงสัญญาณเตือนภัยในพื้นที่ที่เลือก?");
    if (!confirmAlarm) return;

    setIsLoading(true);
    try {
      const nodesArray = Array.from(selectedNodes);
      for (const nodeId of nodesArray) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode && (targetNode as any).ip_address) {
          const formData = new URLSearchParams();
          formData.append('node_id', targetNode.id);
          formData.append('ip', (targetNode as any).ip_address); 
          formData.append('file', 'alarm.mp3'); 

          await fetch(`${API_URL}/play_audio.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
          });
        }
      }
      setIsAlarmPlaying(true); 
    } catch (error) {
      console.error("Error playing alarm:", error);
      alert("เกิดข้อผิดพลาดในการส่งคำสั่ง Alarm");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAlarm = async () => {
    setIsLoading(true);
    try {
      const nodesArray = Array.from(selectedNodes);
      for (const nodeId of nodesArray) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode && (targetNode as any).ip_address) {
          const formData = new URLSearchParams();
          formData.append('node_id', targetNode.id);
          formData.append('ip', (targetNode as any).ip_address); 

          await fetch(`${API_URL}/stop_audio.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
          });
        }
      }
      setIsAlarmPlaying(false); 
    } catch (error) {
      console.error("Error stopping alarm:", error);
      alert("เกิดข้อผิดพลาดในการหยุดเสียง Alarm");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-[#F8FAFC] flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* ฝั่งซ้าย: แผนที่ระบบ */}
      <div className="flex-1 w-full relative z-0">
        <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          
          <AutoFit />
          <RecenterControl nodes={nodes} />

          {nodes.map((node) => {
            const isSelected = selectedNodes.has(node.id);
            const isOnline = onlineStatuses[node.id] === true;
            
            const statusDot = isOnline ? 'bg-[#76E136]' : 'bg-red-500';
            const filterStyle = isOnline 
              ? (isSelected ? 'drop-shadow(0 0 10px rgba(72,160,216,0.9))' : 'none') 
              : 'grayscale(100%) opacity(60%)';

            const icon = L.divIcon({
              className: 'custom-pole-icon',
              html: `
                <div style="display: flex; flex-direction: column; align-items: center; width: 100px; transition: all 0.3s; cursor: ${isOnline ? 'pointer' : 'not-allowed'}; transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'}">
                  <img src="/pole.png" style="width: 40px; height: 80px; object-fit: contain; filter: ${filterStyle};" />
                  <div class="${isSelected ? 'bg-[#48A0D8]' : 'bg-gray-900'} text-white px-2.5 py-1 rounded-full font-bold shadow-lg text-[11px] mt-1 border border-white text-center whitespace-nowrap flex items-center justify-center gap-1.5 transition-colors">
                    <div class="w-1.5 h-1.5 rounded-full ${statusDot} ${isOnline && isSelected ? 'animate-pulse' : ''}"></div>
                    ${node.name}
                  </div>
                </div>
              `,
              iconSize: [100, 110],
              iconAnchor: [50, 100] 
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
      </div>

      {/* แผงควบคุม Broadcast */}
      <div className={`
        absolute bottom-4 right-4 z-[1000] w-[calc(100%-32px)] sm:w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 overflow-hidden
        md:static md:w-[360px] md:h-full md:rounded-none md:border-l md:border-t-0 md:shadow-[-10px_0_30px_rgba(0,0,0,0.05)] md:flex-shrink-0
      `}>
        
        {/* Header */}
        <div 
          onClick={() => { if (window.innerWidth < 768) setIsMobileExpanded(!isMobileExpanded); }}
          className="bg-white px-5 py-4 md:px-6 md:py-6 border-b border-gray-100 flex items-center justify-between cursor-pointer md:cursor-default shrink-0"
        >
          <div className="flex flex-col">
            <h2 className="font-extrabold text-xl md:text-2xl text-gray-900 tracking-tight flex items-center gap-2">
              <Radio size={24} className="text-[#48A0D8]" /> Broadcast
            </h2>
            <p className="text-[10px] md:text-xs text-[#48A0D8] bg-[#F0F7FF] px-2 py-0.5 rounded-md mt-1.5 font-bold tracking-wide self-start border border-[#D0E6FB]">
              เลือกแล้ว {selectedNodes.size} / {onlineCount} พื้นที่
            </p>
          </div>
          
          <div className="md:hidden text-gray-500 bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors">
            {isMobileExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>

        {/* Body */}
        <div className={`
          flex-1 bg-[#F8FAFC] flex flex-col gap-4 overflow-y-auto transition-all duration-300
          ${isMobileExpanded ? 'max-h-[60vh] p-4 opacity-100' : 'max-h-0 p-0 opacity-0'} 
          md:max-h-none md:p-6 md:opacity-100
        `}>
          
          {/* Card: เลือกพื้นที่เป้าหมาย */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 md:p-5">
            <p className="text-[11px] font-extrabold text-gray-400 tracking-widest uppercase mb-3">Target Area</p>

            <div className="flex gap-2">
              <button 
                onClick={handleSelectAll} 
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold border border-gray-200 py-2.5 rounded-xl hover:bg-[#E5F3FF] hover:border-[#48A0D8] hover:text-[#48A0D8] transition-all text-gray-600"
              >
                <CheckSquare size={16} /> ทั้งหมด
              </button>
              <button 
                onClick={() => setSelectedNodes(new Set())} 
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold border border-gray-200 py-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-600"
              >
                <SquareOutline size={16} /> ยกเลิก
              </button>
            </div>
            {selectedNodes.size === 0 && (
              <p className="text-[10px] md:text-[11px] text-gray-400 text-center mt-3 font-medium">
                * คลิกที่หมุดเสาไฟบนแผนที่เพื่อเลือกพื้นที่เป้าหมาย
              </p>
            )}
          </div>

          {/* Card: ประกาศเสียงสด */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <Mic size={16} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-gray-800 leading-tight">Live Broadcast</p>
                <p className="text-[10px] md:text-[11px] text-gray-500">พูดผ่านไมโครโฟนเพื่อกระจายเสียง</p>
              </div>
            </div>

            {!isBroadcasting ? (
              <button 
                onClick={handleStartBroadcast}
                disabled={isLoading || isAlarmPlaying || selectedNodes.size === 0}
                className="w-full bg-[#48A0D8] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isLoading ? 'กำลังส่งคำสั่ง...' : '▶ เริ่มประกาศเสียงสด'}
              </button>
            ) : (
              <button 
                onClick={handleStopBroadcast}
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all animate-pulse shadow-md"
              >
                <Square size={16} fill="currentColor" /> {isLoading ? 'กำลังส่งคำสั่ง...' : 'หยุดประกาศเสียง'}
              </button>
            )}
          </div>

          {/* Card: เสียงแจ้งเตือนภัย */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-gray-800 leading-tight">Emergency Alarm</p>
                <p className="text-[10px] md:text-[11px] text-gray-500">เปิดไซเรนฉุกเฉินในพื้นที่</p>
              </div>
            </div>

            {!isAlarmPlaying ? (
              <button 
                onClick={handlePlayAlarm}
                disabled={isLoading || isBroadcasting || selectedNodes.size === 0}
                className="w-full bg-white border-2 border-red-500 text-red-500 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50"
              >
                {isLoading ? 'กำลังประมวลผล...' : '🚨 เปิดเสียงแจ้งเตือนภัย'}
              </button>
            ) : (
              <button 
                onClick={handleStopAlarm}
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all animate-pulse shadow-md"
              >
                <Square size={16} fill="currentColor" /> {isLoading ? 'กำลังหยุด...' : 'หยุดเสียงแจ้งเตือนภัย'}
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}