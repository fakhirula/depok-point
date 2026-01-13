# API Documentation - Depok Point

## Overview

Depok Point menggunakan kombinasi:
- **Firebase Firestore** untuk database
- **Cloudinary** untuk image hosting
- **Next.js API Routes** sebagai backend

## Database Schema

### Collection: `places`

Struktur dokumen di Firestore:

```typescript
{
  // Auto-generated oleh Firestore
  id: "unique-document-id"
  
  // Fields yang wajib
  name: "RSUD Kota Depok",
  category: "Rumah Sakit",
  latitude: -6.4025,
  longitude: 106.7942,
  
  // Fields opsional
  address: "Jl. Raya Depok, No. 1, Kota Depok",
  phone: "(021) 123456",
  description: "Rumah sakit umum dengan fasilitas lengkap",
  imageUrl: "https://res.cloudinary.com/...",
  updatedAt: "2026-01-13T10:30:00.000Z"
}
```

### Validasi Data

```typescript
interface PlaceData {
  name: string;           // Required, min 3 chars
  category: PlaceCategory; // Required, dari enum
  latitude: number;       // Required, valid float
  longitude: number;      // Required, valid float
  address?: string;       // Optional, string
  phone?: string;         // Optional, string
  description?: string;   // Optional, string (max 500 chars recommended)
  imageUrl?: string;      // Optional, Cloudinary URL
  updatedAt?: string;     // Auto-generated, ISO string
}
```

## REST API Endpoints

### 1. POST `/api/upload`

**Purpose:** Upload gambar ke Cloudinary

**Request:**
```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data

file: <File object>
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@photo.jpg"
```

**JavaScript Fetch:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.url); // Cloudinary URL
```

**Response Success (200):**
```json
{
  "url": "https://res.cloudinary.com/dmr6gfbk1/image/upload/v1234567890/depok-point/abc123.jpg",
  "publicId": "depok-point/abc123"
}
```

**Response Error (400/500):**
```json
{
  "error": "File is required" 
}
```

**Error Codes:**
- `400` - File tidak ditemukan atau invalid format
- `500` - Cloudinary upload error

**File Constraints:**
- Format: JPG, PNG, GIF, WebP, dll
- Size: Unlimited (tapi recommended max 5MB)
- Folder: `depok-point/` di Cloudinary

---

## Firestore Queries

### Read All Places

```typescript
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const snapshot = await getDocs(collection(db, "places"));
const places = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Real-time Listener

```typescript
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

const q = query(collection(db, "places"), orderBy("name"));

const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });
});

// Stop listening when done
unsubscribe();
```

### Filter by Category

```typescript
import { collection, query, where } from "firebase/firestore";

const q = query(
  collection(db, "places"),
  where("category", "==", "Rumah Sakit")
);

const snapshot = await getDocs(q);
```

### Search by Name

```typescript
// Client-side filtering (recommended untuk small dataset)
const places = [...];
const results = places.filter(p => 
  p.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// Atau gunakan Firestore full-text search (perlu setup)
// https://firebase.google.com/docs/firestore/solutions/search
```

### Add New Place

```typescript
import { collection, addDoc } from "firebase/firestore";

const docRef = await addDoc(collection(db, "places"), {
  name: "RSUD Baru",
  category: "Rumah Sakit",
  latitude: -6.4025,
  longitude: 106.7942,
  address: "Jl. Test",
  phone: "021-123456",
  description: "Rumah sakit baru",
  imageUrl: "https://...",
  updatedAt: new Date().toISOString()
});

console.log("Document ID:", docRef.id);
```

### Update Place

```typescript
import { doc, updateDoc } from "firebase/firestore";

const docRef = doc(db, "places", "document-id");

await updateDoc(docRef, {
  description: "Updated description",
  updatedAt: new Date().toISOString()
});
```

### Delete Place

```typescript
import { doc, deleteDoc } from "firebase/firestore";

await deleteDoc(doc(db, "places", "document-id"));
```

