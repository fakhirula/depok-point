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
    <nav className="sticky top-0 z-50 bg-base-100/95 backdrop-blur-md shadow-md border-b border-base-200 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 hover:scale-105">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center shadow-md p-1.5 transition-transform duration-300 hover:rotate-6">
              <Image 
                src="/logo.svg" 
                alt="DepokPoint Logo" 
                width={40} 
                height={40}
                className="w-full h-full"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-base-content transition-colors">Depok Point</h1>
              <p className="text-xs text-base-content/60">Sistem Informasi GIS</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-base-content hover:bg-base-200 transition-all duration-300 hover:scale-105 hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Auth & Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Dropdown for logged in user */}
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2 transition-all duration-300 hover:scale-105 hover:bg-base-200">
                    <div className="flex items-center gap-2">
                      <div className="text-left">
                        <p className="text-xs text-base-content/70">Logged in</p>
                        <p className="text-sm font-semibold text-base-content truncate max-w-[120px]">
                          {user.email}
                        </p>
                      </div>
                      <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200 mt-2 animate-fadeInScale">
                    <li>
                      <Link href="/admin" className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
                        <span>🛠️</span>
                        <span>Admin Panel</span>
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={async () => {
                          await logout();
                          window.location.href = "/";
                        }}
                        className="flex items-center gap-2 text-error transition-all duration-300 hover:scale-105"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <Link href="/admin/login" className="hidden sm:inline-flex btn btn-primary btn-sm transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <span>🔐</span>
                  Login Admin
                </Link>
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex btn btn-outline btn-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <span>🛠️</span>
                  Admin Panel
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden btn btn-ghost btn-square btn-sm transition-all duration-300 hover:scale-110 hover:rotate-90"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-base-200 py-4 space-y-2 animate-fadeInUp">
            {menuItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg text-sm font-medium text-base-content hover:bg-base-200 transition-all duration-300 hover:translate-x-2 hover:scale-105"
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="pt-2 border-t border-base-200 space-y-2 animate-fadeIn animate-delay-300">
              {user ? (
                <>
                  <div className="px-4 py-2 bg-base-200 rounded-lg transition-all duration-300 hover:bg-base-300">
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
                    className="w-full btn btn-ghost btn-sm justify-start transition-all duration-300 hover:translate-x-2 hover:bg-error/10 hover:text-error"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className="block px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-content text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🔐 Login Admin
                </Link>
              )}
              
              <Link
                href="/admin"
                className="block px-4 py-2 rounded-lg text-sm font-medium border border-base-300 text-center transition-all duration-300 hover:scale-105 hover:bg-base-200 hover:shadow-md"
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
