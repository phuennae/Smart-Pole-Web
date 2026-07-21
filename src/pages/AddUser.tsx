import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUsers, type UserItem } from '../context/UserContext';

export default function AddUser() {
  const { users, addUser, deleteUser, updateUser } = useUsers();
  
  const [form, setForm] = useState({ name: '', password: '', role: 'USER' as 'ADMIN' | 'MANAGER' | 'USER' });
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // States สำหรับควบคุม Modal แจ้งเตือนและยืนยัน
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [saveTargetUser, setSaveTargetUser] = useState<UserItem | null>(null);

  const handleAdd = () => {
    if (!form.name || !form.password) {
      setAlertModal({ isOpen: true, message: 'กรุณากรอกชื่อสมาชิกและรหัสผ่านให้ครบถ้วนครับ' });
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
    setEditingUser({ ...user, password: '' }); 
    setIsEditOpen(true);
  };

  const handlePreSaveEdit = () => {
    if (!editingUser || !editingUser.name) {
      setAlertModal({ isOpen: true, message: 'ชื่อสมาชิกต้องไม่เป็นค่าว่างครับ' });
      return;
    }
    setSaveTargetUser(editingUser);
  };

  const confirmSaveEdit = () => {
    if (saveTargetUser) {
      updateUser(saveTargetUser); 
      setIsEditOpen(false);
      setEditingUser(null);
      setSaveTargetUser(null);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteUser(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <main className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Block 1: Add New User */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg flex items-center gap-2">
            <Plus size={24} /> เพิ่มสมาชิกใหม่
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 ml-1">ชื่อสมาชิก</label>
                <input type="text" placeholder="เช่น นายเอ" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 ring-[#48A0D8]" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 ml-1">รหัสผ่าน</label>
                <input type="text" placeholder="เช่น 123456" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 ring-[#48A0D8]" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-gray-700 ml-1">สิทธิ์การเข้าถึง</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as 'ADMIN' | 'MANAGER' | 'USER'})} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 ring-[#48A0D8]">
                  <option value="USER">USER (ผู้ใช้งาน)</option>
                  <option value="MANAGER">MANAGER (ผู้จัดการ)</option>
                  <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                </select>
              </div>
              <div>
                <button onClick={handleAdd} className="bg-[#519455] text-white w-full py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm">
                  เพิ่มสมาชิก
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: User List Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-[#48A0D8] p-4 text-white font-bold text-lg">รายชื่อสมาชิกในระบบ</div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[500px]">
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
                        <button onClick={() => setDeleteTargetId(user.id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-sm text-xs font-bold transition-colors">
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
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#48A0D8] p-5 text-white font-bold flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Pencil size={20} /> แก้ไขสมาชิก
              </div>
              <button onClick={() => setIsEditOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">ชื่อสมาชิก</label>
                <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)</label>
                <input type="text" placeholder="กรอกรหัสผ่านใหม่ (ถ้ามี)" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">สิทธิ์การเข้าถึง</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as 'ADMIN' | 'MANAGER' | 'USER'})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 ring-[#48A0D8]/50">
                  <option value="USER">USER (ผู้ใช้งาน)</option>
                  <option value="MANAGER">MANAGER (ผู้จัดการ)</option>
                  <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                </select>
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
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">ยืนยันการลบสมาชิก?</h3>
              <p className="text-sm text-gray-500 font-medium px-2">ข้อมูลบัญชีผู้ใช้นี้จะถูกลบออกจากระบบ</p>
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
      {saveTargetUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-blue-50 text-[#48A0D8] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">ยืนยันการบันทึกการแก้ไข?</h3>
              <p className="text-sm text-gray-500 font-medium px-2">คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลสมาชิกนี้ใช่หรือไม่</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setSaveTargetUser(null)} className="flex-1 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
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