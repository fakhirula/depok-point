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

  const menuGroups = [
    {
      title: "Dashboard",
      items: [
        { id: "overview", label: "Overview" },
      ],
    },
    {
      title: "Konten",
      items: [
        { id: "carousel", label: "Carousel Hero" },
        { id: "categories", label: "Manajemen Kategori" },
      ],
    },
    {
      title: "Data Lokasi",
      items: [
        { id: "add-location", label: "Tambah Lokasi" },
        { id: "manage-locations", label: "Kelola Lokasi" },
      ],
    },
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
      <div className="sticky top-0 z-20 flex items-center justify-between bg-base-100/95 backdrop-blur-md border-b border-base-200 p-4 lg:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.svg" 
            alt="DepokPoint Logo" 
            width={24} 
            height={24}
            className="w-6 h-6"
          />
          <h1 className="text-lg sm:text-xl font-bold">Admin Panel</h1>
        </div>
        <button
          className="btn btn-square btn-ghost btn-sm transition-all duration-300 hover:scale-110 hover:rotate-90"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 sm:w-72 bg-base-100 border-r border-base-200 overflow-y-auto transition-all duration-300 ease-in-out lg:static lg:translate-x-0 shadow-xl lg:shadow-none flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-base-200 bg-base-100 p-4 hidden lg:block">
          <Link href="/" className="flex items-center gap-3 hover:no-underline transition-all duration-300 hover:scale-105">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center shadow-md p-1.5 transition-transform duration-300 hover:rotate-6">
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
        <nav className="p-3 sm:p-4 space-y-4 sm:space-y-6 flex-1">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title} className="animate-fadeIn" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
              <p className="px-3 sm:px-4 py-2 text-xs font-semibold uppercase text-base-content/60 tracking-wider">
                {group.title}
              </p>
              <div className="space-y-1 sm:space-y-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as AdminTab)}
                    className={`w-full rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm font-medium transition-all duration-300 flex items-center gap-3 hover-lift ${
                      activeTab === item.id
                        ? "bg-primary text-primary-content shadow-md scale-105"
                        : "bg-base-200 text-base-content hover:bg-base-300 hover:scale-105"
                    }`}
                  >
                    <span className="text-base sm:text-lg">{iconMap[item.id]}</span>
                    <span className="text-xs sm:text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-2 sm:my-4 border-t border-base-200 mt-auto" />

        {/* User Section - Always at bottom */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
          <div className="rounded-lg bg-base-200 p-2.5 sm:p-3 transition-all duration-300 hover:bg-base-300">
            <p className="text-xs font-semibold text-base-content/70 uppercase">Logged in as</p>
            <p className="mt-1 break-all text-xs sm:text-sm font-semibold text-base-content">{user?.email}</p>
            <p className="mt-1 text-xs text-base-content/60">📧 Depok Point v1.0.0</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-error btn-sm w-full justify-start transition-all duration-300 hover:scale-105"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
