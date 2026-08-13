import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Chart from 'chart.js/auto';
import { useNodes } from '../context/NodeContext';
import { API_URL } from '../config';

export default function EnergyMonitor() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes } = useNodes(); 

  const currentNode = nodes.find(n => n.id.toString() === nodeId);
  const nodeName = currentNode ? currentNode.name : `Node ${nodeId}`;

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [kpi, setKpi] = useState({ v: '-', c: '-', p: '-' });
  const [timeRange, setTimeRange] = useState('24h');
  const [lastUpdate, setLastUpdate] = useState('-');
  const [isFetching, setIsFetching] = useState(false);

  // 1. สร้างโครงสร้างกราฟ Chart.js
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { 
            label: "Voltage (V)", data: [], borderColor: "#22c55e", 
            fill: false, tension: 0.2, pointRadius: 0, borderWidth: 2
          },
          { 
            label: "Current (A)", data: [], borderColor: "#3b82f6", 
            fill: false, tension: 0.2, pointRadius: 0, borderWidth: 2
          },
          { 
            label: "Power (W)", data: [], borderColor: "#f59e0b", 
            fill: false, tension: 0.2, pointRadius: 0, borderWidth: 2
          }
        ]
      },
      options: {
        animation: { duration: 0 }, // ปิดอนิเมชั่นตอนโหลดข้อมูลชุดใหญ่
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { labels: { color: "#e5e7eb", font: { weight: 'bold' } } },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#fff',
            bodyColor: '#e5e7eb',
            borderColor: '#374151',
            borderWidth: 1
          }
        },
        scales: {
          x: { 
            ticks: { 
              color: "#9ca3af",
              maxTicksLimit: 10, // ไม่ให้ฉลากแกน X แน่นเกินไป
              maxRotation: 0 
            }, 
            grid: { color: "#374151", drawTicks: false } 
          },
          y: { 
            beginAtZero: false, 
            ticks: { color: "#9ca3af" }, 
            grid: { color: "#374151" } 
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  // 2. ฟังก์ชันดึงข้อมูลจาก API ฝั่ง Backend
  const fetchData = async () => {
    if (isFetching) return;
    setIsFetching(true);
    
    try {
      // เรียกใช้ API ตัวใหม่ของเรา
      const response = await fetch(`${API_URL}/get_energy_data.php?node_id=${nodeId}&range=${timeRange}`);
      const data = await response.json();

      if (data.error) {
        console.error("API Error:", data.message);
        setKpi({ v: '-', c: '-', p: '-' });
        setIsFetching(false);
        return;
      }

      // อัปเดตเวลาล่าสุด
      if (data.updatedAt) {
        const dateObj = new Date(data.updatedAt);
        setLastUpdate(dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }

      // อัปเดตข้อมูลไฟฟ้า (ตัด Environment ทิ้งตาม Requirement)
      if (data.groups && data.groups.electrical) {
        const elec = data.groups.electrical;

        // 2.1 อัปเดต KPI Cards (ข้อมูลล่าสุด) โดยมี Fallback ชื่อย่อ v, c, p
        const getLatest = (keyFull: string, keyShort: string) => {
          let item = elec.latest.find((l: any) => l.key === keyFull);
          if (!item || item.value === null) {
            item = elec.latest.find((l: any) => l.key === keyShort);
          }
          return item && item.value !== null ? Number(item.value).toFixed(2) : '-';
        };

        setKpi({
          v: getLatest('voltage', 'v'),
          c: getLatest('current', 'c'),
          p: getLatest('power', 'p')
        });

        // 2.2 อัปเดตกราฟ (ข้อมูลย้อนหลัง Series) มี Fallback เช่นกัน
        if (chartInstance.current) {
          const chart = chartInstance.current;
          
          const vSeries = (elec.series.find((s: any) => s.name === 'voltage') || elec.series.find((s: any) => s.name === 'v'))?.data || [];
          const cSeries = (elec.series.find((s: any) => s.name === 'current') || elec.series.find((s: any) => s.name === 'c'))?.data || [];
          const pSeries = (elec.series.find((s: any) => s.name === 'power') || elec.series.find((s: any) => s.name === 'p'))?.data || [];

          // ใช้เวลาจากแกน X ของ Voltage เป็นแกนเวลาหลัก
          const labels = vSeries.map((p: any) => {
             const d = new Date(p.x);
             return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          });

          chart.data.labels = labels;
          chart.data.datasets[0].data = vSeries.map((p: any) => p.y);
          chart.data.datasets[1].data = cSeries.map((p: any) => p.y);
          chart.data.datasets[2].data = pSeries.map((p: any) => p.y);
          
          chart.update();
        }
      }

    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // ดึงข้อมูลเมื่อโหลดหน้าเว็บ หรือเมื่อเปลี่ยนช่วงเวลา
  useEffect(() => {
    fetchData();
    // ตั้งเวลาโหลดซ้ำทุกๆ 30 วินาที
    const intervalId = setInterval(fetchData, 30000); 
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, timeRange]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e5e7eb] font-sans flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 md:px-6 bg-[#111827] flex flex-col md:flex-row items-start md:items-center justify-between shadow-md gap-4 md:gap-0 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors w-full md:w-auto">
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        
        <div className="font-bold text-lg md:text-xl text-center flex-1 tracking-wide flex items-center justify-start md:justify-center gap-2 w-full">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shrink-0"></span>
          <span className="truncate">⚡ Energy Dashboard : {nodeName}</span>
        </div>

        {/* ส่วนเลือกเวลา และ แสดงเวลาอัปเดตล่าสุด */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Last Update</span>
            <span className="text-xs font-bold text-[#48A0D8]">{lastUpdate}</span>
          </div>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#1f2937] text-white text-sm font-bold border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#48A0D8]"
          >
            <option value="1h">1 ชั่วโมงล่าสุด</option>
            <option value="6h">6 ชั่วโมงล่าสุด</option>
            <option value="24h">24 ชั่วโมงล่าสุด</option>
            <option value="7d">7 วันล่าสุด</option>
          </select>
          <button 
            onClick={fetchData} 
            disabled={isFetching}
            className="bg-[#48A0D8]/20 text-[#48A0D8] hover:bg-[#48A0D8] hover:text-white p-2 rounded-lg transition-colors disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={20} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="p-4 md:p-6 flex-1 flex flex-col max-w-7xl mx-auto w-full overflow-hidden">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-[#111827] py-5 px-3 rounded-2xl text-center shadow-lg border border-gray-800 flex flex-col justify-center transition-transform hover:-translate-y-1">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1">Voltage</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#22c55e] break-words">{kpi.v} <span className="text-sm md:text-xl text-gray-500 font-medium">V</span></h1>
          </div>
          <div className="bg-[#111827] py-5 px-3 rounded-2xl text-center shadow-lg border border-gray-800 flex flex-col justify-center transition-transform hover:-translate-y-1">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1">Current</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#3b82f6] break-words">{kpi.c} <span className="text-sm md:text-xl text-gray-500 font-medium">A</span></h1>
          </div>
          <div className="bg-[#111827] py-5 px-3 rounded-2xl text-center shadow-lg border border-gray-800 flex flex-col justify-center transition-transform hover:-translate-y-1">
            <h3 className="text-gray-400 text-xs md:text-sm font-bold mb-1">Power</h3>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#f59e0b] break-words">{kpi.p} <span className="text-sm md:text-xl text-gray-500 font-medium">W</span></h1>
          </div>
        </div>

        {/* กราฟ Chart.js */}
        <div className="bg-[#111827] rounded-2xl p-4 md:p-6 shadow-lg border border-gray-800 flex-1 relative min-h-[350px] md:min-h-[450px]">
          {isFetching && kpi.v === '-' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#111827]/80 backdrop-blur-sm rounded-2xl">
               <RefreshCw size={32} className="text-[#48A0D8] animate-spin mb-3" />
               <p className="text-sm font-bold text-gray-400">กำลังดึงข้อมูลย้อนหลัง...</p>
            </div>
          )}
          <canvas ref={chartRef}></canvas>
        </div>

      </div>
    </div>
  );
}