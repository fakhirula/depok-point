# Role Management Implementation Guide

## 📋 Arsitektur Role System

### Role Types
- **admin**: Full access ke admin panel (CRUD locations, categories)
- **user**: Hanya dapat melihat map dan data (read-only)
- **guest**: User yang belum login

## 🔐 Implementasi Custom Claims (Recommended)

### 1. Setup Firebase Admin SDK (Backend)

Buat API endpoint untuk set custom claims:

```typescript
// app/api/admin/set-role/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin (satu kali saja)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  const { uid, role } = await request.json();
  
  // Set custom claims
  await admin.auth().setCustomUserClaims(uid, { role });
  
  return NextResponse.json({ success: true });
}
```

### 2. Update Auth Context

```typescript
// lib/auth-context.tsx
interface AuthContextType {
  user: User | null;
  role: 'admin' | 'user' | null;  // ← tambah role
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Dalam useEffect:
const unsubscribe = onAuthStateChanged(auth, async (user) => {
  setUser(user);
  
  if (user) {
    // Get token result untuk ambil custom claims
    const tokenResult = await user.getIdTokenResult();
    setRole(tokenResult.claims.role as 'admin' | 'user');
  } else {
    setRole(null);
  }
  
  setLoading(false);
});
```

### 3. Environment Variables

Tambahkan ke `.env.local`:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🎯 Implementasi Firestore (Simpler Alternative)

Jika tidak ingin setup Admin SDK, gunakan Firestore collection untuk menyimpan roles:

### 1. Struktur Firestore

```
users/
  {uid}/
    email: "user@example.com"
    role: "admin" | "user"
    createdAt: timestamp
```

### 2. Update Auth Context

```typescript
// lib/auth-context.tsx
import { doc, getDoc } from 'firebase/firestore';

const unsubscribe = onAuthStateChanged(auth, async (user) => {
  setUser(user);
  
  if (user) {
    // Get role dari Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    setRole(userData?.role || 'user');
  } else {
    setRole(null);
  }
  
  setLoading(false);
});
```

### 3. Create User Document saat Register

```typescript
// Saat user baru register:
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const handleRegister = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Buat document user di Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email,
    role: 'user', // default role
    createdAt: new Date().toISOString(),
  });
};
```

## 🛡️ Route Protection

Update AdminProtect untuk check role:

```typescript
// components/admin/AdminProtect.tsx
export function AdminProtect({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, role, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
```

## 📝 Manual Role Assignment

Cara mudah untuk testing:

### Via Firebase Console:
1. Buka Firestore
2. Buat collection `users`
3. Document ID = user UID
4. Field: `role` = "admin" atau "user"

### Via Script (one-time):
```typescript
// scripts/assign-admin.ts
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const assignAdminRole = async (userEmail: string) => {
  // Get user dari email
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', userEmail));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    await setDoc(userDoc.ref, { role: 'admin' }, { merge: true });
    console.log('Admin role assigned!');
  }
};
```

## 🎨 UI Conditional Rendering

```typescript
// Tampilkan menu berbeda berdasarkan role:
const { role } = useAuth();

{role === 'admin' && (
  <Link href="/admin">Admin Panel</Link>
)}

{role === 'user' && (
  <Link href="/profile">My Profile</Link>
)}
```

## ⚡ Recommended Approach

Untuk proyek Anda, saya sarankan **Firestore-based role** karena:
- ✅ Lebih simple, tidak perlu Admin SDK
- ✅ Mudah update role via Firebase Console
- ✅ Cukup untuk use case Anda
- ✅ Tidak perlu setup private key di environment

Custom Claims lebih cocok untuk:
- Skala besar dengan ribuan users
- Security requirements tinggi
- Need offline token validation
