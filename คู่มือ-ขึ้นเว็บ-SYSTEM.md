# คู่มือขึ้นเว็บ + ซิงก์ข้อมูล — SYSTEM

> Web App ระบบ Personal Leveling ตลอด 37 วัน — ไฟล์ทั้งหมดอยู่ในโฟลเดอร์ `system/`

---

## 1) ขึ้นเว็บด้วย Netlify Drop (ฟรี ไม่ต้องเขียนโค้ด)

1. แตกไฟล์ `SYSTEM-webapp.zip` ที่เตรียมไว้ (หรือใช้โฟลเดอร์ `system/` ตรง ๆ)
2. เปิดเว็บ **https://app.netlify.com/drop**
3. **ลากโฟลเดอร์ที่มี `index.html` ลงไปในหน้านั้น**
4. รอ ~10 วินาที → ได้ลิงก์ประมาณ `https://xxxxxx.netlify.app`
   - ครั้งแรกจะถามให้สมัคร/ล็อกอิน (ฟรี) เพื่อเก็บเว็บถาวร
5. ลองเปิดลิงก์นั้นจากมือถือ → ใช้งานได้ทุกที่

> เว็บเป็น static ล้วน (HTML/CSS/JS) ไม่มี backend ของตัวเอง แก้ไฟล์แล้วลากขึ้นใหม่ก็อัปเดต

---

## 2) ตั้งระบบซิงก์อัตโนมัติ (Supabase ฟรี)

ข้อมูลของแอปนี้เก็บอยู่ใน LocalStorage ของแต่ละเครื่อง — ถ้าอยากให้
มือถือกับคอม**ซิงก์กันอัตโนมัติ** ให้ทำตามขั้นตอน (ครั้งเดียว ~2 นาที):

1. ไปที่ **https://supabase.com** → สมัครบัญชีฟรี → กด **New project**
   - Region เลือก **Southeast Asia (Singapore)** จะเร็วที่สุดสำหรับไทย
2. เข้าเมนู **SQL Editor** → วางโค้ดนี้ → กด **RUN**:

   ```sql
   create table if not exists public.system_sync (
     code text primary key,
     state jsonb not null,
     rev text not null default '',
     updated_at timestamptz default now()
   );
   alter table public.system_sync enable row level security;
   create policy "sync_rw" on public.system_sync
     for all using (true) with check (true);
   ```

3. เปิดแอป SYSTEM → เมนู **SETTINGS** → หัวข้อ **CLOUD SYNC**
   - **SUPABASE URL**: คัดลอกจากเมนู Project Settings → API (Project URL)
   - **ANON KEY**: คัดลอกจาก API → `anon` `public` key
   - กด **GENERATE** (สร้าง SYNC CODE) → กด **SAVE & CONNECT**
   - สถานะขึ้น **☁ SYNCED** = สำเร็จ
4. กด **COPY JOIN LINK** → ส่งเปิดในมือถือ (LINE/Email) ผ่านเบราว์เซอร์
   - มือถือจะโหลดข้อมูลจากเครื่องแรกให้เอง แล้วซิงก์อัตโนมัติทุกครั้งที่ทำ Quest

### หมายเหตุ

- **SYNC CODE** คือ "รหัสห้อง" — ใช้ร่วมกันทุกเครื่องที่ต้องการเห็นข้อมูลชุดเดียวกัน
  ใครมีโค้ดนี้ (พร้อม URL+key) เข้าถึงข้อมูลได้ → อย่าแชร์ให้คนแปลกหน้า
- ระบบใช้ **Last-Write-Wins**: ถ้าสองเครื่องแก้พร้อมกัน เครื่องที่แก้ทีหลังชนะ
- อยากสำรองข้อมูลด้วยมือ → SETTINGS → **EXPORT DATA** (ดาวน์โหลดไฟล์ JSON)
  และ **IMPORT DATA** เพื่อกู้คืน
- ยังไม่ตั้งซิงก์ก็ใช้งานได้ปกติ — ข้อมูลอยู่ในเครื่องนั้น ๆ แยกกัน

---

## 3) โครงสร้างไฟล์

```
system/
├── index.html          ← shell + icon sprite + boot screen
├── css/system.css      ← ธีม holographic ทั้งหมด
└── js/
    ├── config.js       ← content: quests/habits/schedule/achievements (แก้ตรงนี้)
    ├── sound.js        ← เสียงสังเคราะห์ WebAudio
    ├── store.js        ← state + logic + LocalStorage (+ SYS.Repository สำหรับต่อ backend)
    ├── sync.js         ← ซิงก์ Supabase (optional)
    ├── ui.js           ← toast/modal/levelup/animation
    ├── app.js          ← boot/router/effect pipeline
    └── pages/*.js      ← 6 หน้า (dashboard, quests, stats, achievements, journey, settings)
```

- ข้อมูล persist ด้วย LocalStorage key `system.app.v1`
- เพิ่ม Quest/Achievement/Schedule = แก้ `js/config.js` อย่างเดียว
