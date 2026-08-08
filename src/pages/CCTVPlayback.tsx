import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Play, Pause, Square, Clock, Settings2, AlertCircle, Maximize, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';

interface Recording {
  id: string;
  start: string;
  end: string;
}

export default function CCTVPlayback() {
  const navigate = useNavigate();
  const { nodeId } = useParams();
  
  const idMapping: { [key: string]: string } = {
    "8": "7", 
  };
  const mappedNodeId = idMapping[String(nodeId)] || String(nodeId);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordedDatesInMonth, setRecordedDatesInMonth] = useState<string[]>([todayStr]);
  const [selectedSegment, setSelectedSegment] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [playbackProgress, setPlaybackProgress] = useState(0); 
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
  
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<any>(null);

  useEffect(() => {
    let script = document.querySelector('script[src*="jsmpeg"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = "/jsmpeg.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const showNotification = (message: string) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'search');
      formData.append('camera_id', mappedNodeId);
      formData.append('date', date);

      const res = await fetch(`${API_URL}/playback_proxy.php`, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      
      if (result.success) {
        setRecordings(result.recordings);
        setSelectedSegment(null);
        stopPlayback();
        
        if (result.recordings.length > 0 && !recordedDatesInMonth.includes(date)) {
          setRecordedDatesInMonth(prev => [...prev, date]);
        }
      } else {
        setRecordings([]);
        showNotification('ไม่พบข้อมูลบันทึกวิดีโอในวันที่เลือก');
      }
    } catch (error) {
      console.error("Search Error:", error);
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const startStreamAtSegment = (segment: Recording, offsetSeconds: number = 0) => {
    if (!canvasRef.current) return;
    
    if (!(window as any).JSMpeg || !(window as any).JSMpeg.Player) {
      showNotification('กำลังโหลด Player กรุณาลองใหม่อีกครั้ง...');
      return;
    }
    
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    let startTimeObj = new Date(segment.start);
    let endTimeObj = new Date(segment.end);
    const totalSec = Math.max(1, (endTimeObj.getTime() - startTimeObj.getTime()) / 1000);
    setTotalDurationSeconds(totalSec);
    setElapsedSeconds(offsetSeconds);

    if (offsetSeconds > 0) {
      startTimeObj = new Date(startTimeObj.getTime() + offsetSeconds * 1000);
    }
    const adjustedStart = startTimeObj.toISOString();

    const host = window.location.hostname;
    const wsUrl = `ws://${host}:8090/?camera_id=${mappedNodeId}&start=${encodeURIComponent(adjustedStart)}&end=${encodeURIComponent(segment.end)}`;
    
    try {
      playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: !isMuted
      });
      setIsPlaying(true);
      setIsPaused(false);
      startProgressTracker(totalSec, offsetSeconds);
    } catch (e) {
      console.error("JSMpeg Error:", e);
      showNotification('ไม่สามารถเชื่อมต่อสตรีมวิดีโอได้');
    }
  };

  const playPlayback = () => {
    if (!selectedSegment) return;
    startStreamAtSegment(selectedSegment, 0);
  };

  // ปุ่มสลับ Play / Pause
  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPaused) {
      playerRef.current.play();
      setIsPaused(false);
    } else {
      playerRef.current.pause();
      setIsPaused(true);
    }
  };

  const startProgressTracker = (totalSec: number, initialOffset: number = 0) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    
    let elapsed = initialOffset;
    progressTimerRef.current = setInterval(() => {
      if (!isPaused) {
        elapsed += 1;
        setElapsedSeconds(elapsed);
        const progress = Math.min((elapsed / totalSec) * 100, 100);
        setPlaybackProgress(progress);
        if (elapsed >= totalSec) {
          clearInterval(progressTimerRef.current);
        }
      }
    }, 1000);
  };

  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setIsPlaying(false);
    setIsPaused(false);
    setPlaybackProgress(0);
    setElapsedSeconds(0);
  };

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    if (playerRef.current && playerRef.current.audioOut && playerRef.current.audioOut.destinationNode) {
      playerRef.current.audioOut.destinationNode.gain.value = nextMuteState ? 0 : 1;
    }
  };

  const formatTimeCounter = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, rec: Recording) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));

    const startTime = new Date(rec.start).getTime();
    const endTime = new Date(rec.end).getTime();
    const totalDurationSec = (endTime - startTime) / 1000;
    
    const offsetSec = totalDurationSec * percentage;

    setSelectedSegment(rec);
    setPlaybackProgress(percentage * 100);
    startStreamAtSegment(rec, offsetSec);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(Number(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getTimelineStyle = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    
    const leftPercent = (startMin / (24 * 60)) * 100;
    const widthPercent = ((endMin - startMin) / (24 * 60)) * 100;
    
    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 0.5)}%` };
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  };

  const renderCalendarGrid = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    for (let d = 1; d <= daysCount; d++) {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(d).padStart(2, '0');
      const dateString = `${year}-${formattedMonth}-${formattedDay}`;
      
      const isSelected = date === dateString;
      const hasRecording = recordedDatesInMonth.includes(dateString);

      days.push(
        <button
          key={dateString}
          onClick={() => setDate(dateString)}
          className={`h-8 w-8 rounded-full flex flex-col items-center justify-center text-xs font-bold relative transition-all ${
            isSelected 
              ? 'bg-[#48A0D8] text-white shadow-md' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span>{d}</span>
          {hasRecording && (
            <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#48A0D8]'}`}></span>
          )}
        </button>
      );
    }

    return (
      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-gray-700">{monthNames[month]} {year + 543}</span>
          <div className="flex gap-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600"><ChevronLeft size={16} /></button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-lg text-gray-600"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
          {dayNames.map(dn => <span key={dn}>{dn}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {days}
        </div>
      </div>
    );
  };

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen font-sans relative">
      <div 
        className={`fixed top-20 md:top-8 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ease-in-out ${
          showPopup ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-orange-100 px-5 md:px-6 py-3 rounded-2xl md:rounded-full flex items-center gap-3 w-max max-w-[90vw]">
          <AlertCircle className="text-orange-500 shrink-0" size={20} />
          <span className="font-bold text-gray-700 text-sm leading-tight text-center md:text-left">{popupMessage}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(`/cctv-monitor/${nodeId}`)} 
          className="flex items-center gap-2 font-bold text-gray-600 mb-4 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> กลับไปหน้า Monitor
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={20} /> ค้นหาไฟล์</h3>
              
              {renderCalendarGrid()}

              <button onClick={handleSearch} disabled={isLoading} className="w-full bg-[#48A0D8] text-white p-3 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95 touch-manipulation">
                {isLoading ? 'กำลังค้นหา...' : 'ค้นหาบันทึก'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Playback Viewer</h3>
              </div>
              
              {/* Video Container พร้อมแถบควบคุมสไตล์มาตรฐานด้านล่าง */}
              <div ref={videoContainerRef} className="bg-black w-full aspect-video rounded-2xl flex items-center justify-center text-white mb-6 overflow-hidden relative group">
                <canvas ref={canvasRef} className="w-full h-full block bg-black"></canvas>

                {/* แถบควบคุมบนวิดีโอ (สไตล์มาตรฐาน) จะแสดงขึ้นมาเมื่อเอาเมาส์ชี้ */}
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* หลอดความคืบหน้า (Scrubber Bar) */}
                    <div 
                      className="w-full bg-white/30 h-1.5 rounded-full cursor-pointer relative overflow-hidden"
                      onClick={(e) => {
                        if (!selectedSegment) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                        const offsetSec = totalDurationSeconds * percentage;
                        startStreamAtSegment(selectedSegment, offsetSec);
                      }}
                    >
                      <div className="absolute top-0 left-0 h-full bg-red-500" style={{ width: `${playbackProgress}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-3">
                        <button onClick={togglePlayPause} className="hover:text-red-400 transition-colors">
                          {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                        </button>
                        <button onClick={toggleMute} className="hover:text-red-400 transition-colors">
                          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <span className="font-mono text-white/90">
                          {formatTimeCounter(elapsedSeconds)} / {formatTimeCounter(totalDurationSeconds)}
                        </span>
                      </div>

                      <button onClick={toggleFullscreen} className="hover:text-red-400 transition-colors flex items-center gap-1">
                        <Maximize size={16} /> เต็มจอ
                      </button>
                    </div>
                  </div>
                )}

                {!isPlaying && (
                   <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-sm md:text-base text-center px-4 pointer-events-none">
                     {selectedSegment ? 'กดปุ่ม Play เพื่อเริ่มเล่น' : 'กรุณาค้นหาและเลือกช่วงเวลา'}
                   </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 mb-2 flex justify-between">
                  <span>Timeline (24 ชั่วโมง) - คลิกแถบสีฟ้าเพื่อเลือกช่วงเวลา</span>
                  {isPlaying && <span className="text-blue-600 font-mono">{playbackProgress.toFixed(0)}%</span>}
                </div>
                
                <div className="h-16 bg-gray-200 rounded-lg relative overflow-hidden cursor-pointer shadow-inner">
                  {recordings.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`absolute h-full bg-blue-500/60 border-r border-white/50 transition-all hover:opacity-100 cursor-pointer ${selectedSegment?.id === rec.id ? 'bg-blue-600 shadow-[0_0_0_2px_white_inset]' : ''}`}
                      style={getTimelineStyle(rec.start, rec.end)}
                      onClick={(e) => handleTimelineClick(e, rec)}
                      title={`คลิกเพื่อเล่นช่วง: ${rec.start} - ${rec.end}`}
                    >
                      {selectedSegment?.id === rec.id && isPlaying && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-400/40 pointer-events-none border-r-2 border-white"
                          style={{ width: `${playbackProgress}%` }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 mt-6 flex-wrap">
                <button 
                  onClick={playPlayback} 
                  disabled={!selectedSegment || isPlaying} 
                  className="flex-1 md:flex-none justify-center bg-green-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all shadow-md active:scale-95 touch-manipulation flex items-center gap-2 px-6 font-bold"
                >
                  <Play size={20} fill="currentColor" /> Play
                </button>
                
                <button 
                  onClick={stopPlayback} 
                  disabled={!isPlaying} 
                  className="flex-1 md:flex-none justify-center bg-red-600 text-white p-3 rounded-xl disabled:bg-gray-300 transition-all shadow-md active:scale-95 touch-manipulation flex items-center gap-2 px-6 font-bold"
                >
                  <Square size={20} fill="currentColor" /> Stop
                </button>

                {/* ปุ่มเปิด/ปิดเสียง (Mute/Unmute) ที่แถบควบคุมด้านล่าง */}
                <button 
                  onClick={toggleMute}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl border border-gray-200 transition-all font-bold active:scale-95"
                  title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
                >
                  {isMuted ? <VolumeX size={20} className="text-red-500 shrink-0" /> : <Volume2 size={20} className="text-green-600 shrink-0" />}
                  <span className="text-sm">{isMuted ? 'ปิดเสียง' : 'เปิดเสียง'}</span>
                </button>

                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 flex-1 md:flex-none justify-center">
                  <Settings2 size={18} className="text-gray-500 shrink-0" />
                  <select 
                    value={speed}
                    onChange={handleSpeedChange}
                    className="bg-transparent text-gray-700 font-bold border-0 outline-none cursor-pointer w-full"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1.0x (Normal)</option>
                    <option value="2">2.0x</option>
                    <option value="4">4.0x</option>
                  </select>
                </div>

                <div className="w-full md:w-auto md:ml-auto font-mono font-bold text-gray-700 flex items-center justify-center md:justify-end gap-2 bg-gray-100 px-4 py-2.5 md:py-2 rounded-xl">
                  <Clock size={18} className="text-[#48A0D8] shrink-0" /> 
                  <span className="text-sm">
                    {selectedSegment ? selectedSegment.start.split('T')[1].substring(0, 5) + ' - ' + selectedSegment.end.split('T')[1].substring(0, 5) : '--:--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}