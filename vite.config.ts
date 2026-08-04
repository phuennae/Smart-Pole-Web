import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/newui/', // ระบุชื่อโฟลเดอร์ให้ตรงกันตรงนี้ครับ
  plugins: [
    react(),
    tailwindcss(),
  ],
})