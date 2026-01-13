"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Place, PlaceCategory } from "@/types/place";

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalPlaces: 0,
    totalCategories: 0,
    categoryCounts: {} as Record<string, number>,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Real-time listener for places
      const placesUnsubscribe = onSnapshot(
        collection(db, "places"),
        (placesSnapshot) => {
          const places = placesSnapshot.docs.map((doc) => doc.data()) as Place[];

          // Count by category
          const categoryCounts: Record<string, number> = {};
          places.forEach((place) => {
            const category = place.category as string;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });

          setStats({
            totalPlaces: places.length,
            totalCategories: Object.keys(categoryCounts).length,
            categoryCounts,
            lastUpdated: new Date(),
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error loading places:", error);
          setLoading(false);
        }
      );

      return () => placesUnsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      setLoading(false);
    }
  }, []);

  const topCategories = Object.entries(stats.categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Lokasi */}
      <div className="stat rounded-box bg-base-100 shadow hover-lift transition-smooth">
        <div className="stat-title text-xs sm:text-sm">Total Lokasi</div>
        <div className="stat-value text-2xl sm:text-3xl lg:text-4xl text-primary">{stats.totalPlaces}</div>
        <div className="stat-desc text-xs">Semua kategori</div>
      </div>

      {/* Total Kategori */}
      <div className="stat rounded-box bg-base-100 shadow hover-lift transition-smooth">
        <div className="stat-title text-xs sm:text-sm">Kategori</div>
        <div className="stat-value text-2xl sm:text-3xl lg:text-4xl text-success">{stats.totalCategories}</div>
        <div className="stat-desc text-xs">Jenis layanan</div>
      </div>

      {/* Rata-rata per Kategori */}
      <div className="stat rounded-box bg-base-100 shadow hover-lift transition-smooth">
        <div className="stat-title text-xs sm:text-sm">Rata-rata per Kategori</div>
        <div className="stat-value text-2xl sm:text-3xl lg:text-4xl text-warning">
          {stats.totalCategories > 0 ? (stats.totalPlaces / stats.totalCategories).toFixed(1) : 0}
        </div>
        <div className="stat-desc text-xs">Lokasi/kategori</div>
      </div>

      {/* Last Updated */}
      <div className="stat rounded-box bg-base-100 shadow hover-lift transition-smooth">
        <div className="stat-title text-xs sm:text-sm">Pembaruan Terakhir</div>
        <div className="stat-value text-lg sm:text-xl lg:text-2xl text-info">
          {stats.lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="stat-desc text-xs">
          {stats.lastUpdated.toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}

export function CategoryBreakdown() {
  const [categories, setCategories] = useState<
    Array<{ name: string; count: number; percentage: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for places
    const unsubscribe = onSnapshot(
      collection(db, "places"),
      (placesSnapshot) => {
        const places = placesSnapshot.docs.map((doc) => doc.data()) as Place[];

        const counts: Record<string, number> = {};
        places.forEach((place) => {
          const category = place.category as string;
          counts[category] = (counts[category] || 0) + 1;
        });

        const total = places.length;
        const data = Object.entries(counts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count);

        setCategories(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading categories:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="card bg-base-100 shadow hover-lift transition-smooth">
      <div className="card-body gap-4 p-4 sm:p-6">
        <h2 className="card-title text-base sm:text-lg">📊 Distribusi Lokasi per Kategori</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm sm:loading-md" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-sm text-base-content/60">
            Tidak ada data lokasi
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {categories.map((cat, index) => (
              <div key={cat.name} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex justify-between items-center text-xs sm:text-sm mb-1">
                  <span className="font-semibold truncate max-w-[60%]">{cat.name}</span>
                  <span className="badge badge-primary badge-sm">{cat.count}</span>
                </div>
                <progress
                  className="progress progress-primary w-full h-2 transition-all duration-300"
                  value={cat.percentage}
                  max="100"
                />
                <div className="text-xs text-base-content/60 text-right mt-0.5">
                  {cat.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
