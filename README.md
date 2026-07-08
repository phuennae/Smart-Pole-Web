Smart Pole Web System
ระบบควบคุมเสาไฟอัจฉริยะ (Smart Pole) โดยแยกส่วนการทำงานระหว่าง Frontend และ Backend

🛠 Prerequisites (สิ่งที่ต้องมี)
Node.js (LTS version): สำหรับรันตัว Frontend (React)

XAMPP: สำหรับรันตัว Backend (PHP & MySQL)

🚀 Setup Instructions (ขั้นตอนการติดตั้ง)
1. ส่วน Backend (PHP & Database)
นำโฟลเดอร์ api (ที่มีไฟล์ PHP ทั้งหมด) ไปวางไว้ที่: C:\xampp\htdocs\api\

เปิด XAMPP Control Panel แล้วกด Start Apache และ MySQL

เข้าไปที่ http://localhost/phpmyadmin/ เพื่อสร้างฐานข้อมูล (Database) ตามชื่อที่คุณใช้ในโปรเจกต์

ตั้งค่าไฟล์ C:\xampp\htdocs\api\config.php:

ตรวจสอบ host, user, password และ dbname ให้ตรงกับฐานข้อมูลในเครื่องของคุณ

2. ส่วน Frontend (React)
เปิด Terminal ในโฟลเดอร์โปรเจกต์ React ของคุณ

ติดตั้ง Library ที่จำเป็น:

Bash
npm install
(สำคัญ) ตรวจสอบให้แน่ใจว่าในโค้ด React ทุกจุดที่มีการเรียก API (เช่น fetch) คุณได้ระบุ URL ให้ถูกต้อง เช่น:

JavaScript
// ตัวอย่างการเรียก API
fetch('http://localhost/api/get_cameras.php')
🏃‍♂️ How to Run (วิธีเริ่มรันระบบ)
เปิด Backend: เปิด XAMPP ให้ Apache และ MySQL ขึ้นสถานะ Running

เปิด Frontend: เปิด Terminal ในโฟลเดอร์ React แล้วพิมพ์:

Bash
npm run dev
ใช้งาน: คลิกที่ลิงก์ที่แสดงใน Terminal (เช่น http://localhost:5173) เพื่อเข้าใช้งานระบบ