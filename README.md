# Depok Point - Sistem Informasi GIS Titik Penting Kota Depok

Website sistem informasi geografis (GIS) untuk memetakan dan mengelola titik-titik penting di Kota Depok seperti rumah sakit, kantor polisi, damkar, puskesmas, kantor pemerintahan, dan layanan publik lainnya.

## Teknologi yang Digunakan

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI Framework:** Daisy UI 5 (Tailwind CSS v4)
- **Peta:** Leaflet + React-Leaflet (OpenStreetMap)
- **Backend:** Firebase Firestore (Real-time Database)
- **Media:** Cloudinary (Image Hosting)
- **Styling:** Tailwind CSS v4 (tanpa custom CSS)

## Fitur Utama

✅ **Peta Interaktif**
- Tampilan real-time menggunakan Leaflet dan OpenStreetMap
- Marker interaktif dengan warna berdasarkan kategori
- Popup informasi detail untuk setiap lokasi
- Responsive design untuk mobile dan desktop

✅ **Manajemen Data Lokasi**
- Tambah lokasi baru langsung dari aplikasi
- Upload foto ke Cloudinary
- Form input dengan validasi koordinat
- Kategori lokasi yang lengkap (Rumah Sakit, Polisi, Damkar, Puskesmas, dll)

✅ **Pencarian & Filter**
- Search lokasi berdasarkan nama
- Filter berdasarkan kategori
- Statistik real-time (total lokasi, per kategori)
- Urutan abjad otomatis

✅ **Real-time Database**
- Sinkronisasi data otomatis dengan Firestore
- Update instan tanpa reload
- Timestamp untuk setiap entry

## Setup & Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd depok-point
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
File `.env.local` sudah dikonfigurasi dengan:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA2N14gwMOK2QkodtEZiYIDEBkM7Qkb6Zg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=depok-point.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=depok-point
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=depok-point.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=655371554588
NEXT_PUBLIC_FIREBASE_APP_ID=1:655371554588:web:5c711352d6d1d70c66f4d9

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dmr6gfbk1
CLOUDINARY_API_KEY=171337198544248
CLOUDINARY_API_SECRET=ufFdkTEcd-epI_pUY36L1F1XI0k
```

### 4. Development Server
```bash
npm run dev
```

Akses aplikasi di: [http://localhost:3000](http://localhost:3000)

## Struktur Proyek

```
depok-point/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts          # Cloudinary upload endpoint
│   ├── globals.css               # Global styles dengan Tailwind & Daisy UI
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page dengan form & list
│   └── favicon.ico
├── components/
│   └── MapView.tsx               # Leaflet map component
├── lib/
│   └── firebase.ts               # Firebase configuration
├── types/
│   └── place.ts                  # Type definitions
├── public/                        # Static assets
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.mjs            # PostCSS configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.local                    # Environment variables
```

## API Endpoints

### POST `/api/upload`
Upload gambar ke Cloudinary.

**Request:**
```
Content-Type: multipart/form-data
Body: { file: File }
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "depok-point/..."
}
```

## Database Schema (Firestore)

**Collection: `places`**

```typescript
{
  id: string;           // Document ID
  name: string;         // Nama lokasi
  category: string;     // Kategori (Rumah Sakit, Polisi, dll)
  address?: string;     // Alamat lengkap
  latitude: number;     // Koordinat latitude
  longitude: number;    // Koordinat longitude
  phone?: string;       // Nomor telepon
  description?: string; // Deskripsi singkat
  imageUrl?: string;    // URL gambar dari Cloudinary
  updatedAt?: string;   // ISO timestamp
}
```

## Kategori Lokasi

- Rumah Sakit
- Puskesmas
- Kantor Polisi
- Damkar (Dinas Kebakaran)
- Kantor Pemerintahan
- Transportasi
- Lainnya

## Build & Deploy

### Build Production
```bash
npm run build
npm start
```

### Deploy ke Vercel
```bash
npm install -g vercel
vercel
```

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Tips Pengembangan

1. **Map Center:** Default koordinat adalah pusat Kota Depok (-6.4025, 106.7942)
2. **Marker Colors:**
   - Hijau (#16a34a): Lokasi normal
   - Biru (#2563eb): Lokasi terpilih
3. **Theme:** Menggunakan Daisy UI theme "corporate" yang professional
4. **No Custom CSS:** Semua styling menggunakan Daisy UI dan Tailwind utilities

## Troubleshooting

### Peta tidak tampil
- Pastikan internet connection aktif (OSM memerlukan online)
- Check browser console untuk Leaflet errors

### Firestore tidak sinkron
- Verifikasi `NEXT_PUBLIC_FIREBASE_PROJECT_ID` di `.env.local`
- Cek rules di Firebase Console untuk read/write access

### Upload gambar gagal
- Verify Cloudinary credentials di `.env.local`
- Check API key dan API secret valid
- Pastikan folder "depok-point" accessible di Cloudinary

## Lisensi

Private Project - Untuk penggunaan internal Kota Depok

## Kontak & Support

Untuk pertanyaan atau kontribusi, hubungi tim development.
