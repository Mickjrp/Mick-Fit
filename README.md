# Mick Fit (PWA) · v2.4

## แท็บ

| แท็บ | ปุ่มด้านบน | มาจาก |
|---|---|---|
| วันนี้ | ซ้อม · อาหาร | `train/#workout` · `meal/#today` |
| แผน | ตารางซ้อม · แผนอาหาร | `train/#week` · `meal/#plan` |
| เมนู | – | `meal/#menu` |
| คลัง | – | `meal/#stock` |
| ฉัน | น้ำหนัก · ตั้งค่าซ้อม · ตั้งค่าอาหาร · ข้อมูล | `train/#body` · `train/#settings` · `meal/#config` · หน้า Backup ของ shell |

## แผนที่โค้ด

```
index.html  shell.css  shell.js   Shell: แถบแท็บ, ปุ่มสลับด้านบน, หน้า ข้อมูล (Backup/Restore), ย้ายน้ำหนักตัวครั้งแรก
sw.js                             Offline cache ของทั้งแอป (ตัวเดียว)
manifest.webmanifest  icons/      ติดตั้งบน Home Screen
train/                            แอปซ้อมเดิม (โครงไฟล์เหมือนเดิม: js/data.js, js/storage.js, js/views/*.js ...)
meal/                             แอป meal prep เดิม (index.html ไฟล์เดียว + cookbook.json, img/, page/)
```

## ติดตั้งบน iPhone
เปิดลิงก์ใน **Safari** → Share → **Add to Home Screen** → Add แล้วเปิดจากไอคอน **Mick Fit**
