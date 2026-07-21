import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ClipboardList, 
  Clock, 
  User as UserIcon, 
  Activity, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import { API_URL } from '../config';
import { useUsers } from '../context/UserContext';

// กำหนดโครงสร้างข้อมูล Log
interface LogEntry {
  id: number;
  username: string;
  action: string;
  node_name: string;
  created_at: string;
}

export default function ActivityLogs() {
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันดึงข้อมูล Log จาก Backend
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/get_logs.php`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setLogs(result.data);
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ป้องกันกรณี User ทั่วไปแอบพิมพ์ URL เข้ามาหน้านี้
    if (currentUser?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchLogs();
  }, [currentUser, navigate]);

  // ฟังก์ชันแปลงรูปแบบวันที่และเวลาให้อ่านง่าย (สไตล์ไทย)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen font-sans flex-1 ml-0 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* ปุ่มกลับและหัวข้อ */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 font-bold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} /> กลับ
          </button>
          
          <button 
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            รีเฟรชข้อมูล
          </button>
        </div>

        {/* Card ตารางข้อมูล */}
        <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-100">
          
          {/* Header ของ Card */}
          <div className="bg-[#3B7BBD] p-5 flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl">
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Activity Logs</h2>
              <p className="text-sm text-blue-100">ประวัติการใช้งานระบบ (ย้อนหลัง 7 วัน)</p>
            </div>
          </div>

          {/* พื้นที่ตาราง */}
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <RefreshCw size={40} className="animate-spin mb-4 text-[#48A0D8]" />
                <p className="font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500 font-bold">
                <p>{error}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-lg">ยังไม่มีประวัติการใช้งาน</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                    <th className="py-4 px-6 font-bold flex items-center gap-2"><Clock size={16}/> วันที่ / เวลา</th>
                    <th className="py-4 px-6 font-bold"><div className="flex items-center gap-2"><UserIcon size={16}/> ผู้ใช้งาน</div></th>
                    <th className="py-4 px-6 font-bold"><div className="flex items-center gap-2"><Activity size={16}/> การกระทำ</div></th>
                    <th className="py-4 px-6 font-bold"><div className="flex items-center gap-2"><MapPin size={16}/> อุปกรณ์ / สถานที่</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-100 text-[#3B7BBD] font-bold px-3 py-1 rounded-full text-xs">
                          {log.username}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        {log.action}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {log.node_name && log.node_name !== '-' ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#76E136]"></span>
                            {log.node_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}