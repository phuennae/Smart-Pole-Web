// ไฟล์: src/utils/logger.ts (หรือปรับ path ตามที่คุณเก็บไฟล์)
import { API_URL } from './config';

export const logAction = async (username: string, action: string, nodeName: string = '-') => {
  try {
    await fetch(`${API_URL}/add_log.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: username, 
        action: action, 
        node_name: nodeName 
      })
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};