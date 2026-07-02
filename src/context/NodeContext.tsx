import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react'; // แยก import type ออกมาเพื่อแก้ Error

export interface NodeItem {
  id: string;
  name: string;
  ip: string;
  port: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline';
  data?: { voltage: number | string; current: number | string; power: number | string; energy: number | string };
  volume?: number;
}

interface NodeContextType {
  nodes: NodeItem[];
  addNode: (node: NodeItem) => void;
  deleteNode: (id: string) => void;
  updateNode: (updatedNode: NodeItem) => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export const NodeProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: 'node-1', name: 'Node 1', ip: '192.168.1.1', port: '80', lat: 18.7951, lng: 98.9525, status: 'online', data: { voltage: 12.1, current: 0.41, power: 4.9, energy: 12.1 }, volume: 82 },
    { id: 'node-2', name: 'Node 2', ip: '192.168.1.2', port: '81', lat: 18.7958, lng: 98.9520, status: 'offline', data: { voltage: '-', current: '-', power: '-', energy: '-' }, volume: 62 },
    { id: 'node-3', name: 'Node 3', ip: '192.168.1.3', port: '82', lat: 18.7945, lng: 98.9515, status: 'online', data: { voltage: 12.1, current: 0.41, power: 4.9, energy: 12.1 }, volume: 80 },
    { id: 'node-4', name: 'Node 4', ip: '192.168.1.4', port: '83', lat: 18.7960, lng: 98.9510, status: 'online', data: { voltage: 12.1, current: 0.41, power: 4.9, energy: 12.1 }, volume: 82 }
  ]);

  const addNode = (node: NodeItem) => setNodes([...nodes, node]);
  const deleteNode = (id: string) => setNodes(nodes.filter(n => n.id !== id));
  const updateNode = (updatedNode: NodeItem) => {
    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  }

  return (
    <NodeContext.Provider value={{ nodes, addNode, deleteNode, updateNode }}>
      {children}
    </NodeContext.Provider>
    
  );
};

export const useNodes = () => {
  const context = useContext(NodeContext);
  if (!context) throw new Error('useNodes must be used within NodeProvider');
  return context;
};

