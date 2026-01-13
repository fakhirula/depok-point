"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error("Email dan password harus diisi");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Format email tidak valid");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      await login(email, password);
      router.push("/admin");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login gagal";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-primary to-primary-focus rounded-2xl mb-4 shadow-lg">
            <span className="text-5xl block">🛠️</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-focus bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-base-content/60 mt-3 text-lg">Depok Point - Sistem Informasi GIS</p>
        </div>

        {/* Login Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body gap-6">
            <h2 className="card-title text-2xl justify-center text-base-content">Masuk ke Sistem Admin</h2>

            {error && (
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m8-8a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-base-content">
                  📧 Alamat Email
                </label>
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-lg text-base-content placeholder-base-content/50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-base-content">
                  🔐 Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi Anda"
                    className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-lg text-base-content placeholder-base-content/50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:opacity-70 transition-opacity disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? "👁️" : "🔒"}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="checkbox checkbox-sm checkbox-primary"
                  disabled={loading}
                />
                <label htmlFor="remember" className="text-sm text-base-content/70 cursor-pointer">
                  Ingat saya di perangkat ini
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-4 py-3 bg-primary text-primary-content font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Sedang Login...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Masuk ke Admin Panel
                  </>
                )}
              </button>
            </form>

            <div className="divider my-2" />

            {/* Info Section */}
            <div className="bg-gradient-to-r from-info/10 to-info/5 border border-info/20 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-info flex items-center gap-2">
                <span>ℹ️</span> Informasi Login
              </p>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Hubungi administrator untuk mendapatkan akun login dengan email dan password yang aman.
              </p>
              <p className="text-xs text-base-content/50 pt-2">
                💡 Pastikan password Anda minimal 6 karakter dan format email valid.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base-content/70 hover:text-primary transition-colors duration-200">
            <span>←</span>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
