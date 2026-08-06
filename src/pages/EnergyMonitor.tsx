import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Chart from 'chart.js/auto';
import { useNodes } from '../context/NodeContext';
import { API_URL } from '../config';

const TB_URL = "http://theoneiot.i234.me:9090";

export default function EnergyMonitor() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes } = useNodes(); 

  const currentNode = nodes.find(n => n.id.toString() === nodeId);
  const nodeName = currentNode ? currentNode.name : `Node ${nodeId}`;

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [token, setToken] = useState<string>('');
  const [kpi, setKpi] = useState({ v: '-', c: '-', p: '-', e: '-' });

  // 1. ล็อกอินเอา Token ของ ThingsBoard
  useEffect(() => {
    const login = async () => {
      try {
        const r = await fetch(TB_URL + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "tenant@thingsboard.org",
            password: "tenant"
          })
        });
        const data = await r.json();
        setToken(data.token);
      } catch (error) {
        console.error("ThingsBoard Login Error:", error);
      }
    };
    login();
  }, []);

  // 2. สร้างโครงสร้างกราฟ
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { 
            label: "Voltage (V)", data: [], borderColor: "#22c55e", 
            fill: false, tension: 0.2, pointRadius: 3, pointBackgroundColor: "#ffffff", pointBorderColor: "#22c55e", pointBorderWidth: 2, borderWidth: 2.5
          },
          { 
            label: "Current (A)", data: [], borderColor: "#3b82f6", 
            fill: false, tension: 0.2, pointRadius: 3, pointBackgroundColor: "#ffffff", pointBorderColor: "#3b82f6", pointBorderWidth: 2, borderWidth: 2.5
          },
          { 
            label: "Power (W)", data: [], borderColor: "#f59e0b", 
            fill: false, tension: 0.2, pointRadius: 3, pointBackgroundColor: "#ffffff", pointBorderColor: "#f59e0b", pointBorderWidth: 2, borderWidth: 2.5
          }
        ]
      },
      options: {
        animation: { duration: 400 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#e5e7eb", font: { weight: 'bold' } } }
        },
        scales: {
          x: { ticks: { color: "#9ca3af", maxRotation: 45 }, grid: { color: "#374151" } },
          y: { beginAtZero: false, ticks: { color: "#9ca3af" }, grid: { color: "#374151" } }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  // 3. ระบบดึงข้อมูลสดๆ
  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const rLocal = await fetch(`${API_URL}/get_node_status.php?id=${nodeId}`);
        const dLocal = await rLocal.json();
        
        let v = null, c = null, p = null;
        let eStr = '-'; 

        if (dLocal.status === 'success' && dLocal.online) {
          v = dLocal.data.voltage !== undefined ? parseFloat(dLocal.data.voltage) : null;
          c = dLocal.data.current !== undefined ? parseFloat(dLocal.data.current) : null;
          p = dLocal.data.power !== undefined ? parseFloat(dLocal.data.power) : null;
        }

        const tbDeviceId = dLocal.tb_device_id; 
        
        if (tbDeviceId && token) {
          try {
            const rTb = await fetch(
              `${TB_URL}/api/plugins/telemetry/DEVICE/${tbDeviceId}/values/timeseries?keys=energy`,
              { headers: { "X-Authorization": "Bearer " + token } }
            );
            const dTb = await rTb.json();
            const eRaw = dTb.energy?.[0]?.value;
            if (eRaw !== undefined) {
              eStr = parseFloat(eRaw).toString();
            }
          } catch (tbErr) {
            console.error("Failed to fetch Energy from ThingsBoard", tbErr);
          }
        }

        if (v !== null) {
          setKpi({ 
            v: v.toString(), 
            c: c !== null ? c.toString() : '-', 
            p: p !== null ? p.toString() : '-', 
            e: eStr 
          });

          if (chartInstance.current) {
            const chart = chartInstance.current;
            const now = new Date().toLocaleTimeString('th-TH');
            
            chart.data.labels?.push(now);
            chart.data.datasets[0].data.push(v);
            chart.data.datasets[1].data.push(c !== null ? c : 0);
            chart.data.datasets[2].data.push(p !== null ? p : 0);

            if ((chart.data.labels?.length || 0) > 40) {
              chart.data.labels?.shift();
              chart.data.datasets.forEach(dataset => dataset.data.shift());
            }

            chart.update();
          }
        } else {
          setKpi({ v: '-', c: '-', p: '-', e: '-' });
        }

      } catch (error) {
        console.error("Realtime fetch error:", error);
      }
    };

    if (token) {
      fetchRealtime();
      const intervalId = setInterval(fetchRealtime, 2000); 
      return () => clearInterval(intervalId);
    }
  }, [nodeId, token]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e5e7eb] font-sans flex flex-col">
      {/* Header - ปรับให้ Responsive */}
      <header className="px-4 py-4 md:px-6 bg-[#111827] flex flex-col md:flex-row items-start md:items-center justify-between shadow-md gap-3 md:gap-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors w-full md:w-auto">
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        <div className="font-bold text-lg md:text-xl text-center flex-1 tracking-wide flex items-center justify-start md:justify-center gap-2 w-full">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shrink-0"></span>
          <span className="truncate">⚡ Energy Dashboard : {nodeName}</span>
        </div>
        <div className="hidden md:block w-28"></div>
      </header>

      <div className="p-4 md:p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full overflow-hidden">
        {/* KPI Cards - แบ่งเป็น 2 คอลัมน์บนมือถือ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-[#111827] py-4 md:py-6 px-2 md:px-4 rounded-2xl text-center shadow-lg border border-gray-800 relative flex flex-col justify-center">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1 md:mb-2">Voltage</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#22c55e] break-words">{kpi.v} <span className="text-sm md:text-xl text-gray-500">V</span></h1>
          </div>
          <div className="bg-[#111827] py-4 md:py-6 px-2 md:px-4 rounded-2xl text-center shadow-lg border border-gray-800 relative flex flex-col justify-center">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1 md:mb-2">Current</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#3b82f6] break-words">{kpi.c} <span className="text-sm md:text-xl text-gray-500">A</span></h1>
          </div>
          <div className="bg-[#111827] py-4 md:py-6 px-2 md:px-4 rounded-2xl text-center shadow-lg border border-gray-800 relative flex flex-col justify-center">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1 md:mb-2">Power</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#f59e0b] break-words">{kpi.p} <span className="text-sm md:text-xl text-gray-500">W</span></h1>
          </div>
          <div className="bg-[#111827] py-4 md:py-6 px-2 md:px-4 rounded-2xl text-center shadow-lg border border-gray-800 relative flex flex-col justify-center">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1 md:mb-2">Energy</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ef4444] break-words">{kpi.e} <span className="text-sm md:text-xl text-gray-500">Wh</span></h1>
          </div>
        </div>

        {/* กราฟ Chart.js - ปรับความสูงขั้นต่ำตามขนาดจอ */}
        <div className="bg-[#111827] rounded-2xl p-4 md:p-6 shadow-lg border border-gray-800 flex-1 relative min-h-[300px] md:min-h-[450px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}