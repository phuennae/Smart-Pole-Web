import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_URL } from '../config';

export interface UserItem {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  password?: string;
  session_token?: string; 
}

interface UserContextType {
  users: UserItem[];
  addUser: (user: UserItem) => Promise<void>;
  updateUser: (updatedUser: UserItem) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  currentUser: UserItem | null;
  login: (username: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  
  // ✅ กลับมาใช้ localStorage เพื่อให้เปิดแท็บใหม่ได้โดยไม่ต้องล็อกอินซ้ำ
  const [currentUser, setCurrentUser] = useState<UserItem | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // ระบบหัวใจเต้น เช็คทุก 10 วินาที
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const verifySession = async () => {
      if (!currentUser || !currentUser.session_token) return;

      try {
        const formData = new FormData();
        formData.append('id', currentUser.id);
        formData.append('token', currentUser.session_token);

        const res = await fetch(`${API_URL}/check_session.php`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        // ถ้า Session โดนลบ หรือขาดการติดต่อนานเกินไป ให้เด้งออก
        if (!data.valid) {
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          window.location.href = '/login'; 
        }
      } catch (error) {
        console.error('Session verification error:', error);
      }
    };

    if (currentUser) {
      intervalId = setInterval(verifySession, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/get_users.php`);
      const data = await res.json();
      
      const formattedUsers = data.map((u: any) => {
        const rawRole = u.role ? u.role.toUpperCase() : 'USER';
        const finalRole = ['ADMIN', 'MANAGER'].includes(rawRole) ? rawRole : 'USER';

        return {
          id: u.id.toString(),
          name: u.username || u.name || '',
          role: finalRole as 'ADMIN' | 'MANAGER' | 'USER',
          password: u.password || ''
        };
      });
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const login = async (username: string, pass: string) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', pass);

      const res = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.status === 'success') {
        const rawRole = data.user?.role || 'USER'; 
        const normalizedRole = rawRole.toUpperCase(); 

        const loggedInUser: UserItem = {
          id: data.user?.id?.toString() || '0',
          name: data.user?.username || username,
          role: (['ADMIN', 'MANAGER'].includes(normalizedRole) ? normalizedRole : 'USER') as 'ADMIN' | 'MANAGER' | 'USER',
          session_token: data.session_token 
        };

        setCurrentUser(loggedInUser);
        // ✅ บันทึกลง localStorage
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      try {
        const formData = new FormData();
        formData.append('id', currentUser.id);
        await fetch(`${API_URL}/logout.php`, { method: 'POST', body: formData });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setCurrentUser(null);
    // ✅ ลบออกจาก localStorage
    localStorage.removeItem('currentUser');
  };

  const addUser = async (user: UserItem) => {
    try {
      const formData = new FormData();
      formData.append('username', user.name);
      formData.append('password', user.password || '');
      formData.append('role', user.role);

      await fetch(`${API_URL}/add_user.php`, { method: 'POST', body: formData });
      await fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const updateUser = async (updatedUser: UserItem) => {
    try {
      const formData = new FormData();
      formData.append('id', updatedUser.id);
      formData.append('username', updatedUser.name);
      if (updatedUser.password) formData.append('password', updatedUser.password);
      formData.append('role', updatedUser.role);

      await fetch(`${API_URL}/edit_user.php`, { method: 'POST', body: formData });
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const formData = new FormData();
      formData.append('id', id);

      await fetch(`${API_URL}/delete_user.php`, { method: 'POST', body: formData });
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

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