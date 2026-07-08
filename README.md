# Smart Pole Web System

ระบบควบคุมเสาไฟอัจฉริยะ (Smart Pole) ที่รวมระบบแผนที่, ระบบเสียง, การประกาศเสียงสด และกล้องวงจรปิด (CCTV) ไว้ในที่เดียว

---

## 🛠 Prerequisites (สิ่งที่ต้องติดตั้ง)

1. **[Node.js](https://nodejs.org/)** (แนะนำเวอร์ชัน LTS): สำหรับรันตัว Frontend (React)
2. **[XAMPP](https://www.apachefriends.org/index.html)**: สำหรับรันตัว Backend (PHP & MySQL)
3. **Git**: สำหรับจัดการซอร์สโค้ด

---

## 🚀 Setup Instructions (ขั้นตอนการติดตั้ง)

### 1. ส่วน Backend (PHP & Database)
1. นำโฟลเดอร์ `api` ของโปรเจกต์ ไปวางไว้ที่: `C:\xampp\htdocs\api\`
2. เปิด **XAMPP Control Panel** แล้วกด **Start** ที่ **Apache** และ **MySQL**
3. เข้าไปที่ [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/) เพื่อสร้างฐานข้อมูล (Database) ตามชื่อที่โปรเจกต์กำหนด
4. ตั้งค่าไฟล์เชื่อมต่อฐานข้อมูล:
   - เปิดไฟล์ `C:\xampp\htdocs\api\config.php`
   - ตรวจสอบค่า `host`, `user`, `password` และ `dbname` ให้ตรงกับฐานข้อมูลในเครื่องของคุณ

### 2. ส่วน Frontend (React)
1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ React (เช่น `C:\Users\...\Smart Pole Web\`)
2. ติดตั้ง Library ที่จำเป็น:
   ```bash
   npm install

ตรวจสอบการเรียก API: ตรวจสอบให้แน่ใจว่าในโค้ด React ทุกจุดที่มีการเรียก API (เช่น fetch) คุณได้ระบุ URL ให้ถูกต้อง เช่น:

JavaScript // ตัวอย่างการเรียก API

fetch('http://localhost/api/get_cameras.php')

## 🏃‍♂️ How to Run (วิธีเริ่มรันระบบ)
### Backend:
  1. เปิด XAMPP Control Panel
  2. ตรวจสอบให้มั่นใจว่า Apache และ MySQL มีสถานะเป็น Running (ไฟสีเขียว)

### Frontend:

1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ React
2. พิมพ์คำสั่ง:
```bash
npm run dev
```

## Project Structure (โครงสร้างโปรเจกต์)
*C:\Users...\Smart Pole Web* : เก็บโค้ดส่วน Frontend (React/Vite)

*C:\xampp\htdocs\api* : เก็บโค้ดส่วน Backend (PHP/API)