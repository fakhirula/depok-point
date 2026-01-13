"use client";

import { useState } from "react";
import AdminTabContent from "@/components/admin/AdminTabContent";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { LocationManager } from "@/components/admin/LocationManager";
import { DashboardStats, CategoryBreakdown } from "@/components/admin/DashboardStats";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminProtect } from "@/components/admin/AdminProtect";
import { CarouselManager } from "@/components/admin/CarouselManager";

type AdminTab = "overview" | "add-location" | "manage-locations" | "categories" | "carousel";

function AdminPageContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-200">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 w-full lg:w-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-base-200 bg-base-100 shadow-sm">
          <div className="px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {activeTab === "overview" && "📊 Dashboard Overview"}
                {activeTab === "add-location" && "➕ Tambah Lokasi Baru"}
                {activeTab === "manage-locations" && "📍 Kelola Lokasi"}
                {activeTab === "categories" && "📚 Manajemen Kategori"}
                {activeTab === "carousel" && "🎠 Manajemen Carousel"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-base-content/70">
                {activeTab === "overview" && "Lihat statistik dan ringkasan data Depok Point"}
                {activeTab === "add-location" && "Tambahkan lokasi penting baru ke sistem"}
                {activeTab === "manage-locations" && "Edit, hapus, atau perbarui data lokasi"}
                {activeTab === "categories" && "Kelola kategori dan tambahkan kategori baru"}
                {activeTab === "carousel" && "Kelola slide carousel di halaman utama"}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <DashboardStats />
              <CategoryBreakdown />
            </div>
          )}

          {/* Add Location Tab */}
          {activeTab === "add-location" && <AdminTabContent />}

          {/* Manage Locations Tab */}
          {activeTab === "manage-locations" && <LocationManager />}

          {/* Categories Tab */}
          {activeTab === "categories" && <CategoryManager />}

          {/* Carousel Tab */}
          {activeTab === "carousel" && <CarouselManager />}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProtect>
      <AdminPageContent />
    </AdminProtect>
  );
}
