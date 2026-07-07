import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { useNodes, type NodeItem } from '../context/NodeContext';

export default function AddNode() {
  const { nodes, addNode, deleteNode, updateNode } = useNodes(); 
  const [form, setForm] = useState({ name: '', ip: '', port: '', lat: '', lng: '' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);

  const handleAdd = () => {
    if (!form.name || !form.ip || !form.port) return;
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

  const handleSaveEdit = () => {
    if (editingNode) {
      updateNode(editingNode);
      setIsEditOpen(false);
      setEditingNode(null);
    }
  };

  return (
    <main className="p-4 md:p-8 bg-gray-100 min-h-full font-sans w-full">
      <div className="max-w-6xl mx-auto">
        
        {/* Block 1: Add New Device */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg flex items-center gap-2">
            <Plus size={24} /> เพิ่มอุปกรณ์ใหม่
          </div>
          <div className="p-4 md:p-6">
             {/* ปรับจาก grid-cols-5 ตายตัว เป็นเรียงแถวละ 1 ช่องบนมือถือ และ 5 ช่องบนจอใหญ่ */}
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
                <button onClick={handleAdd} className="bg-[#48A0D8] text-white px-12 py-2.5 rounded-lg font-bold hover:bg-blue-600 transition-all w-full sm:w-auto">
                  เพิ่มอุปกรณ์
                </button>
             </div>
          </div>
        </div>

        {/* Block 2: Table - เพิ่ม overflow-x-auto เพื่อป้องกันตารางเบียดจนแตก */}
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
                        <button onClick={() => openEdit(node)} className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"><Pencil size={16} /></button>
                        <button onClick={() => deleteNode(node.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal (Pop-up) รองรับขนาดหน้าจอมือถือ */}
      {isEditOpen && editingNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#48A0D8] p-4 text-white font-bold flex items-center gap-2">
              <Pencil size={20} /> แก้ไขอุปกรณ์
            </div>
            <div className="p-4 md:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold mb-1">ชื่อจุดติดตั้ง</label>
                <input value={editingNode.name} onChange={e => setEditingNode({...editingNode, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold mb-1">IP Address / Domain</label>
                    <input value={editingNode.ip} onChange={e => setEditingNode({...editingNode, ip: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold mb-1">Port</label>
                    <input value={editingNode.port} onChange={e => setEditingNode({...editingNode, port: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold mb-1">Latitude</label>
                    <input type="number" value={editingNode.lat} onChange={e => setEditingNode({...editingNode, lat: parseFloat(e.target.value) || 0})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold mb-1">Longitude</label>
                    <input type="number" value={editingNode.lng} onChange={e => setEditingNode({...editingNode, lng: parseFloat(e.target.value) || 0})} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsEditOpen(false)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">
                <X size={16} /> ยกเลิก
              </button>
              <button onClick={handleSaveEdit} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                <Save size={16} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}