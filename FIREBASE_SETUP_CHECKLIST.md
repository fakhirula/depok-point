# Firebase Setup Checklist - Depok Point

Ikuti checklist ini untuk memastikan semua konfigurasi Firebase sudah benar.

## ✅ Step 1: Firestore Database Setup

- [ ] Firestore Database sudah dibuat di Firebase Console
  - Buka https://console.firebase.google.com/
  - Pilih project depok-point
  - Buka **Firestore Database**
  - Klik **Create Database** jika belum ada

## ✅ Step 2: Firestore Collections

Pastikan collections berikut sudah ada:

- [ ] Collection `categories` sudah dibuat
- [ ] Collection `places` sudah dibuat
- [ ] Collection `users` sudah dibuat (opsional untuk custom admin)

Cara membuat collection (jika belum ada):
1. Di Firestore Database, klik **+ Create Collection**
2. Masukkan nama: `categories`
3. Klik **Next**
4. Klik **Save** (atau tambahkan document jika diminta)
5. Ulangi untuk `places`

## ✅ Step 3: Firestore Rules Configuration

**PENTING:** Ini adalah langkah paling kritis!

1. Buka Firebase Console → Firestore Database
2. Klik tab **Rules**
3. Ganti isi rules dengan code di bawah:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public: Siapa saja (authenticated) bisa baca kategori dan tempat
    match /categories/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /places/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }

    // Admin: Custom admin claims
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
    }
  }
}
```

4. Klik **Publish** (tombol biru)
5. Tunggu hingga rules selesai dipublish

- [ ] Firestore Rules sudah dipublish

## ✅ Step 4: Firebase Authentication Setup

- [ ] Authentication sudah diaktifkan
  - Buka Firebase Console → Authentication
  - Klik **Set up sign-in method**
  - Aktifkan **Email/Password**

- [ ] Test user sudah dibuat untuk testing
  - Buka Authentication → Users tab
  - Klik **Add User**
  - Contoh: email: `test@depok.com`, password: `Test123!`

## ✅ Step 5: Firebase Configuration di Project

Cek file `lib/firebase.ts` sudah memiliki config yang benar:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

- [ ] `lib/firebase.ts` sudah memiliki konfigurasi yang benar
- [ ] `.env.local` memiliki Firebase config (jika menggunakan env vars)

## ✅ Step 6: Testing di Aplikasi

Setelah semua setup selesai, test dengan:

1. Buka aplikasi: http://localhost:3000/admin
2. Login dengan test user
3. Buka tab **Manajemen Kategori**
4. Pastikan tidak ada error loading kategori
5. Coba tambah kategori baru
6. Cek di Firestore Console apakah data masuk ke collection `categories`

Hasil yang diharapkan:
- ✅ Daftar kategori kosong atau menampilkan kategori yang ada
- ✅ Tombol "Kategori Baru" berfungsi
- ✅ Bisa tambah kategori baru
- ✅ Data muncul di Firestore Console

## ❌ Troubleshooting

### Error: "Missing or insufficient permissions"

**Solusi:**
1. Pastikan Firestore Rules sudah **Publish** (bukan hanya Save)
2. Hard refresh browser: Ctrl+F5
3. Logout dan login ulang

### Error: "Database not found"

**Solusi:**
1. Pastikan Firestore Database sudah dibuat di Firebase Console
2. Pastikan collection `categories` dan `places` sudah ada

### Kategori tidak muncul padahal sudah tambah

**Solusi:**
1. Cek di Firebase Console → Firestore → collections → categories
2. Pastikan data sudah masuk
3. Cek browser console (F12) untuk detail error
4. Cek bahwa user sudah login

### Error di browser console: "Firebase config not found"

**Solusi:**
1. Pastikan `lib/firebase.ts` memiliki config yang lengkap
2. Pastikan semua field di config sudah diisi (apiKey, authDomain, projectId, dll)
3. Cek `.env.local` jika menggunakan env variables

## 📞 Support

Jika masih ada masalah:
1. Cek error di browser console (F12 → Console tab)
2. Screenshot error message
3. Hubungi developer dengan screenshot error + browser console output

---

**Last Updated:** January 13, 2026
