# Firestore Rules Setup - Panduan Lengkap

Jika Anda melihat error **"Missing or insufficient permissions"**, ini berarti Firestore Rules perlu dikonfigurasi.

## 🚨 Quick Fix

### Step 1: Buka Firebase Console
1. Buka https://console.firebase.google.com/
2. Pilih project depok-point
3. Buka **Firestore Database** dari menu sidebar

### Step 2: Ke Tab Rules
Di halaman Firestore Database, klik tab **"Rules"** (biasanya di sebelah "Data")

### Step 3: Replace Rules dengan Code Ini

Ganti seluruh isi dengan code berikut:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write places
    match /places/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Allow authenticated users to read categories
    match /categories/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Step 4: Publish Rules
Klik tombol **"Publish"** (biasanya tombol biru di bawah editor)

### Step 5: Tunggu & Refresh
- Rules akan di-publish dalam beberapa detik
- Refresh browser (tekan F5) di aplikasi Anda
- Error seharusnya hilang ✅

---

## ❓ Penjelasan Rules

| Rule | Tujuan |
|------|--------|
| `allow read: if request.auth != null` | Siapa saja yang login bisa membaca data |
| `allow create, update, delete: if request.auth.token.admin == true` | Hanya admin yang bisa menambah/edit/hapus data |

---

## 🔧 Development vs Production

### Development Rules (Untuk Testing)
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
⚠️ **Jangan gunakan di production!** Ini sangat permisif.

### Production Rules (Recommended)
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /places/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    match /categories/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## 🚨 Troubleshooting

### Error masih muncul setelah publish rules?

1. **Refresh browser**
   - Tekan `Ctrl+F5` (bukan F5 biasa) untuk hard refresh
   - Atau buka DevTools (F12) → Application → Clear site data

2. **Cek Firebase Connection**
   - Buka browser console (F12) → Console tab
   - Cari error messages apa yang ditampilkan
   - Foto error dan share untuk bantuan lebih lanjut

3. **Pastikan User Sudah Login**
   - Di admin panel, check apakah sudah login
   - Cek di top-right ada nama user atau tidak

4. **Test dengan Development Rules**
   - Ganti dengan development rules (lihat di atas) untuk testing
   - Kalau berhasil, berarti masalah di permission logic
   - Kalau tetap error, berarti masalah di Firebase connection

---

## 📝 Custom Admin Setup (Optional)

Jika ingin set admin status via Firebase Console:

1. Buka **Authentication** → Users tab
2. Klik user yang ingin dijadikan admin
3. Klik **Custom claims** (edit icon)
4. Tambahkan:
```json
{
  "admin": true
}
```
5. Save

Sekarang user tersebut bisa create/update/delete data.

---

## ✅ Verified Commands

Untuk test rules via Firebase CLI:

```bash
firebase emulators:start  # Start emulator untuk testing
firebase deploy --only firestore:rules  # Deploy rules ke production
```

---

**Butuh bantuan lebih lanjut?** Hubungi developer atau lihat [Firebase Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
