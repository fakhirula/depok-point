"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "🏠 Beranda", href: "/" },
    { label: "📍 Smart Location", href: "#smart-location" },
    { label: "📰 Berita", href: "#news" },
    { label: "ℹ️ Tentang", href: "#about" },
    { label: "📞 Kontak", href: "#contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-base-100 shadow-md border-b border-base-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center shadow-md p-1.5">
              <Image 
                src="/logo.svg" 
                alt="DepokPoint Logo" 
                width={40} 
                height={40}
                className="w-full h-full"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-base-content">Depok Point</h1>
              <p className="text-xs text-base-content/60">Sistem Informasi GIS</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Auth & Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="px-3 py-1.5 bg-base-200 rounded-lg">
                  <p className="text-xs text-base-content/70">Logged in</p>
                  <p className="text-sm font-semibold text-base-content truncate max-w-[150px]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    window.location.href = "/";
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <Link href="/admin/login" className="hidden sm:inline-flex btn btn-primary btn-sm">
                <span>🔐</span>
                Login Admin
              </Link>
            )}

            <Link
              href="/admin"
              className="hidden sm:inline-flex btn btn-outline btn-sm"
            >
              <span>🛠️</span>
              Admin Panel
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden btn btn-ghost btn-square btn-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-base-200 py-4 space-y-2 animate-fadeIn">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg text-sm font-medium text-base-content hover:bg-base-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="pt-2 border-t border-base-200 space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-2 bg-base-200 rounded-lg">
                    <p className="text-xs text-base-content/70">Logged in as</p>
                    <p className="text-sm font-semibold text-base-content truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      setMobileMenuOpen(false);
                      window.location.href = "/";
                    }}
                    className="w-full btn btn-ghost btn-sm justify-start"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className="block px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-content text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🔐 Login Admin
                </Link>
              )}
              
              <Link
                href="/admin"
                className="block px-4 py-2 rounded-lg text-sm font-medium border border-base-300 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                🛠️ Admin Panel
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
