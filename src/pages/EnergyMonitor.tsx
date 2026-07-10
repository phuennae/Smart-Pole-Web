import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useNodes } from '../context/NodeContext';

// ลงทะเบียน Plugin สำหรับซูมกราฟ
Chart.register(zoomPlugin);

const TB_URL = "http://theoneiot.i234.me:9090";
// ⚠️ หมายเหตุ: ตอนนี้ใช้ ID คงที่ตามไฟล์เดิม 
const DEVICE_ID = "bc2557d0-46a8-11f1-8573-dd37fef65191"; 

export default function EnergyMonitor() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes } = useNodes(); // ดึงข้อมูล Node ทั้งหมดจาก Context

  // ค้นหาชื่อ Node ที่ตรงกับ ID
  const currentNode = nodes.find(n => n.id.toString() === nodeId);
  const nodeName = currentNode ? currentNode.name : `Node ${nodeId}`;

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [token, setToken] = useState<string>('');
  const [kpi, setKpi] = useState({ v: '-', c: '-', p: '-', e: '-' });

  // 1. ล็อกอินเอา Token
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
          { label: "Voltage (V)", data: [], borderColor: "#22c55e", tension: 0.3, pointRadius: 1 },
          { label: "Current (A)", data: [], borderColor: "#3b82f6", tension: 0.3, pointRadius: 1 },
          { label: "Power (W)", data: [], borderColor: "#f59e0b", tension: 0.3, pointRadius: 1 },
          { label: "Energy (Wh)", data: [], borderColor: "#ef4444", tension: 0.3, pointRadius: 1 }
        ]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#e5e7eb" } },
          zoom: {
            zoom: { wheel: { enabled: true }, mode: 'x' },
            pan: { enabled: true, mode: 'x' }
          }
        },
        scales: {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "#374151" } },
          y: { ticks: { color: "#9ca3af" }, grid: { color: "#374151" } }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  // 3. ฟังก์ชันโหลดประวัติกราฟย้อนหลัง
  const loadHistory = async (ms: number) => {
    if (!token || !chartInstance.current) return;
    
    const end = Date.now();
    const start = end - ms;

    try {
      // เพิ่ม limit=5000 และ agg=NONE เพื่อบังคับให้ ThingsBoard ส่งข้อมูลดิบทั้งหมดกลับมา
      const url = `${TB_URL}/api/plugins/telemetry/DEVICE/${DEVICE_ID}/values/timeseries?keys=voltage,current,power,energy&startTs=${start}&endTs=${end}&limit=5000&agg=NONE`;
      const r = await fetch(url, { headers: { "X-Authorization": "Bearer " + token } });
      const d = await r.json();

      // ป้องกัน Array ว่าง
      const vData = d.voltage || [];
      const cData = d.current || [];
      const pData = d.power || [];
      const eData = d.energy || [];

      let combined = vData.map((v: any, i: number) => ({
        ts: v.ts,
        voltage: parseFloat(v.value),
        current: parseFloat(cData[i]?.value || 0),
        power: parseFloat(pData[i]?.value || 0),
        energy: parseFloat(eData[i]?.value || 0)
      }));

      combined.sort((a: any, b: any) => a.ts - b.ts);

      const chart = chartInstance.current;
      chart.data.labels = combined.map((x: any) => new Date(x.ts).toLocaleTimeString('en-GB'));
      chart.data.datasets[0].data = combined.map((x: any) => x.voltage);
      chart.data.datasets[1].data = combined.map((x: any) => x.current);
      chart.data.datasets[2].data = combined.map((x: any) => x.power);
      chart.data.datasets[3].data = combined.map((x: any) => x.energy);
      chart.update();
    } catch (error) {
      console.error("Load History Error:", error);
    }
  };

  // 4. โหลดข้อมูล Real-time และพลอตกราฟขยับตาม
  useEffect(() => {
    if (!token) return;

    loadHistory(3600000); // โหลด 1 ชั่วโมงแรกลงไปก่อน

    const fetchRealtime = async () => {
      try {
        const r = await fetch(
          `${TB_URL}/api/plugins/telemetry/DEVICE/${DEVICE_ID}/values/timeseries?keys=voltage,current,power,energy`,
          { headers: { "X-Authorization": "Bearer " + token } }
        );
        const d = await r.json();
        
        const v = d.voltage?.slice(-1)[0]?.value ?? "-";
        const c = d.current?.slice(-1)[0]?.value ?? "-";
        const p = d.power?.slice(-1)[0]?.value ?? "-";
        const e = d.energy?.slice(-1)[0]?.value ?? "-";

        setKpi({ v, c, p, e });

        // --- เพิ่มลูกเล่น: พลอตกราฟแบบ Real-time ขยับไปเรื่อยๆ ---
        if (chartInstance.current && v !== "-") {
          const chart = chartInstance.current;
          const now = new Date().toLocaleTimeString('en-GB');
          
          chart.data.labels?.push(now);
          chart.data.datasets[0].data.push(parseFloat(v));
          chart.data.datasets[1].data.push(parseFloat(c));
          chart.data.datasets[2].data.push(parseFloat(p));
          chart.data.datasets[3].data.push(parseFloat(e));

          // ถ้าจุดเยอะเกิน 500 จุด ให้ลบจุดเก่าสุดออกกราฟจะได้ไม่หน่วง
          if ((chart.data.labels?.length || 0) > 500) {
            chart.data.labels?.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
          }

          chart.update('none'); // สั่งอัปเดตกราฟทันที
        }
      } catch (error) {
        console.error("Realtime fetch error:", error);
      }
    };

    fetchRealtime();
    const intervalId = setInterval(fetchRealtime, 2000); // ดึงและพลอตทุก 2 วินาที

    return () => clearInterval(intervalId);
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e5e7eb] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-[#111827] flex items-center justify-between shadow-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors">
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        <div className="font-bold text-xl text-center flex-1 tracking-wide">
          ⚡ Energy Dashboard : {nodeName}
        </div>
        <div className="w-28"></div>
      </header>

      <div className="p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button onClick={() => loadHistory(3600000)} className="bg-[#1f2937] hover:bg-gray-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm transition-colors border border-gray-600">1H</button>
          <button onClick={() => loadHistory(86400000)} className="bg-[#1f2937] hover:bg-gray-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm transition-colors border border-gray-600">24H</button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-[#111827] py-6 px-4 rounded-2xl text-center shadow-lg border border-gray-800">
            <h3 className="text-gray-400 text-sm font-bold mb-2">Voltage</h3>
            <h1 className="text-4xl font-black text-[#22c55e]">{kpi.v} <span className="text-xl text-gray-500">V</span></h1>
          </div>
          <div className="bg-[#111827] py-6 px-4 rounded-2xl text-center shadow-lg border border-gray-800">
            <h3 className="text-gray-400 text-sm font-bold mb-2">Current</h3>
            <h1 className="text-4xl font-black text-[#3b82f6]">{kpi.c} <span className="text-xl text-gray-500">A</span></h1>
          </div>
          <div className="bg-[#111827] py-6 px-4 rounded-2xl text-center shadow-lg border border-gray-800">
            <h3 className="text-gray-400 text-sm font-bold mb-2">Power</h3>
            <h1 className="text-4xl font-black text-[#f59e0b]">{kpi.p} <span className="text-xl text-gray-500">W</span></h1>
          </div>
          <div className="bg-[#111827] py-6 px-4 rounded-2xl text-center shadow-lg border border-gray-800">
            <h3 className="text-gray-400 text-sm font-bold mb-2">Energy</h3>
            <h1 className="text-4xl font-black text-[#ef4444]">{kpi.e} <span className="text-xl text-gray-500">Wh</span></h1>
          </div>
        </div>

        {/* กราฟ Chart.js */}
        <div className="bg-[#111827] rounded-2xl p-6 shadow-lg border border-gray-800 flex-1 relative min-h-[450px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}