# TOPILDI Full Stack

React + Express + PostgreSQL full-stack loyiha. Mavjud arxitektura saqlangan: Express route modullari, PostgreSQL SQL schema va React Router.

## Auth oqimi

`POST /api/auth/register`
→ user PostgreSQL'ga yoziladi
→ 6 xonali OTP generatsiya qilinadi
→ OTP faqat SHA-256 hash ko‘rinishida `otp_codes.code_hash` ga yoziladi
→ Gmail SMTP orqali yuboriladi
→ OTP 10 daqiqa amal qiladi

`POST /api/auth/verify`
→ email + OTP tekshiriladi
→ 5 ta xato urinishdan keyin yangi OTP kerak
→ `users.is_verified=true`
→ JWT token qaytariladi

`POST /api/auth/login`
→ faqat tasdiqlangan account kirishi mumkin.

## ROOT CAUSE: "Route topilmadi"

Backend auth route quyidagicha mount qilingan:

`app.use('/api/auth', auth)`

Shuning uchun register URL:

`POST http://localhost:5000/api/auth/register`

Frontenddagi `api('/auth/register')` esa `VITE_API_URL=http://localhost:5000/api` bilan aynan shu URL'ni hosil qiladi.

Agar `POST /auth/register` yuborilsa, backendda bunday route yo‘q va `Route topilmadi` qaytadi. Yangi kodda frontend API base URL `/api` bilan avtomatik normallashtiriladi.

## 1. Backend

```bat
cd backend
copy .env.example .env
npm install
```

`.env` ichida PostgreSQL va Gmail ma'lumotlarini kiriting.

### PostgreSQL database

```bat
psql -U postgres -c "CREATE DATABASE topildi_db;"
psql -U postgres -d topildi_db -f db/schema.sql
psql -U postgres -d topildi_db -f db/seed.sql
```

Agar eski loyiha database'i allaqachon ishlatilayotgan bo‘lsa:

```bat
psql -U postgres -d topildi_db -f db/migrations/001_auth_otp.sql
```

> Migration eski `otp_codes.code` plaintext ustunini SHA-256 hashga aylantirib, keyin plaintext ustunni o‘chiradi.

### Gmail

Google account uchun 2-Step Verification yoqiladi va App Password yaratiladi.

`.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=16_xonali_google_app_password
MAIL_FROM=yourgmail@gmail.com
```

Oddiy Gmail parolini `SMTP_PASS` ga yozmang.

### Backend

```bat
npm run dev
```

Tekshirish:

`http://localhost:5000/api/health`

## 2. Frontend

Yangi terminal:

```bat
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

## 3. Test

1. `http://localhost:5173/register`
2. full_name, email, +998 telefon va parol kiriting.
3. Gmail inbox/spam papkasini tekshiring.
4. 6 xonali OTP kiriting.
5. Verification muvaffaqiyatli bo‘lsa JWT localStorage'ga yoziladi va home sahifaga o'tiladi.
6. Keyin logout/login oqimini sinang.

OTP hech qachon terminalga yoki API response'ga chiqarilmaydi.

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/verify`
- `POST /api/auth/resend`
- `POST /api/auth/login`
- `GET /api/auth/me`
- mavjud categories/items/claims route'lari saqlangan.
"# imtixon-5oy" 