---

## Cloudinary Integration

### Configuration

```typescript
// Server-side (api/upload/route.ts)
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Upload Options

```typescript
cloudinary.uploader.upload_stream({
  folder: "depok-point",      // Folder di Cloudinary
  resource_type: "image",     // Tipe resource
  quality: "auto",            // Auto quality optimization
  fetch_format: "auto",       // Auto format conversion
  max_bytes: 5242880          // Max 5MB
}, (error, result) => {
  // Handle result
});
```

### Image Transformations

```typescript
// Contoh URL dengan transformasi
const imageUrl = 
  "https://res.cloudinary.com/dmr6gfbk1/image/upload/" +
  "c_fill,w_500,h_500,f_auto/" +  // Resize & auto format
  "v1234567890/depok-point/abc123.jpg";

// Di HTML
<img src={imageUrl} alt="Lokasi" />
```

---

## Authentication & Security

### Firestore Rules (Recommended)

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read untuk semua user
    match /places/{document=**} {
      allow read: if true;
    }
    
    // Allow write hanya untuk authenticated users
    // (bisa diupdate sesuai kebutuhan)
    match /places/{document=**} {
      allow write: if request.auth != null;
    }
  }
}
```

### Environment Variables Security

**Public (Client-side OK):**
```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

**Private (Server-side ONLY):**
```env
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

## Error Handling

### Common Errors

#### 1. Firebase Configuration Missing
```
Error: Firebase env vars are missing
```
**Solution:** Check `.env.local` untuk semua `NEXT_PUBLIC_FIREBASE_*` variables

#### 2. Cloudinary Upload Failed
```
Error: Gagal mengunggah gambar
```
**Solution:** Verify Cloudinary credentials valid dan API key active

#### 3. Firestore Permission Denied
```
Error: Missing or insufficient permissions
```
**Solution:** Check Firestore rules di Firebase Console

#### 4. Invalid Coordinates
```
Error: Koordinat harus berupa angka
```
**Solution:** Ensure latitude/longitude adalah number, bukan string

---

## Rate Limiting & Quotas

### Firebase Firestore
- **Reads:** 50,000 per hari (free tier)
- **Writes:** 20,000 per hari (free tier)
- **Deletes:** 20,000 per hari (free tier)

### Cloudinary
- **Storage:** 10 GB (free tier)
- **Bandwidth:** Unlimited
- **Upload limit:** 100 MB per file

---

## Performance Tips

### 1. Optimize Map Rendering
```typescript
// Use dynamic import untuk MapView
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false // Tidak render di server
});
```

### 2. Batch Firestore Operations
```typescript
import { writeBatch } from "firebase/firestore";

const batch = writeBatch(db);

places.forEach(place => {
  batch.set(doc(db, "places", place.id), place);
});

await batch.commit();
```

### 3. Use Indexes untuk Complex Queries
```firestore
// Jika query dengan multiple filters, buat composite index
// Firestore akan suggest otomatis saat pertama kali query
```

### 4. Image Optimization
```typescript
// Gunakan Cloudinary transformations
const optimizedUrl = baseUrl.replace("/upload/", "/upload/w_500,q_auto,f_auto/");
```

---

## Testing

### Test Firestore Connection
```typescript
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function testFirestore() {
  try {
    const snapshot = await getDocs(collection(db, "places"));
    console.log("✅ Firestore connected, documents:", snapshot.size);
  } catch (error) {
    console.error("❌ Firestore error:", error);
  }
}
```

### Test Cloudinary Upload
```typescript
async function testCloudinaryUpload() {
  const formData = new FormData();
  
  // Create test image
  const canvas = document.createElement("canvas");
  canvas.toBlob(blob => {
    formData.append("file", blob);
    
    fetch("/api/upload", {
      method: "POST",
      body: formData
    }).then(r => r.json()).then(data => {
      console.log("✅ Cloudinary upload successful:", data.url);
    });
  });
}
```

---

**Last Updated:** January 2026
