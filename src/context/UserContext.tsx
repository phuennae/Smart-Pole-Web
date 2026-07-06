import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface UserItem {
  id: string;
  name: string;
  role: 'ADMIN' | 'USER';
  password?: string;
}

interface UserContextType {
  users: UserItem[];
  addUser: (user: UserItem) => void;
  updateUser: (updatedUser: UserItem) => void;
  deleteUser: (id: string) => void;
  currentUser: UserItem | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // ข้อมูลจำลองตั้งต้น
  const [users, setUsers] = useState<UserItem[]>([
    { id: 'u1', name: 'Admin', role: 'ADMIN', password: 'password123' },
    { id: 'u2', name: 'นายบี', role: 'USER', password: '123456' },
  ]);

  // สถานะล็อกอินตั้งต้นเป็น null (ยังไม่เข้าระบบ)
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);

  // ฟังก์ชัน Login (เช็คแบบ Hardcode ตามที่คุณระบุมา)
  const login = (username: string, pass: string) => {
    if (username === 'Admin' && pass === '123456') {
      setCurrentUser({ id: 'admin-hardcode', name: 'Admin', role: 'ADMIN', password: pass });
      return true;
    }
    if (username === 'User' && pass === '123456') {
      setCurrentUser({ id: 'user-hardcode', name: 'User', role: 'USER', password: pass });
      return true;
    }
    return false;
  };

  // ฟังก์ชันออกจากระบบ
  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (user: UserItem) => setUsers([...users, user]);
  const updateUser = (updatedUser: UserItem) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  const deleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, currentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUsers must be used within UserProvider');
  return context;
};