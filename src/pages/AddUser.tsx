import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { useUsers, type UserItem } from '../context/UserContext';

export default function AddUser() {
  const { users, addUser, deleteUser, updateUser } = useUsers();
  
  // State สำหรับเพิ่ม
  const [form, setForm] = useState({ name: '', password: '', role: 'USER' as 'ADMIN' | 'USER' });
  
  // State สำหรับ Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const handleAdd = () => {
    if (!form.name || !form.password) {
      alert("กรุณากรอกชื่อและรหัสผ่านให้ครบถ้วนครับ");
      return;
    }
    addUser({
      id: `user-${Date.now()}`,
      name: form.name,
      password: form.password,
      role: form.role
    });
    setForm({ name: '', password: '', role: 'USER' });
  };

  const openEdit = (user: UserItem) => {
    // 🔥 จุดสำคัญ: เวลาเปิดหน้าแก้ไข ต้องล้างช่อง password ให้ว่างเสมอ
    // เพื่อให้ส่งไปแค่รหัสผ่านใหม่ (ถ้ามี) หากว่างไว้ Backend จะได้รู้ว่าไม่ต้องเปลี่ยนรหัสผ่าน
    setEditingUser({ ...user, password: '' }); 
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      if (!editingUser.name) {
        alert("ชื่อสมาชิกต้องไม่เป็นค่าว่างครับ");
        return;
      }
      updateUser(editingUser); // ส่งข้อมูลไปให้ UserContext จัดการต่อ
      setIsEditOpen(false);
      setEditingUser(null);
    }
  };

  return (
    <main className="p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Block 1: Add New User */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg flex items-center gap-2">
            <Plus size={24} /> เพิ่มสมาชิกใหม่
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-100 p-6 rounded-2xl">
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 ml-1">ชื่อสมาชิก</label>
                <input type="text" placeholder="เช่น นายเอ" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 rounded-xl border-0 shadow-sm outline-none focus:ring-2 ring-[#48A0D8]" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 ml-1">รหัสผ่าน</label>
                <input type="text" placeholder="เช่น 123456" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-2.5 rounded-xl border-0 shadow-sm outline-none focus:ring-2 ring-[#48A0D8]" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 ml-1">สิทธิ์การเข้าถึง</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as 'ADMIN' | 'USER'})} className="w-full p-2.5 rounded-xl border-0 shadow-sm outline-none focus:ring-2 ring-[#48A0D8]">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <button onClick={handleAdd} className="bg-[#519455] text-white w-full py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md">
                  เพิ่มสมาชิก
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: User List Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg">รายชื่อสมาชิกในระบบ</div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-sm font-bold text-gray-700 w-1/3">ชื่อสมาชิก</th>
                <th className="p-4 text-sm font-bold text-gray-700 w-1/3">สิทธิ์การเข้าถึง</th>
                <th className="p-4 text-sm font-bold text-center text-gray-700 w-1/3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">{user.role}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(user)} className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 shadow-sm text-xs font-bold transition-colors">
                        <Pencil size={14} /> แก้ไข
                      </button>
                      <button onClick={() => deleteUser(user.id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-sm text-xs font-bold transition-colors">
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-gray-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-300">
            <div className="bg-[#48A0D8] p-4 text-white font-bold flex items-center gap-2">
              <Pencil size={20} /> แก้ไขสมาชิก
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">ชื่อสมาชิก</label>
                <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-2.5 rounded-xl border-0 shadow-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)</label>
                <input type="text" placeholder="กรอกรหัสผ่านใหม่ (ถ้ามี)" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full p-2.5 rounded-xl border-0 shadow-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">สิทธิ์การเข้าถึง</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as 'ADMIN' | 'USER'})} className="w-full p-2.5 rounded-xl border-0 shadow-sm outline-none">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="p-4 flex justify-center gap-3">
              <button onClick={() => setIsEditOpen(false)} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 shadow-sm">
                <X size={16} /> ยกเลิก
              </button>
              <button onClick={handleSaveEdit} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm">
                <Save size={16} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}