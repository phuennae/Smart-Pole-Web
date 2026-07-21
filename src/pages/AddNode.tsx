import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';

export default function AddNode() {
  const { nodes, addNode, deleteNode, updateNode } = useNodes(); 
  const [form, setForm] = useState({ name: '', ip: '', port: '', lat: '', lng: '' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);

  // States สำหรับควบคุม Modal แจ้งเตือนและยืนยัน
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [saveTargetNode, setSaveTargetNode] = useState<NodeItem | null>(null);

  const handleAdd = () => {
    if (!form.name || !form.ip || !form.port) {
      setAlertModal({ isOpen: true, message: 'กรุณากรอกชื่อจุดติดตั้ง, IP Address และ Port ให้ครบถ้วนครับ' });
      return;
    }
    addNode({
      id: `node-${Date.now()}`,
      name: form.name,
      ip: form.ip,
      port: form.port,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0,
      status: 'online',
      data: { voltage: '-', current: '-', power: '-', energy: '-' },
      volume: 80
    });
    setForm({ name: '', ip: '', port: '', lat: '', lng: '' });
  };

  const openEdit = (node: NodeItem) => {
    setEditingNode(node);
    setIsEditOpen(true);
  };

  // เมื่อกดปุ่มบันทึกในหน้า Edit ให้เปิด Modal ยืนยันก่อน
  const handlePreSaveEdit = () => {
    if (!editingNode || !editingNode.name || !editingNode.ip || !editingNode.port) {
      setAlertModal({ isOpen: true, message: 'กรุณากรอกข้อมูลสำคัญ (ชื่อ, IP, Port) ให้ครบถ้วนครับ' });
      return;
    }
    setSaveTargetNode(editingNode);
  };

  const confirmSaveEdit = () => {
    if (saveTargetNode) {
      updateNode(saveTargetNode);
      setIsEditOpen(false);
      setEditingNode(null);
      setSaveTargetNode(null);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteNode(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <main className="p-4 md:p-8 bg-gray-100 min-h-full font-sans w-full relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Block 1: Add New Device */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg flex items-center gap-2">
            <Plus size={24} /> เพิ่มอุปกรณ์ใหม่
          </div>
          <div className="p-4 md:p-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
               <div>
                 <label className="block text-xs font-bold mb-2">ชื่อจุดติดตั้ง</label>
                 <input type="text" placeholder="เช่น Node A" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 ring-[#48A0D8]" />
               </div>
               <div>
                 <label className="block text-xs font-bold mb-2">IP Address / Domain</label>
                 <input type="text" placeholder="192.168.1.1" value={form.ip} onChange={e => setForm({...form, ip: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-bold mb-2">Port</label>
                 <input type="text" placeholder="8080" value={form.port} onChange={e => setForm({...form, port: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-bold mb-2">Latitude</label>
                 <input type="number" step="any" placeholder="18.795..." value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-bold mb-2">Longitude</label>
                 <input type="number" step="any" placeholder="98.952..." value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
               </div>
             </div>
             <div className="flex justify-center mt-6">
                <button onClick={handleAdd} className="bg-[#48A0D8] text-white px-12 py-2.5 rounded-lg font-bold hover:bg-blue-600 transition-all w-full sm:w-auto shadow-sm">
                  เพิ่มอุปกรณ์
                </button>
             </div>
          </div>
        </div>

        {/* Block 2: Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg">รายการอุปกรณ์ในระบบ</div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-sm font-bold">ชื่อจุดติดตั้ง</th>
                  <th className="p-4 text-sm font-bold">ที่อยู่ (IP:Port)</th>
                  <th className="p-4 text-sm font-bold">พิกัด (Lat, Lng)</th>
                  <th className="p-4 text-sm font-bold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(node => (
                  <tr key={node.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium">{node.name}</td>
                    <td className="p-4 text-sm font-medium">{node.ip}:{node.port}</td>
                    <td className="p-4 text-sm font-medium text-gray-500">{node.lat}, {node.lng}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(node)} className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteTargetId(node.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingNode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#48A0D8] p-5 text-white font-bold flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Pencil size={20} /> แก้ไขอุปกรณ์
              </div>
              <button onClick={() => setIsEditOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">ชื่อจุดติดตั้ง</label>
                <input value={editingNode.name} onChange={e => setEditingNode({...editingNode, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold mb-1 text-gray-700">IP Address / Domain</label>
                    <input value={editingNode.ip} onChange={e => setEditingNode({...editingNode, ip: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
                </div>
                <div>
                    <label className="block text-xs font-bold mb-1 text-gray-700">Port</label>
                    <input value={editingNode.port} onChange={e => setEditingNode({...editingNode, port: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold mb-1 text-gray-700">Latitude</label>
                    <input type="number" value={editingNode.lat} onChange={e => setEditingNode({...editingNode, lat: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
                </div>
                <div>
                    <label className="block text-xs font-bold mb-1 text-gray-700">Longitude</label>
                    <input type="number" value={editingNode.lng} onChange={e => setEditingNode({...editingNode, lng: parseFloat(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsEditOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handlePreSaveEdit} className="flex items-center gap-2 bg-[#48A0D8] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-sm">
                <Save size={16} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Alert Modal (กรณีลืมกรอกข้อมูล) */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">ข้อมูลไม่ครบถ้วน</h3>
              <p className="text-sm text-gray-500 font-medium px-2">{alertModal.message}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button onClick={() => setAlertModal({ isOpen: false, message: '' })} className="w-full bg-[#48A0D8] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm">
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal สำหรับยืนยันการลบ */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">ยืนยันการลบอุปกรณ์?</h3>
              <p className="text-sm text-gray-500 font-medium px-2">ข้อมูลอุปกรณ์นี้จะถูกลบออกจากระบบอย่างถาวร</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <div className="w-[1px] bg-gray-100"></div>
              <button onClick={confirmDelete} className="flex-1 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal สำหรับยืนยันการบันทึกแก้ไข */}
      {saveTargetNode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-blue-50 text-[#48A0D8] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">ยืนยันการบันทึกการแก้ไข?</h3>
              <p className="text-sm text-gray-500 font-medium px-2">คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลอุปกรณ์นี้ใช่หรือไม่</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setSaveTargetNode(null)} className="flex-1 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <div className="w-[1px] bg-gray-100"></div>
              <button onClick={confirmSaveEdit} className="flex-1 py-3.5 text-sm font-bold text-[#48A0D8] hover:bg-blue-50 transition-colors">
                ยืนยันบันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}