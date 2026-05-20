# WMS Backend

Warehouse Management System — REST API Backend

**Stack:** Node.js + Express + Prisma v7 + Supabase (PostgreSQL) + JWT  
**Production URL:** https://wms-backend-ef8b.onrender.com  
**Base URL (Production):** `https://wms-backend-ef8b.onrender.com/api/v1`  
**Base URL (Local):** `http://localhost:3000/api/v1`

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Setup & Instalasi](#setup--instalasi)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Menjalankan Project](#menjalankan-project)
- [Deployment (Render)](#deployment-render)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [User](#user)
  - [Warehouse](#warehouse)
  - [Storage Bin](#storage-bin)
  - [Supplier](#supplier)
  - [Asset](#asset)
  - [Asset Movement](#asset-movement)
- [Format Response](#format-response)
- [HTTP Status Code](#http-status-code)
- [Role & Hak Akses](#role--hak-akses)
- [Enum Reference](#enum-reference)
- [Auto-Number Format](#auto-number-format)
- [Rate Limiting](#rate-limiting)
- [Arsitektur & Keputusan Teknis](#arsitektur--keputusan-teknis)

---

## Tech Stack

| Package | Versi | Fungsi |
|---|---|---|
| Node.js | 24.x | Runtime |
| Express | 4.x | HTTP framework |
| Prisma | v7 | ORM |
| `@prisma/adapter-pg` | latest | Adapter koneksi PostgreSQL |
| `pg` | latest | PostgreSQL client pool |
| Supabase | — | Hosted PostgreSQL (Session Pooler) |
| `bcryptjs` | latest | Hash password |
| `jsonwebtoken` | latest | Generate & verify JWT token |
| `joi` | latest | Validasi request body |
| `express-rate-limit` | latest | Rate limiting |
| `helmet` | latest | Security headers |
| `cors` | latest | Cross-origin request |
| `morgan` | latest | HTTP request logger |
| `dotenv` | latest | Load environment variables |

---

## Struktur Folder

```
wms-backend/
├── prisma/
│   ├── schema.prisma          # Schema database (semua model)
│   ├── migrations/            # Migration history
│   └── migration_lock.toml
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── warehouseController.js
│   │   ├── assetController.js
│   │   ├── supplierController.js
│   │   ├── storageBinController.js
│   │   └── assetMovementController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authenticate + authorize
│   │   ├── validate.js        # Joi validation middleware
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── warehouse.js
│   │   ├── asset.js
│   │   ├── supplier.js
│   │   ├── storageBin.js
│   │   └── assetMovement.js
│   ├── validations/
│   │   ├── authValidation.js
│   │   ├── userValidation.js
│   │   ├── warehouseValidation.js
│   │   ├── assetValidation.js
│   │   ├── supplierValidation.js
│   │   ├── storageBinValidation.js
│   │   └── assetMovementValidation.js
│   ├── utils/
│   │   ├── helpers.js         # generateToken, hashPassword, successResponse, dll
│   │   ├── prisma.js          # Singleton Prisma client dengan Proxy pattern
│   │   └── autoNumber.js      # Auto-generate nomor (WH_01, AST_01, dll)
│   ├── app.js                 # Express config, middleware, routes
│   └── server.js              # Entry point, koneksi DB, graceful shutdown
├── .env                       # Tidak di-commit ke git
├── .gitignore
├── package.json
└── prisma.config.ts           # Konfigurasi Prisma v7
```

---

## Setup & Instalasi

```bash
# 1. Clone repo
git clone https://github.com/topiqnurrm/wms-backend.git
cd wms-backend

# 2. Install dependencies
npm install

# 3. Buat file .env (lihat bagian Environment Variables)
cp .env.example .env

# 4. Generate Prisma Client
npx prisma generate

# 5. Jalankan migrasi (pastikan DATABASE_URL sudah diisi)
npx prisma migrate dev
```

---

## Environment Variables

Buat file `.env` di root project:

```dotenv
# Database — gunakan Session Pooler dari Supabase
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=ganti_dengan_secret_yang_panjang_dan_aman
JWT_EXPIRES_IN=1d
```

**Catatan `JWT_EXPIRES_IN`:**

| Value | Arti | Cocok untuk |
|---|---|---|
| `1h` | 1 jam | Aplikasi banking/keuangan |
| `8h` | 8 jam | Aplikasi kerja (1 shift) |
| `1d` | 1 hari | Aplikasi umum ✅ (dipakai project ini) |
| `7d` | 7 hari | Aplikasi dengan "remember me" |
| `30d` | 30 hari | Aplikasi mobile |

**Catatan `DATABASE_URL`:**  
Gunakan **Session Pooler** dari Supabase (bukan Direct Connection). Session Pooler kompatibel dengan IPv4 dan mendukung koneksi pooling dari Node.js.

---

## Database

Project ini menggunakan **Supabase** (hosted PostgreSQL) dengan **Prisma v7**.

### Prisma v7 — Perubahan Breaking dari v5/v6

Prisma v7 tidak lagi menerima `url` di `schema.prisma`. URL koneksi dikonfigurasi di `prisma.config.ts`.

```prisma
// BENAR di Prisma v7
datasource db {
  provider = "postgresql"
}

// SALAH di Prisma v7 (cara lama)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ← ini akan error
}
```

### Prisma Client — Singleton dengan Proxy Pattern

`src/utils/prisma.js` menggunakan Proxy untuk memastikan instance Prisma dibuat **setelah** `dotenv` selesai load:

```javascript
const prismaProxy = new Proxy({}, {
  get(_, prop) {
    const client = getPrisma();
    const value = client[prop];
    // .bind(client) penting agar $connect/$disconnect tidak kehilangan context this
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
```

Tanpa `.bind(client)`, method seperti `$connect()` dan `$disconnect()` akan error karena `this` tidak merujuk ke instance PrismaClient yang benar.

### Commands

```bash
npm run db:migrate    # Buat migration baru
npm run db:generate   # Generate Prisma Client
npm run db:studio     # Buka Prisma Studio (GUI database)
```

---

## Menjalankan Project

```bash
# Development (auto-restart dengan nodemon)
npm run dev

# Production
npm start
```

Health check: `GET http://localhost:3000/health`

```json
{
  "status": "ok",
  "timestamp": "2026-05-20T05:39:27.177Z",
  "uptime": 77.71
}
```

---

## Deployment (Render)

Project ini di-deploy ke **Render** (free tier).

**Production URL:** https://wms-backend-ef8b.onrender.com

### Konfigurasi di Render

| Field | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npx prisma generate` |
| Start Command | `npm start` |
| Instance Type | Free |

### Environment Variables di Render

| Key | Value |
|---|---|
| `DATABASE_URL` | Connection string Supabase Session Pooler |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Secret key JWT |
| `JWT_EXPIRES_IN` | `1d` |
| `CORS_ORIGIN` | `*` (ganti ke URL frontend setelah frontend di-deploy) |

> **Catatan:** `PORT` **tidak perlu** ditambahkan — Render inject otomatis.

### Perilaku Free Tier

Render free tier akan "sleep" setelah 15 menit tidak ada request. Request pertama setelah idle akan memerlukan ~30 detik untuk wake up. Ini normal untuk kebutuhan demo/assessment.

### Credentials Admin Production

```
email    : admin@wms.com
password : Admin123!
```

---

## API Reference

### Auth

Tidak memerlukan token kecuali `GET /auth/me`.

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/auth/register` | Register user baru |
| POST | `/auth/login` | Login, dapat JWT token |
| GET | `/auth/me` | Profil user yang sedang login |

**POST `/auth/register`**

```json
{
  "userName": "Admin WMS",
  "email": "admin@wms.com",
  "password": "Admin123!",
  "role": "ADMIN",
  "telp": "08123456789"
}
```

Response `201`:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "clxxxxx",
    "userNumber": "USER_01",
    "userName": "Admin WMS",
    "email": "admin@wms.com",
    "role": "ADMIN",
    "isActive": true
  }
}
```

**POST `/auth/login`**

```json
{
  "email": "admin@wms.com",
  "password": "Admin123!"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userNumber": "USER_01",
      "userName": "Admin WMS",
      "email": "admin@wms.com",
      "role": "ADMIN"
    }
  }
}
```

Token berlaku **1 hari**. Sertakan di setiap request dengan header:
```
Authorization: Bearer <token>
```

---

### User

Semua endpoint wajib login. Password tidak pernah dikembalikan di response.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/users` | ADMIN, MANAGER | List semua user dengan pagination & search |
| GET | `/users/:id` | ADMIN, MANAGER | Detail user |
| POST | `/users` | ADMIN | Buat user baru |
| PUT | `/users/:id` | ADMIN | Update user (tidak bisa ganti email) |
| PATCH | `/users/:id/change-password` | Semua | Ganti password (verifikasi password lama) |
| DELETE | `/users/:id` | ADMIN | Soft delete user |

**GET `/users` — Query Parameters**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | number | Halaman (default: 1) |
| `limit` | number | Per halaman (default: 10) |
| `search` | string | Cari berdasarkan userName atau email |
| `role` | string | Filter: ADMIN \| MANAGER \| STAFF |

**POST `/users` — Request Body**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `userName` | string | Ya | Min 3 karakter |
| `email` | string | Ya | Email valid dan unik |
| `password` | string | Ya | Min 8 karakter, 1 huruf besar, 1 angka, 1 karakter spesial (!@#$%^&*) |
| `role` | string | Tidak | ADMIN \| MANAGER \| STAFF (default: STAFF) |
| `telp` | string | Tidak | Nomor telepon |

> Tidak bisa menghapus admin terakhir yang aktif di sistem.

---

### Warehouse

Soft delete (`isActive = false`). Auto-number format `WH_01`, `WH_02`, dst.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/warehouses` | Semua | List warehouse aktif |
| GET | `/warehouses/:id` | Semua | Detail warehouse + storage bins |
| POST | `/warehouses` | Semua | Buat warehouse baru |
| PUT | `/warehouses/:id` | Semua | Update warehouse |
| DELETE | `/warehouses/:id` | Semua | Soft delete warehouse |

**POST `/warehouses` — Request Body**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `whName` | string | Ya | Min 2 karakter |
| `whLocation` | string | Tidak | Lokasi warehouse |
| `remarks` | string | Tidak | Catatan tambahan |

---

### Storage Bin

Lokasi penyimpanan di dalam Warehouse. 1 Storage Bin hanya bisa menampung 1 Asset (one-to-one). Auto-number format `WH_01_001`.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/storage-bins` | Semua | List storage bin |
| GET | `/storage-bins/:id` | Semua | Detail storage bin + asset |
| POST | `/storage-bins` | Semua | Buat storage bin baru |
| PUT | `/storage-bins/:id` | Semua | Update storage bin |
| DELETE | `/storage-bins/:id` | Semua | Hard delete (gagal jika ada asset) |

**GET `/storage-bins` — Query Parameters**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | number | Halaman (default: 1) |
| `limit` | number | Per halaman (default: 10) |
| `search` | string | Cari berdasarkan binAddress atau category |
| `warehouseId` | string | Filter berdasarkan ID warehouse |

**POST `/storage-bins` — Request Body**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `warehouseId` | string | Ya | ID warehouse tempat storage bin berada |
| `category` | string | Ya | SMALL_ASSET \| MEDIUM_ASSET \| LARGE_ASSET |
| `remarks` | string | Tidak | Catatan tambahan |

---

### Supplier

Soft delete. Auto-number format `SUP_01`, `SUP_02`, dst.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/suppliers` | Semua | List supplier aktif |
| GET | `/suppliers/:id` | Semua | Detail supplier + daftar asset |
| POST | `/suppliers` | Semua | Buat supplier baru |
| PUT | `/suppliers/:id` | Semua | Update supplier |
| DELETE | `/suppliers/:id` | Semua | Soft delete supplier |

**POST `/suppliers` — Request Body**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `supName` | string | Ya | Min 2 karakter |
| `supCategory` | string | Tidak | LOCAL \| IMPORT (default: LOCAL) |
| `address` | string | Tidak | Alamat supplier |

---

### Asset

Soft delete. Auto-number format `AST_01`. Category asset **harus sama** dengan category Storage Bin saat dialokasikan.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/assets` | Semua | List asset aktif |
| GET | `/assets/:id` | Semua | Detail asset + supplier + storage bin |
| POST | `/assets` | Semua | Buat asset baru |
| PUT | `/assets/:id` | Semua | Update asset |
| DELETE | `/assets/:id` | Semua | Soft delete asset |

**GET `/assets` — Query Parameters**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | number | Halaman (default: 1) |
| `limit` | number | Per halaman (default: 10) |
| `search` | string | Cari berdasarkan assetName atau assetNumber |
| `category` | string | Filter: SMALL_ASSET \| MEDIUM_ASSET \| LARGE_ASSET |
| `supplierId` | string | Filter berdasarkan ID supplier |

**POST `/assets` — Request Body**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `assetName` | string | Ya | Min 2 karakter |
| `category` | string | Ya | SMALL_ASSET \| MEDIUM_ASSET \| LARGE_ASSET |
| `price` | number | Tidak | Harga asset (default: 0) |
| `supplierId` | string | Tidak | ID supplier |
| `storageBinId` | string | Tidak | ID storage bin (category harus sama) |
| `remarks` | string | Tidak | Catatan tambahan |

**Business Logic:**
- Category asset harus sama dengan category storage bin saat dialokasikan
- 1 storage bin hanya bisa menampung 1 asset (one-to-one)
- Asset yang sudah dialokasikan ke storage bin lain tidak bisa dialokasikan lagi
- Set `storageBinId: null` untuk melepas alokasi

---

### Asset Movement

Mencatat riwayat pergerakan asset. History tidak bisa diedit — prinsip audit trail.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/asset-movements` | ADMIN, MANAGER | List movement dengan pagination |
| GET | `/asset-movements/:id` | ADMIN, MANAGER | Detail movement |
| POST | `/asset-movements` | ADMIN, MANAGER | Buat movement baru |
| DELETE | `/asset-movements/:id` | ADMIN | Hapus movement |

**GET `/asset-movements` — Query Parameters**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `page` | number | Halaman (default: 1) |
| `limit` | number | Per halaman (default: 10) |
| `type` | string | Filter: INBOUND \| OUTBOUND \| TRANSFER |
| `assetId` | string | Filter berdasarkan asset ID |
| `warehouseId` | string | Filter berdasarkan warehouse ID |

**POST `/asset-movements` — Request Body**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `type` | string | Ya | INBOUND \| OUTBOUND \| TRANSFER |
| `assetId` | string | Ya | ID asset yang bergerak |
| `warehouseId` | string | Ya | ID warehouse tujuan / asal |
| `storageBinId` | string | Tidak | ID storage bin |
| `quantity` | number | Ya | Jumlah (integer >= 0) |
| `notes` | string | Tidak | Catatan, maks 500 karakter |

---

## Format Response

**Sukses (tanpa pagination):**
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": { ... }
}
```

**Sukses (dengan pagination):**
```json
{
  "success": true,
  "message": "...",
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email must be a valid email address" }
  ]
}
```

---

## HTTP Status Code

| Code | Status | Keterangan |
|---|---|---|
| 200 | OK | Request berhasil (GET, PUT, PATCH) |
| 201 | Created | Data berhasil dibuat (POST) |
| 400 | Bad Request | Request tidak valid / field salah |
| 401 | Unauthorized | Token tidak ada, tidak valid, atau sudah expired |
| 403 | Forbidden | Token valid tapi role tidak punya akses |
| 404 | Not Found | Data atau route tidak ditemukan |
| 409 | Conflict | Data duplikat (email sudah terdaftar, dll) |
| 422 | Unprocessable Entity | Validasi input gagal (Joi) |
| 429 | Too Many Requests | Kena rate limit |
| 500 | Internal Server Error | Error tidak terduga di server |

---

## Role & Hak Akses

| Role | Keterangan |
|---|---|
| `ADMIN` | Akses penuh ke semua endpoint termasuk user management |
| `MANAGER` | Akses read + create + update, tidak bisa delete user |
| `STAFF` | Akses terbatas, bisa ganti password sendiri |

---

## Enum Reference

| Enum | Nilai Valid | Dipakai di |
|---|---|---|
| `Role` | `ADMIN` \| `MANAGER` \| `STAFF` | User, Auth register |
| `AssetCategory` | `SMALL_ASSET` \| `MEDIUM_ASSET` \| `LARGE_ASSET` | Asset, StorageBin |
| `SupplierCategory` | `LOCAL` \| `IMPORT` | Supplier |
| `MovementType` | `INBOUND` \| `OUTBOUND` \| `TRANSFER` | AssetMovement |

---

## Auto-Number Format

Nomor di-generate otomatis oleh server, tidak perlu dikirim dari client.

| Resource | Contoh | Format |
|---|---|---|
| Warehouse | `WH_01` | Prefix `WH_` + 2 digit angka |
| Storage Bin | `WH_01_001` | Nomor warehouse + 3 digit urutan |
| Asset | `AST_01` | Prefix `AST_` + 2 digit angka |
| Supplier | `SUP_01` | Prefix `SUP_` + 2 digit angka |
| User | `USER_01` | Prefix `USER_` + 2 digit angka |

---

## Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| Global (semua endpoint) | 100 request per IP | 15 menit |
| Auth (`/auth/login`, `/auth/register`) | 10 request per IP | 15 menit |

Jika melebihi batas, server akan return status `429` dengan pesan:
```json
{
  "success": false,
  "message": "Too many requests, please try again after 15 minutes."
}
```

---

## Arsitektur & Keputusan Teknis

### Adapter pg vs Adapter Neon

Project ini menggunakan `@prisma/adapter-pg` + `pg`, bukan `@prisma/adapter-neon`. Alasannya:

- Adapter Neon menggunakan WebSocket yang bisa bermasalah di environment production (Render)
- Adapter `pg` lebih stabil untuk project CommonJS
- Adapter `pg` tidak bergantung pada cara `dotenv` di-load

### Proxy Pattern pada Prisma Client

`src/utils/prisma.js` menggunakan [Proxy pattern](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) agar `PrismaClient` dibuat **lazy** — hanya dibuat saat pertama kali diakses, bukan saat module di-require. Ini memastikan `process.env.DATABASE_URL` sudah ter-load oleh `dotenv` sebelum koneksi dibuat.

### Soft Delete

Warehouse, Asset, dan Supplier menggunakan soft delete (`isActive = false`) agar data historis tetap tersimpan. StorageBin menggunakan hard delete tapi hanya bisa dihapus jika tidak ada asset di dalamnya.

### Satu Instance Prisma

`server.js` tidak membuat instance Prisma sendiri. Semua koneksi database menggunakan satu instance dari `src/utils/prisma.js`. Ini mencegah resource leak dan konflik koneksi.

---

## Contoh Integrasi Frontend (Axios)

```javascript
// api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://wms-backend-ef8b.onrender.com/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Otomatis pasang token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expired
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

*WMS Backend — v1.1 | 20 Mei 2026*
