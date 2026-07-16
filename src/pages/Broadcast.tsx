import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Mic, Square, AlertTriangle, CheckSquare, Square as SquareOutline, Radio } from 'lucide-react';
import { useNodes } from '../context/NodeContext';
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

export default function Broadcast() {
  const { nodes } = useNodes();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  
  // States สำหรับเก็บสถานะ Online/Offline ของแต่ละเสา (id -> boolean)
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});
  
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  // คำนวณจำนวนเสาที่ Online ทั้งหมด
  const onlineCount = Object.values(onlineStatuses).filter(Boolean).length;

  // --- ดึงสถานะ Real-time ของทุกเสา ---
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

      if (isMounted) {
        setOnlineStatuses(newStatuses);
      }
    };

    fetchAllStatuses();
    const intervalId = setInterval(fetchAllStatuses, 10000);

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
    <main className="flex-1 h-[calc(100vh-72px)] md:h-screen relative bg-[#F8FAFC] flex overflow-hidden font-sans">
      
      {/* ฝั่งซ้าย: แผนที่ระบบ */}
      <div className="flex-1 h-full relative z-0">
        <MapContainer center={[18.7953, 98.9529]} zoom={16} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <AutoFit />
          {nodes.map((node) => {
            const isSelected = selectedNodes.has(node.id);
            const isOnline = onlineStatuses[node.id] === true;
            
            // เปลี่ยนสีจุดสถานะ
            const statusDot = isOnline ? 'bg-[#76E136]' : 'bg-red-500';
            // ทำให้ภาพเสาไฟเทาลงถ้าออฟไลน์ และมีวงแสงถ้าถูกเลือก
            const filterStyle = isOnline 
              ? (isSelected ? 'drop-shadow(0 0 10px rgba(72,160,216,0.9))' : 'none') 
              : 'grayscale(100%) opacity(60%)';

            // ✅ ปรับขนาดไอคอนให้กว้าง 40px สูง 80px เท่ากับหน้าอื่น
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
              iconSize: [100, 110], // ขยายกรอบไอคอนเผื่อชื่อยาว
              iconAnchor: [50, 100] // ปรับจุดยึดให้ตรงกับโคนเสา
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

      {/* ฝั่งขวา: Sidebar แผงควบคุม Broadcast */}
      <div className="w-[360px] shrink-0 h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-gray-200 flex flex-col z-10 relative transition-all duration-300">
        
        {/* Header คลีนๆ สีขาว-เทา */}
        <div className="bg-white px-6 py-6 border-b border-gray-100 flex flex-col shrink-0">
          <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight flex items-center gap-2">
            <Radio size={24} className="text-[#48A0D8]" /> Broadcast
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 font-medium tracking-wide">ระบบประกาศเสียงตามสายและแจ้งเตือนภัย</p>
        </div>

        {/* Body พื้นหลังสีเทาอ่อน สไตล์ Dashboard */}
        <div className="flex-1 px-6 py-6 bg-[#F8FAFC] overflow-y-auto flex flex-col gap-5">
          
          {/* Card: เลือกพื้นที่เป้าหมาย */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[11px] font-extrabold text-gray-400 tracking-widest uppercase">Target Area</p>
              <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F0F7FF] text-[#48A0D8] border border-[#D0E6FB]">
                เลือกแล้ว {selectedNodes.size} / {onlineCount}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSelectAll} 
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold border border-gray-200 py-2.5 rounded-xl hover:bg-[#E5F3FF] hover:border-[#48A0D8] hover:text-[#48A0D8] transition-all text-gray-600"
              >
                <CheckSquare size={16} /> เลือกทั้งหมด
              </button>
              <button 
                onClick={() => setSelectedNodes(new Set())} 
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold border border-gray-200 py-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-600"
              >
                <SquareOutline size={16} /> ยกเลิกทั้งหมด
              </button>
            </div>
            {selectedNodes.size === 0 && (
              <p className="text-[11px] text-gray-400 text-center mt-3 font-medium">
                * คลิกที่หมุดเสาไฟบนแผนที่เพื่อเลือกพื้นที่เป้าหมาย
              </p>
            )}
          </div>

          {/* Card: ประกาศเสียงสด */}
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Mic size={16} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-gray-800">Live Broadcast</p>
                <p className="text-[11px] text-gray-500">พูดผ่านไมโครโฟนเพื่อกระจายเสียงสด</p>
              </div>
            </div>

            {!isBroadcasting ? (
              <button 
                onClick={handleStartBroadcast}
                disabled={isLoading || isAlarmPlaying || selectedNodes.size === 0}
                className="w-full bg-[#48A0D8] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isLoading ? 'กำลังส่งคำสั่ง...' : '▶ เริ่มประกาศเสียง'}
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
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-gray-800">Emergency Alarm</p>
                <p className="text-[11px] text-gray-500">เปิดเสียงไซเรนฉุกเฉินในพื้นที่</p>
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