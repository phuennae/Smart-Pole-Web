import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API_URL = 'http://171.99.250.125/api';

export interface UserItem {
  id: string;
  name: string;
  role: 'ADMIN' | 'USER';
  password?: string;
  session_token?: string; 
}

interface UserContextType {
  users: UserItem[];
  addUser: (user: UserItem) => Promise<void>;
  updateUser: (updatedUser: UserItem) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  currentUser: UserItem | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  
  // ✅ เปลี่ยนมาใช้ sessionStorage เพื่อให้ลืมการล็อกอินเมื่อปิดเบราว์เซอร์
  const [currentUser, setCurrentUser] = useState<UserItem | null>(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // ระบบคอยเช็คการล็อกอินซ้อน (ทุกๆ 10 วินาที)
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

        if (!data.valid) {
          alert('มีการเข้าสู่ระบบจากอุปกรณ์อื่น คุณได้ถูกออกจากระบบ');
          logout();
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
      const formattedUsers = data.map((u: any) => ({
        id: u.id.toString(),
        name: u.username || u.name || '',
        role: u.role || 'USER',
        password: u.password || ''
      }));
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

      if (data.status === 'success' || data.success) {
        const rawRole = data.user?.role || 'USER'; 
        const normalizedRole = rawRole.toUpperCase(); 

        const loggedInUser: UserItem = {
          id: data.user?.id?.toString() || '0',
          name: data.user?.username || username,
          role: (normalizedRole === 'ADMIN' ? 'ADMIN' : 'USER') as 'ADMIN' | 'USER',
          session_token: data.session_token 
        };

        setCurrentUser(loggedInUser);
        // ✅ เปลี่ยนมาบันทึกแค่ชั่วคราวใน sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    // ✅ สั่งลบข้อมูลออกจาก sessionStorage
    sessionStorage.removeItem('currentUser');
    
    // เผื่อมีของเก่าหลงเหลืออยู่ใน localStorage ให้เคลียร์ทิ้งไปด้วย
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