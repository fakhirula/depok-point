"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type AdminTab = "overview" | "add-location" | "manage-locations" | "categories" | "carousel";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const menuItems = [
    { id: "overview", label: "Overview" },
    { id: "add-location", label: "Tambah Lokasi" },
    { id: "manage-locations", label: "Kelola Lokasi" },
    { id: "categories", label: "Manajemen Kategori" },
    { id: "carousel", label: "Carousel Hero" },
  ] as const;

  const iconMap: Record<string, string> = {
    overview: "📊",
    "add-location": "➕",
    "manage-locations": "📍",
    categories: "📚",
    carousel: "🎠",
  };

  const handleTabChange = (tab: AdminTab) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-base-100 border-b border-base-200 p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.svg" 
            alt="DepokPoint Logo" 
            width={24} 
            height={24}
            className="w-6 h-6"
          />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <button
          className="btn btn-square btn-ghost btn-sm"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-10 w-64 bg-base-100 border-r border-base-200 overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-base-200 bg-base-100 p-4">
          <Link href="/" className="flex items-center gap-3 hover:no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center shadow-md p-1.5">
              <Image 
                src="/logo.svg" 
                alt="DepokPoint Logo" 
                width={40} 
                height={40}
                className="w-full h-full"
              />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin Panel</p>
              <p className="text-xs text-base-content/60">Depok Point</p>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as AdminTab)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-primary text-primary-content shadow-md"
                  : "bg-base-200 text-base-content hover:bg-base-300"
              }`}
            >
              <span className="text-lg">{iconMap[item.id]}</span> {item.label}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-base-200" />

        {/* User Section */}
        <div className="space-y-3 p-4">
          <div className="rounded-lg bg-base-200 p-3">
            <p className="text-xs font-semibold text-base-content/70 uppercase">Logged in as</p>
            <p className="mt-1 break-all text-sm font-semibold text-base-content">{user?.email}</p>
            <p className="mt-1 text-xs text-base-content/60">📧 Admin Account</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-error btn-sm w-full justify-start"
          >
            🚪 Logout
          </button>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-base-200" />
        <div className="space-y-2 p-4">
          <Link href="/" className="btn btn-outline btn-sm w-full justify-start">
            ← Kembali ke Home
          </Link>

          <div className="rounded-lg bg-base-200 p-3 text-xs">
            <p className="font-semibold text-base-content">💡 Tips</p>
            <ul className="mt-2 space-y-1 text-base-content/70">
              <li>• Klik peta untuk atur koordinat</li>
              <li>• Edit/hapus lokasi di kelola lokasi</li>
              <li>• Buat kategori custom baru</li>
            </ul>
          </div>

          <div className="rounded-lg bg-info/10 p-3 text-xs">
            <p className="font-semibold text-info">ℹ️ Versi</p>
            <p className="mt-1 text-base-content/60">Depok Point v1.0.0</p>
            <p className="text-base-content/60">Admin Dashboard</p>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-0 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
