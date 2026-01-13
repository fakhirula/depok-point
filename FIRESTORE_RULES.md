# Firestore Rules Configuration

## Error: Missing or insufficient permissions

Jika Anda mendapat error **"Missing or insufficient permissions"**, berarti Firestore Rules tidak mengizinkan akses data.

## Solusi

### 1. Buka Firebase Console
- Pergi ke [Firebase Console](https://console.firebase.google.com)
- Pilih project Anda
- Navigasi ke **Firestore Database** → **Rules** tab

### 2. Update Rules dengan konfigurasi berikut:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write places
    match /places/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Allow authenticated users to read/write categories
    match /categories/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Allow everyone to read news
    match /news/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Publish Rules
- Klik tombol **Publish** untuk menyimpan dan mengaktifkan rules

### 4. Refresh Aplikasi
- Refresh halaman web aplikasi Anda
- Coba lagi untuk akses categories atau tambah lokasi baru

## Penjelasan Rules

| Path | Kondisi | Deskripsi |
|------|---------|-----------|
| `/places/*` | Authenticated | Admin bisa baca/tulis data lokasi |
| `/categories/*` | Authenticated | Admin bisa baca/tulis kategori |
| `/news/*` | Public read | Semua bisa baca berita, hanya auth bisa tulis |

## Mode Development (Testing Only)

Jika ingin development dengan akses unrestricted (⚠️ TIDAK UNTUK PRODUCTION):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **PERINGATAN**: Jangan gunakan mode ini di production! Collections akan public dan tidak aman.

## Troubleshooting

### 1. Rules sudah benar tapi masih error
- Clear browser cache (Ctrl+Shift+Delete)
- Logout dan login kembali
- Pastikan authenticated dengan email yang benar

### 2. Tidak bisa akses Firestore Rules
- Pastikan punya akses owner/editor di project Firebase
- Periksa permission di Firebase IAM

### 3. Collections tidak muncul
- Buat minimal 1 document di collection terlebih dahulu
- Buka Firestore Console dan klik "Start collection"
- Beri nama: `categories` atau `places`

## Testing Rules

Gunakan Firestore Console untuk test rules:

1. Buka **Firestore Database** → **Collections**
2. Coba create/update document
3. Lihat error message di console browser (F12)

Jika rules berhasil, tidak akan ada error "Missing or insufficient permissions".
