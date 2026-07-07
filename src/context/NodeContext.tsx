import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface NodeItem {
  id: string;
  name: string;
  ip: string;
  port: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline';
  data?: {
    voltage: string;
    current: string;
    power: string;
    energy: string;
  };
  volume?: number;
}

export interface NodeContextType {
  nodes: NodeItem[];
  addNode: (node: NodeItem) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  updateNode: (updatedNode: NodeItem) => Promise<void>;
  refreshNodes: () => Promise<void>;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export const NodeProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const API_URL = 'http://localhost/api';

  // ดึงข้อมูล Node จาก Database ทันทีที่เปิดเว็บ
  useEffect(() => {
    refreshNodes();
  }, []);

  const refreshNodes = async () => {
    try {
      const res = await fetch(`${API_URL}/get_nodes.php`);
      if (!res.ok) return;
      const data = await res.json();
      
      const formattedNodes = data.map((n: any) => ({
        id: n.id?.toString(),
        name: n.name || n.node_name || '',
        ip: n.ip || n.ip_address || '',
        port: n.port?.toString() || '80',
        lat: parseFloat(n.lat || n.latitude || 0),
        lng: parseFloat(n.lng || n.longitude || 0),
        status: n.status || 'online',
        data: { voltage: '-', current: '-', power: '-', energy: '-' },
        volume: 80
      }));
      setNodes(formattedNodes);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    }
  };

  const addNode = async (node: NodeItem) => {
    try {
      const formData = new FormData();
      formData.append('name', node.name);
      formData.append('ip', node.ip); // ต้องตรงกับ $_POST['ip'] ใน PHP
      formData.append('port', node.port);
      formData.append('lat', node.lat.toString()); // ต้องตรงกับ $_POST['lat'] ใน PHP
      formData.append('lng', node.lng.toString()); // ต้องตรงกับ $_POST['lng'] ใน PHP

      const response = await fetch(`${API_URL}/add_node.php`, { method: 'POST', body: formData });
      const result = await response.json(); // อ่านผลลัพธ์
      console.log('Result from API:', result); // เปิด Console (F12) ดูว่า API ตอบว่าอะไร
      
      await refreshNodes(); 
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const updateNode = async (node: NodeItem) => {
    try {
      const formData = new FormData();
      formData.append('id', node.id);
      formData.append('name', node.name);
      formData.append('ip', node.ip);
      formData.append('port', node.port);
      formData.append('lat', node.lat.toString());
      formData.append('lng', node.lng.toString());

      // ไฟล์ API ฝั่ง PHP อาจจะชื่อ edit_node.php หรือ update_node.php
      await fetch(`${API_URL}/edit_node.php`, { method: 'POST', body: formData });
      await refreshNodes();
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const deleteNode = async (id: string) => {
    try {
      const formData = new FormData();
      formData.append('id', id); // ส่งค่า id ไปให้ PHP

      await fetch(`${API_URL}/delete_node.php`, { method: 'POST', body: formData });
      await refreshNodes(); // ดึงข้อมูลใหม่หลังจากลบเสร็จ
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  return (
    <NodeContext.Provider value={{ nodes, addNode, deleteNode, updateNode, refreshNodes }}>
      {children}
    </NodeContext.Provider>
  );
};

export const useNodes = () => {
  const context = useContext(NodeContext);
  if (!context) throw new Error('useNodes must be used within NodeProvider');
  return context;
};