import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Mic, Square, AlertTriangle } from 'lucide-react';
import { useNodes } from '../context/NodeContext';
import 'leaflet/dist/leaflet.css';

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

export default function Broadcast() {
  const { nodes } = useNodes();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  
  // States สำหรับเก็บสถานะ Online/Offline ของแต่ละเสา (id -> boolean)
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});
  
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  // --- ดึงสถานะ Real-time ของทุกเสา ---
  useEffect(() => {
    let isMounted = true;

    const fetchAllStatuses = async () => {
      if (nodes.length === 0) return;
      
      const newStatuses: Record<string, boolean> = {};
      
      // วนลูปเช็คสถานะทุกเสา
      for (const node of nodes) {
        try {
          const res = await fetch(`http://localhost/api/get_node_status.php?id=${node.id}`);
          const data = await res.json();
          newStatuses[node.id] = data.status === 'success' ? data.online : false;
        } catch {
          newStatuses[node.id] = false;
        }
      }

      if (isMounted) {
        setOnlineStatuses(newStatuses);
      }
    };

    fetchAllStatuses();
    const intervalId = setInterval(fetchAllStatuses, 10000); // อัปเดตทุก 10 วินาที

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [nodes]);

  // --- ถอดเสาที่ Offline ออกจากรายการที่เลือก (ออโต้) ---
  useEffect(() => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const id of next) {
        // ถ้าสถานะมันอัปเดตเป็น Offline ให้เอาออกจากการเลือก
        if (onlineStatuses[id] === false) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [onlineStatuses]);

  // --- ฟังก์ชันเลือกเสาทีละต้น ---
  const toggleNode = (id: string) => {
    // ล็อกไม่ให้เลือกเสา Offline
    if (onlineStatuses[id] !== true) {
      alert("⚠️ เสานี้ Offline อยู่ ไม่สามารถเลือกได้ครับ");
      return;
    }

    const newSelected = new Set(selectedNodes);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedNodes(newSelected);
  };

  // --- ฟังก์ชันเลือกทั้งหมด (เฉพาะที่ Online) ---
  const handleSelectAll = () => {
    const onlineNodeIds = nodes.filter(n => onlineStatuses[n.id] === true).map(n => n.id);
    if (onlineNodeIds.length === 0) {
      alert("⚠️ ไม่มีเสาไฟที่ Online อยู่ในขณะนี้ครับ");
      return;
    }
    setSelectedNodes(new Set(onlineNodeIds));
  };

  // --- ฟังก์ชันประกาศเสียงสด ---
  const handleStartBroadcast = async () => {
    const nodesArray = Array.from(selectedNodes);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nodes', JSON.stringify(nodesArray));
      await fetch('http://localhost/api/broadcast_live.php', { method: 'POST', body: formData });
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
      await fetch('http://localhost/api/broadcast_stop.php', { method: 'POST', body: formData });
      setIsBroadcasting(false);
    } catch (error) {
      console.error("Stop Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ฟังก์ชัน Alarm ฉุกเฉิน ---
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

          await fetch('http://localhost/api/play_audio.php', {
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

          await fetch('http://localhost/api/stop_audio.php', {
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
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-gray-100 font-sans w-full">
      
      {/* แผงควบคุมด้านขวา */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] w-[calc(100%-32px)] sm:w-64">
        
        <div className="bg-white p-3 md:p-4 rounded-2xl shadow-xl flex flex-col gap-4 border border-gray-100">
          
          <div className="flex flex-col gap-3">
            
            {/* 1.1 ปุ่มประกาศเสียงสด */}
            {!isBroadcasting ? (
              <button 
                onClick={handleStartBroadcast}
                disabled={isLoading || isAlarmPlaying}
                className="w-full bg-[#48A0D8] text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-sm"
              >
                <Mic size={18} /> {isLoading ? 'กำลังส่งคำสั่ง...' : 'Start / เริ่มประกาศ'}
              </button>
            ) : (
              <button 
                onClick={handleStopBroadcast}
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all animate-pulse shadow-sm"
              >
                <Square size={18} fill="currentColor" /> {isLoading ? 'กำลังส่งคำสั่ง...' : 'Stop / หยุดประกาศ'}
              </button>
            )}

            {/* 1.2 ปุ่ม Alarm */}
            {!isAlarmPlaying ? (
              <button 
                onClick={handlePlayAlarm}
                disabled={isLoading || isBroadcasting}
                className="w-full bg-red-500 text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-md disabled:opacity-50"
              >
                <AlertTriangle size={18} fill="currentColor" /> {isLoading ? 'กำลังประมวลผล...' : 'เปิดเสียง Alarm'}
              </button>
            ) : (
              <button 
                onClick={handleStopAlarm}
                disabled={isLoading}
                className="w-full bg-gray-800 text-white py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all animate-pulse shadow-md disabled:opacity-50"
              >
                <Square size={18} fill="currentColor" /> {isLoading ? 'กำลังหยุด...' : 'หยุดเสียง Alarm'}
              </button>
            )}
            
          </div>

          <div className="h-px bg-gray-200 w-full my-0.5"></div>

          {/* โซนเลือกพื้นที่ */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 text-center tracking-wide">จัดการพื้นที่เป้าหมาย</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleSelectAll} className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">เลือกทั้งหมด</button>
              <button onClick={() => setSelectedNodes(new Set())} className="text-[11px] font-bold border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิกทั้งหมด</button>
            </div>
          </div>

        </div>
      </div>

      <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        <AutoFit />
        {nodes.map((node) => {
          const isSelected = selectedNodes.has(node.id);
          const isOnline = onlineStatuses[node.id] === true;
          
          // เปลี่ยนสีจุดสถานะ
          const statusDot = isOnline ? 'bg-[#76E136]' : 'bg-red-500';
          // ทำให้ภาพเสาไฟเทาลงถ้าออฟไลน์
          const filterStyle = isOnline 
            ? (isSelected ? 'drop-shadow(0 0 8px rgba(72,160,216,0.8))' : 'none') 
            : 'grayscale(100%) opacity(70%)';

          const icon = L.divIcon({
            className: 'custom-pole-icon',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; width: 80px; transition: all 0.3s; cursor: ${isOnline ? 'pointer' : 'not-allowed'};">
                <img src="/pole.png" style="width: 30px; height: 60px; object-fit: contain; filter: ${filterStyle};" />
                <div class="${isSelected ? 'bg-[#48A0D8]' : 'bg-black'} text-white px-2 py-0.5 rounded-full font-bold shadow-lg text-[10px] mt-1 border border-white text-center whitespace-nowrap flex items-center justify-center gap-1.5">
                  <div class="w-1.5 h-1.5 rounded-full ${statusDot}"></div>
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