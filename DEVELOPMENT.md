# Panduan Pengembangan Depok Point

## Quick Start Checklist

- [x] Dependencies terinstall (`npm install`)
- [x] Environment variables dikonfigurasi (`.env.local`)
- [x] Development server berjalan (`npm run dev`)
- [x] Firebase Firestore collection "places" siap
- [x] Cloudinary folder "depok-point" siap
- [x] Tailwind CSS + Daisy UI dikonfigurasi
- [x] Leaflet/React-Leaflet siap untuk peta

## Fitur yang Sudah Diimplementasi

### 1. **Peta Interaktif (MapView.tsx)**
```tsx
- Leaflet + React-Leaflet integration
- OpenStreetMap tiles
- CircleMarker untuk setiap lokasi
- Popup dengan informasi detail
- Event handler untuk selection
- Color coding untuk selected/unselected
```

### 2. **Form Penambahan Lokasi (page.tsx)**
```tsx
- Input: Nama, Kategori, Alamat
- Input: Koordinat (Latitude/Longitude)
- Input: Telepon, Deskripsi
- File upload preview untuk gambar
- Form validation
- Loading state saat submit
```

### 3. **Upload ke Cloudinary (/api/upload)**
```ts
- Streaming file upload
- Folder organization (depok-point/)
- Error handling
- JSON response dengan URL
```

### 4. **Firestore Integration**
```tsx
- Real-time listener dengan onSnapshot
- Collection: places
- OrderBy: name (abjad)
- Auto-sync saat ada perubahan
```

### 5. **Search & Filter**
```tsx
- Search by name (case-insensitive)
- Filter by category
- Live filtering dengan useMemo
- Statistics display (total, per category)
```

## File yang Penting Diperhatikan

| File | Fungsi | Status |
|------|--------|--------|
| `app/page.tsx` | Main component dengan form & list | ✅ Lengkap |
| `components/MapView.tsx` | Leaflet map display | ✅ Lengkap |
| `app/api/upload/route.ts` | Cloudinary upload endpoint | ✅ Lengkap |
| `lib/firebase.ts` | Firebase config | ✅ Lengkap |
| `types/place.ts` | Type definitions | ✅ Lengkap |
| `tailwind.config.js` | Tailwind + Daisy UI config | ✅ Lengkap |
| `app/globals.css` | Global styles | ✅ Lengkap |

## Menambahkan Fitur Baru

### Contoh: Tambah Filter "Jarak dari Pusat Kota"

1. **Update type di `types/place.ts`:**
```typescript
export type Place = {
  // ... existing fields
  distanceFromCenter?: number; // km
};
```

2. **Update form di `app/page.tsx`:**
```typescript
// Di form state
const [form, setForm] = useState<FormState>({
  // ... existing fields
  distanceFromCenter: "",
});

// Di JSX
<input type="number" placeholder="Jarak (km)" />
```

3. **Update Firestore save:**
```typescript
await addDoc(collection(db, "places"), {
  // ... existing fields
  distanceFromCenter: Number(form.distanceFromCenter),
});
```

### Contoh: Tambah Rating/Review Feature

1. Create `lib/reviews.ts`:
```typescript
import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

export async function addReview(
  placeId: string,
  rating: number,
  comment: string
) {
  return addDoc(collection(db, `places/${placeId}/reviews`), {
    rating,
    comment,
    createdAt: new Date().toISOString(),
  });
}
```

2. Use di component:
```typescript
import { addReview } from "@/lib/reviews";

// Di event handler
await addReview(place.id, rating, comment);
```

## Environment Variables

```env
# Firebase (Public - untuk client)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Cloudinary (Public - untuk client upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# Cloudinary (Private - untuk server-side)
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

**CATATAN:** Variabel dengan prefix `NEXT_PUBLIC_` akan visible di client (safe untuk public keys). Tanpa prefix hanya accessible di server.

## Debugging Tips

### 1. Map tidak tampil
```bash
# Check di browser console
console.log("Map container:", document.querySelector('.leaflet-container'));

# Cek di DevTools > Elements > search "leaflet"
```

### 2. Firestore tidak sinkron
```typescript
// Di console browser
import { getFirestore } from "firebase/firestore";
const db = getFirestore();
console.log(db);
```

### 3. Cloudinary upload gagal
```typescript
// Di /api/upload route
console.log("Cloudinary config:", {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "***" : "MISSING",
});
```

## Performance Optimization

### 1. Map Rendering
```typescript
// Sudah dioptimasi dengan dynamic import + ssr: false
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false, // Tidak render di server
});
```

### 2. Filter Memoization
```typescript
// Sudah menggunakan useMemo
const filteredPlaces = useMemo(() => {
  return places.filter(...);
}, [places, selectedCategory, search]);
```

### 3. Image Optimization
```typescript
// Perhatikan: Menggunakan native img tag (bukan Next.js Image)
// Karena external URL dari Cloudinary
<img src={place.imageUrl} alt={place.name} />
```

## Testing Manual

### Skenario 1: Tambah Lokasi
1. Isi form di sidebar kanan
2. Pilih kategori
3. Input koordinat (atau gunakan default)
4. Upload gambar (opsional)
5. Klik "Simpan ke Firestore"
6. Verifikasi data muncul di peta dan list

### Skenario 2: Filter & Search
1. Input di search box
2. Filter by category
3. Verifikasi list dan peta terupdate
4. Verifikasi statistik berubah

### Skenario 3: Interaksi Peta
1. Klik marker di peta
2. Verifikasi warna berubah jadi biru
3. Klik popup untuk info
4. Klik "Fokus" button di card

## Deployment Checklist

- [ ] Build test: `npm run build`
- [ ] Check production mode: `npm start`
- [ ] Verify env vars di production
- [ ] Test Firestore production rules
- [ ] Test Cloudinary production folder
- [ ] Setup custom domain (jika needed)
- [ ] Configure CORS untuk Cloudinary
- [ ] Setup analytics (Google Analytics)
- [ ] Backup Firestore regularly

## Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Leaflet Docs](https://leafletjs.com/)
- [Daisy UI](https://daisyui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Last Updated:** January 2026
