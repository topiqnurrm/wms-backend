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
  - [Work Order](#work-order)
  - [Asset Label](#asset-label)
  - [Report & Analytics](#report--analytics)
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
| Node.js | 20.x | Runtime |
| Express | 5.x | HTTP framework |
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
| `pdfkit` | latest | Generate PDF label |
| `qrcode` | latest | Generate QR Code untuk label PDF |

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
│   │   ├── workOrderController.js
│   │   ├── assetLabelController.js
│   │   └── reportController.js
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
│   │   ├── workOrder.js
│   │   ├── assetLabelRoutes.js
│   │   └── reportRoutes.js
│   ├── validations/
│   │   ├── authValidation.js
│   │   ├── userValidation.js
│   │   ├── warehouseValidation.js
│   │   ├── assetValidation.js
│   │   ├── supplierValidation.js
│   │   ├── storageBinValidation.js
│   │   └── workOrderValidation.js
│   ├── utils/
│   │   ├── helpers.js         # generateToken, hashPassword, successResponse, dll
│   │   ├── prisma.js          # Singleton Prisma client dengan Proxy pattern
│   │   └── autoNumber.js      # Auto-generate nomor (WH_01, AST_01, WOI_001, dll)
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

---

## Database

Project ini menggunakan **Supabase** (hosted PostgreSQL) dengan **Prisma v7**.

### Prisma v7 — Perbedaan dari v5/v6

Prisma v7 tidak lagi menerima `url` di `schema.prisma`. URL koneksi dikonfigurasi di `prisma.config.ts`.

```prisma
// BENAR di Prisma v7
datasource db {
  provider = "postgresql"
  // tidak ada url di sini
}
```

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
  "timestamp": "2026-06-11T01:22:16.951Z",
  "uptime": 110.27
}
```

---

## Deployment (Render)

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
| `CORS_ORIGIN` | URL frontend (ganti setelah frontend di-deploy) |

> **Catatan:** `PORT` tidak perlu ditambahkan — Render inject otomatis.

### Credentials Admin Production

```
email    : admin@wms.com
password : Admin123!
```

---

## API Reference

Semua endpoint (kecuali auth) memerlukan header:
```
Authorization: Bearer <token>
```

---

### Auth

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/auth/register` | Public | Register user baru |
| POST | `/auth/login` | Public | Login, dapat JWT token |
| GET | `/auth/me` | Semua | Profil user yang sedang login |

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
  "data": {
    "token": "eyJhbGci...",
    "user": { "userNumber": "USER_01", "userName": "Admin WMS", "role": "ADMIN" }
  }
}
```

Token berlaku **1 hari**.

---

### User

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/users` | ADMIN, MANAGER | List semua user |
| GET | `/users/:id` | ADMIN, MANAGER | Detail user |
| POST | `/users` | ADMIN | Buat user baru |
| PUT | `/users/:id` | ADMIN | Update user |
| PATCH | `/users/:id/change-password` | Semua | Ganti password |
| DELETE | `/users/:id` | ADMIN | Soft delete user |

---

### Warehouse

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/warehouses` | Semua | List warehouse aktif |
| GET | `/warehouses/:id` | Semua | Detail warehouse + storage bins |
| POST | `/warehouses` | Semua | Buat warehouse baru |
| PUT | `/warehouses/:id` | Semua | Update warehouse |
| DELETE | `/warehouses/:id` | Semua | Soft delete warehouse |

**POST `/warehouses`**
```json
{
  "whName": "Gudang Jogja",
  "whLocation": "Sleman, Yogyakarta",
  "remarks": "Gudang utama"
}
```

---

### Storage Bin

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/storage-bins` | Semua | List storage bin |
| GET | `/storage-bins/:id` | Semua | Detail storage bin + asset |
| POST | `/storage-bins` | Semua | Buat storage bin baru |
| PUT | `/storage-bins/:id` | Semua | Update storage bin |
| DELETE | `/storage-bins/:id` | Semua | Hard delete (gagal jika ada asset) |

**GET `/storage-bins` — Query Parameters**

| Parameter | Keterangan |
|---|---|
| `page` | Halaman (default: 1) |
| `limit` | Per halaman (default: 10) |
| `search` | Cari berdasarkan binAddress |
| `warehouseId` | Filter berdasarkan ID warehouse |

**POST `/storage-bins`**
```json
{
  "warehouseId": "clxxxxx",
  "category": "SMALL_ASSET",
  "remarks": "Rak kiri bawah"
}
```

---

### Supplier

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/suppliers` | Semua | List supplier aktif |
| GET | `/suppliers/:id` | Semua | Detail supplier + daftar asset |
| POST | `/suppliers` | Semua | Buat supplier baru |
| PUT | `/suppliers/:id` | Semua | Update supplier |
| DELETE | `/suppliers/:id` | Semua | Soft delete supplier |

---

### Asset

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/assets` | Semua | List asset aktif |
| GET | `/assets/:id` | Semua | Detail asset + supplier + storage bin |
| POST | `/assets` | Semua | Buat asset baru |
| PUT | `/assets/:id` | Semua | Update asset |
| DELETE | `/assets/:id` | Semua | Soft delete asset |

**POST `/assets`**
```json
{
  "assetName": "Nike Running Shoes Black",
  "category": "SMALL_ASSET",
  "price": 1200000,
  "supplierId": "clxxxxx",
  "storageBinId": "clxxxxx",
  "remarks": "Produk baru"
}
```

> Category asset **harus sama** dengan category storage bin saat dialokasikan.

---

### Work Order

Work Order adalah dokumen perintah kerja untuk inbound atau outbound asset. Tanpa WO, user tidak bisa scan label.

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/work-orders` | Semua | List semua WO |
| GET | `/work-orders/:id` | Semua | Detail WO + labels |
| POST | `/work-orders` | ADMIN, MANAGER | Buat WO baru |
| PUT | `/work-orders/:id/status` | Semua | Update status WO manual |
| POST | `/work-orders/:id/generate-labels` | Semua | Generate labels sejumlah qty WO |
| GET | `/work-orders/:id/fifo-labels` | Semua | List label FIFO (untuk suggestion outbound) |

**POST `/work-orders`**
```json
{
  "type": "INBOUND",
  "warehouseId": "clxxxxx",
  "storageBinId": "clxxxxx",
  "assetId": "clxxxxx",
  "quantity": 10,
  "remarks": "Inbound barang baru datang"
}
```

Response `201`:
```json
{
  "success": true,
  "data": {
    "id": "clxxxxx",
    "woNumber": "WOI_001",
    "type": "INBOUND",
    "status": "TODO",
    "quantity": 10,
    "warehouse": { "whName": "Gudang Jogja" },
    "storageBin": { "binAddress": "WH_01_001" },
    "asset": { "assetName": "Nike Running Shoes Black" }
  }
}
```

**Business Logic:**
- Category asset harus sama dengan category storage bin
- Status WO diupdate otomatis saat scan label:
  - `TODO` → scan = 0
  - `ON_PROGRESS` → scan > 0
  - `DONE` → scan = qty WO
- 1 label = 1 pcs asset
- Label code melanjutkan counting dari label sebelumnya (meskipun beda WO, selama asset sama)
- Generate labels tidak bisa dilakukan dua kali pada WO yang sama

---

### Asset Label

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/asset-labels` | Semua | List semua label |
| GET | `/asset-labels/:id` | Semua | Detail label + scan history |
| POST | `/asset-labels/scan` | Semua | Scan label inbound |
| POST | `/asset-labels/outbound-scan` | Semua | Scan label outbound (FIFO) |
| GET | `/asset-labels/print/:workOrderId` | Semua | Download PDF label (Send & Download di Postman) |

**POST `/asset-labels/scan`**
```json
{
  "labelCode": "AST_01_000001"
}
```

**POST `/asset-labels/outbound-scan`**
```json
{
  "labelCode": "AST_01_000001"
}
```

> Outbound harus urut berdasarkan inbound terlama ke terbaru (FIFO). Jika melanggar urutan, akan return error `FIFO violation. Scan AST_01_000001 first`.

**GET `/asset-labels/print/:workOrderId`**

Mengembalikan file PDF. Di Postman gunakan **Send and Download** untuk menyimpan file-nya.

Layout PDF: A4, 2 kolom × 5 baris = 10 label per halaman. Setiap label berisi: asset number, asset name, harga, QR Code, label code, supplier.

---

### Report & Analytics

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/reports/inbound` | Semua | Log semua transaksi inbound |
| GET | `/reports/outbound` | Semua | Log semua transaksi outbound |
| GET | `/reports/stock` | Semua | Stock semua asset saat ini |
| GET | `/reports/analytics` | Semua | Summary total stock + per category |

**GET `/reports/analytics`**

Query params opsional:

| Parameter | Keterangan |
|---|---|
| `warehouseId` | Filter asset berdasarkan warehouse |
| `storageBinId` | Filter asset berdasarkan storage bin tertentu |

Response:
```json
{
  "success": true,
  "data": {
    "totalAsset": 5,
    "totalStock": 120,
    "perCategory": [
      { "category": "SMALL_ASSET", "totalStock": 50, "totalAsset": 2 },
      { "category": "MEDIUM_ASSET", "totalStock": 30, "totalAsset": 1 },
      { "category": "LARGE_ASSET", "totalStock": 40, "totalAsset": 2 }
    ],
    "detail": [
      {
        "assetNumber": "AST_01",
        "assetName": "Nike Running Shoes Black",
        "category": "SMALL_ASSET",
        "stock": 50,
        "storageBin": "WH_01_001",
        "warehouseName": "Gudang Jogja",
        "supplierName": "Supplier XYZ"
      }
    ]
  }
}
```

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
    { "field": "type", "message": "Type must be INBOUND or OUTBOUND" }
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
| 401 | Unauthorized | Token tidak ada, tidak valid, atau expired |
| 403 | Forbidden | Token valid tapi role tidak punya akses |
| 404 | Not Found | Data atau route tidak ditemukan |
| 409 | Conflict | Data duplikat |
| 422 | Unprocessable Entity | Validasi input gagal (Joi) |
| 429 | Too Many Requests | Kena rate limit |
| 500 | Internal Server Error | Error tidak terduga di server |

---

## Role & Hak Akses

| Role | Keterangan |
|---|---|
| `ADMIN` | Akses penuh ke semua endpoint |
| `MANAGER` | Akses read + create + update, tidak bisa delete user |
| `STAFF` | Akses terbatas, bisa scan label dan ganti password sendiri |

---

## Enum Reference

| Enum | Nilai Valid | Dipakai di |
|---|---|---|
| `Role` | `ADMIN` \| `MANAGER` \| `STAFF` | User, Auth register |
| `AssetCategory` | `SMALL_ASSET` \| `MEDIUM_ASSET` \| `LARGE_ASSET` | Asset, StorageBin |
| `SupplierCategory` | `LOCAL` \| `IMPORT` | Supplier |
| `WorkOrderType` | `INBOUND` \| `OUTBOUND` | WorkOrder |
| `WorkOrderStatus` | `TODO` \| `ON_PROGRESS` \| `DONE` | WorkOrder |

---

## Auto-Number Format

Nomor di-generate otomatis oleh server.

| Resource | Contoh | Format |
|---|---|---|
| Warehouse | `WH_01` | Prefix `WH_` + 2 digit angka |
| Storage Bin | `WH_01_001` | Nomor warehouse + 3 digit urutan |
| Asset | `AST_01` | Prefix `AST_` + 2 digit angka |
| Supplier | `SUP_01` | Prefix `SUP_` + 2 digit angka |
| User | `USER_01` | Prefix `USER_` + 2 digit angka |
| Work Order (Inbound) | `WOI_001` | Prefix `WOI_` + 3 digit angka |
| Work Order (Outbound) | `WOO_001` | Prefix `WOO_` + 3 digit angka |
| Label Code | `AST_01_000001` | Asset number + 6 digit urutan per asset |

---

## Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| Global (semua endpoint) | 100 request per IP | 15 menit |
| Auth (`/auth/login`, `/auth/register`) | 10 request per IP | 15 menit |

---

## Arsitektur & Keputusan Teknis

### Work Order Flow

```
Buat WO → Generate Labels → Scan Label (per pcs) → Status DONE
              ↓
         Label Code: AST_01_000001, AST_01_000002, ...
              ↓
         Scan Inbound → stock +1 per scan
         Scan Outbound → FIFO check → stock -1 per scan
```

### FIFO Enforcement

Outbound scan harus urut dari label yang paling lama masuk (inboundAt terlama). Jika melanggar urutan, sistem akan menolak dan memberikan info label mana yang harus discan lebih dulu.

### Proxy Pattern pada Prisma Client

`src/utils/prisma.js` menggunakan Proxy agar PrismaClient dibuat lazy — hanya dibuat saat pertama kali diakses, memastikan `process.env.DATABASE_URL` sudah ter-load sebelum koneksi dibuat.

### Soft Delete

Warehouse, Asset, dan Supplier menggunakan soft delete (`isActive = false`) agar data historis tetap tersimpan. StorageBin menggunakan hard delete tapi hanya bisa dihapus jika tidak ada asset di dalamnya.

---

## Contoh Integrasi Frontend (Axios)

```javascript
// api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://wms-backend-ef8b.onrender.com/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

*WMS Backend — v2.0 | 11 Juni 2026 | Skill Test 2 Complete*
