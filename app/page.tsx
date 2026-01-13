"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Place, PlaceCategory } from "@/types/place";
import { CarouselSlide } from "@/types/carousel";
import { Navbar } from "@/components/Navbar";
import { HeroCarousel } from "@/components/HeroCarousel";

const MapView = dynamic(() => import("@/components/MapView").then((mod) => mod.MapView), {
  ssr: false,
});

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

const defaultCenter = { lat: -6.4025, lng: 106.7942 };

type FormState = {
  name: string;
  category: PlaceCategory | "Lainnya";
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  imageFile?: File | null;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("id-ID");
}

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "Rumah Sakit",
    address: "",
    latitude: defaultCenter.lat.toString(),
    longitude: defaultCenter.lng.toString(),
    phone: "",
    description: "",
    imageFile: null,
  });

  // Load categories from Firestore
  useEffect(() => {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextCategories: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "",
          icon: doc.data().icon || "📍",
          color: doc.data().color || "#2563eb",
          description: doc.data().description || "",
        }));
        setCategories(nextCategories);
        setCategoriesLoading(false);
      },
      (err) => {
        console.error("Error loading categories:", err);
        setCategoriesLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Load carousel slides from Firestore
  useEffect(() => {
    const carouselRef = collection(db, "carouselSlides");
    const q = query(carouselRef, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextSlides: CarouselSlide[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            title: doc.data().title || "",
            description: doc.data().description || "",
            imageUrl: doc.data().imageUrl || "",
            order: doc.data().order || 0,
            isActive: doc.data().isActive !== false,
            createdAt: doc.data().createdAt || new Date().toISOString(),
            updatedAt: doc.data().updatedAt || new Date().toISOString(),
          }))
          .filter((slide) => slide.isActive);
        setCarouselSlides(nextSlides);
        setCarouselLoading(false);
      },
      (err) => {
        console.error("Error loading carousel slides:", err);
        setCarouselLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Load places from Firestore
  useEffect(() => {
    const placesRef = collection(db, "places");
    const q = query(placesRef, orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextPlaces: Place[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const latitude = typeof data.latitude === "number" ? data.latitude : Number(data.latitude);
          const longitude = typeof data.longitude === "number" ? data.longitude : Number(data.longitude);

          return {
            id: doc.id,
            name: data.name || "Tanpa nama",
            category: (data.category as PlaceCategory) || "Lainnya",
            address: data.address || "",
            phone: data.phone || "",
            description: data.description || "",
            latitude: Number.isFinite(latitude) ? latitude : defaultCenter.lat,
            longitude: Number.isFinite(longitude) ? longitude : defaultCenter.lng,
            imageUrl: data.imageUrl || "",
            updatedAt:
              typeof data.updatedAt?.toDate === "function"
                ? data.updatedAt.toDate().toISOString()
                : data.updatedAt || null,
          };
        });

        setPlaces(nextPlaces);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Gagal memuat data. Pastikan Firestore sudah terkonfigurasi.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchCategory = selectedCategory === "all" || place.category === selectedCategory;
      const searchLower = search.toLowerCase();
      const matchSearch = 
        place.name.toLowerCase().includes(searchLower) ||
        place.category.toLowerCase().includes(searchLower) ||
        (place.address?.toLowerCase().includes(searchLower) ?? false) ||
        (place.phone?.toLowerCase().includes(searchLower) ?? false);
      return matchCategory && matchSearch;
    });
  }, [places, selectedCategory, search]);

  const stats = useMemo(() => {
    const total = places.length;
    const hospitalCount = places.filter((p) => p.category === "Rumah Sakit").length;
    const policeCount = places.filter((p) => p.category === "Kantor Polisi").length;
    const damkarCount = places.filter((p) => p.category === "Pemadam Kebakaran").length;
    const schoolCount = places.filter((p) => p.category === "Sekolah").length;
    const transportCount = places.filter((p) => p.category === "Transportasi").length;
    const adminCount = places.filter((p) => p.category === "Kantor Pemerintahan").length;
    return {
      total,
      hospitalCount,
      policeCount,
      damkarCount,
      schoolCount,
      transportCount,
      adminCount,
      selectedCount: filteredPlaces.length,
    };
  }, [places, filteredPlaces]);

  const resetForm = () => {
    setForm({
      name: "",
      category: "Rumah Sakit",
      address: "",
      latitude: defaultCenter.lat.toString(),
      longitude: defaultCenter.lng.toString(),
      phone: "",
      description: "",
      imageFile: null,
    });
    setPreviewUrl(null);
  };

  const handleFileChange = (file: File | null) => {
    setForm((prev) => ({ ...prev, imageFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadImage = async (file: File) => {
    const data = new FormData();
    data.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      throw new Error("Gagal mengunggah gambar ke Cloudinary");
    }

    const body = await res.json();
    return body.url as string;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Koordinat harus berupa angka");
      }

      let imageUrl = "";
      if (form.imageFile) {
        imageUrl = await uploadImage(form.imageFile);
      }

      await addDoc(collection(db, "places"), {
        name: form.name,
        category: form.category,
        address: form.address,
        latitude,
        longitude,
        phone: form.phone,
        description: form.description,
        imageUrl,
        updatedAt: new Date().toISOString(),
      });

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="bg-base-200">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
          <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 items-center">
              
              {/* Text Content - Desktop: left column, Mobile: split layout */}
              <div className="space-y-6 order-1 animate-slideInLeft">
                {/* Badge - always on top */}
                <div className="inline-block">
                  <div className="flex items-center gap-2 badge badge-primary badge-lg hover-scale">
                    <Image 
                      src="/logo.svg" 
                      alt="DepokPoint Logo" 
                      width={20} 
                      height={20}
                      className="w-5 h-5"
                    />
                    <span>Depok Point</span>
                  </div>
                </div>

                {/* Carousel - Shows here on mobile/tablet, hidden on desktop */}
                <div className="lg:hidden animate-fadeInScale">
                  <HeroCarousel slides={carouselSlides} loading={carouselLoading} />
                </div>

                {/* Heading and rest of content */}
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Sistem Informasi <span className="text-primary">GIS</span> Kota Depok
                </h1>
                <p className="text-lg text-base-content/80 leading-relaxed">
                  Temukan lokasi penting di Kota Depok dengan mudah. Rumah sakit, kantor polisi, pemadam kebakaran, puskesmas, dan layanan publik lainnya dalam satu peta interaktif.
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <a href="#smart-location" className="btn btn-primary btn-lg hover-lift transition-smooth">
                    📍 Jelajahi Peta
                  </a>
                  <a href="#about" className="btn btn-outline btn-lg hover-lift transition-smooth">
                    ℹ️ Pelajari Lebih Lanjut
                  </a>
                </div>
                <div className="flex flex-wrap gap-3 pt-6">
                  <div className="badge badge-outline badge-lg animate-fadeIn animate-delay-100 hover-scale">🔥 Realtime Updates</div>
                  <div className="badge badge-outline badge-lg animate-fadeIn animate-delay-200 hover-scale">☁️ Cloud Storage</div>
                  <div className="badge badge-outline badge-lg animate-fadeIn animate-delay-300 hover-scale">🗺️ OpenStreetMap</div>
                </div>
              </div>

              {/* Carousel - Shows here on desktop only */}
              <div className="hidden lg:block order-2 animate-slideInRight">
                <HeroCarousel slides={carouselSlides} loading={carouselLoading} />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Carousel */}
        <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Carousel Container */}
            <div 
              className="flex overflow-x-auto gap-6 pb-4 scroll-smooth"
              style={{
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              <style>{`
                div[style*="scroll-smooth"]::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {/* Stats Items */}
              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-primary text-4xl">📍</div>
                  <div className="stat-title">Total Lokasi</div>
                  <div className="stat-value text-primary">{stats.total}</div>
                  <div className="stat-desc">Semua kategori tersedia</div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-secondary text-4xl">🏥</div>
                  <div className="stat-title">Rumah Sakit</div>
                  <div className="stat-value text-secondary">{stats.hospitalCount}</div>
                  <div className="stat-desc">Fasilitas kesehatan</div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-accent text-4xl">👮</div>
                  <div className="stat-title">Kantor Polisi</div>
                  <div className="stat-value text-accent">{stats.policeCount}</div>
                  <div className="stat-desc">Keamanan & layanan</div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-warning text-4xl">🔥</div>
                  <div className="stat-title">Pemadam Kebakaran</div>
                  <div className="stat-value text-warning">{stats.damkarCount}</div>
                  <div className="stat-desc">Penanggulangan bencana</div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-info text-4xl">🎓</div>
                  <div className="stat-title">Sekolah</div>
                  <div className="stat-value text-info">{stats.schoolCount}</div>
                  <div className="stat-desc">Pendidikan</div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-success text-4xl">🚌</div>
                  <div className="stat-title">Transportasi</div>
                  <div className="stat-value text-success">{stats.transportCount}</div>
                  <div className="stat-desc">Mobilitas umum</div>
                </div>
              </div>

              <div className="flex-shrink-0 w-80 scroll-snap-start">
                <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300 h-full hover-lift transition-smooth">
                  <div className="stat-figure text-error text-4xl">🏛️</div>
                  <div className="stat-title">Kantor Pemerintahan</div>
                  <div className="stat-value text-error">{stats.adminCount}</div>
                  <div className="stat-desc">Administrasi daerah</div>
                </div>
              </div>
            </div>

            {/* Gradient Overlays untuk Visual Cue */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-base-200 to-transparent pointer-events-none z-10 rounded-2xl"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-base-200 to-transparent pointer-events-none z-10 rounded-2xl"></div>
          </div>
        </section>

        {/* Smart Location Section */}
        <section id="smart-location" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">📍 Smart Location Finder</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Cari dan temukan lokasi penting di Kota Depok dengan sistem pencarian pintar
            </p>
          </div>

          {/* Search Controls */}
          <div className="mb-6 space-y-4 animate-fadeIn">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold">🔍 Cari Lokasi</label>
                <input
                  type="text"
                  placeholder="Rumah sakit, kantor polisi, sekolah..."
                  className="input input-bordered input-sm w-full transition-smooth focus:scale-[1.02]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">📚 Kategori</label>
                <select
                  className="select select-bordered select-sm w-full transition-smooth focus:scale-[1.02]"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={categoriesLoading}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">📊 Hasil</label>
                <div className="input input-bordered input-sm bg-base-200 flex items-center justify-center font-semibold text-primary w-full">
                  {filteredPlaces.length} Lokasi
                </div>
              </div>
            </div>

            {error ? (
              <div className="alert alert-error flex items-center gap-2 text-sm">
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
            {/* Column 1: Map */}
            <div className="card bg-base-100 shadow-lg border border-base-300 lg:col-span-8">
              <div className="card-body p-0 overflow-hidden rounded-2xl">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary" aria-label="Memuat" />
                  </div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="rounded-box border border-dashed border-base-300 p-6 text-center text-sm h-[480px] flex items-center justify-center">
                    Belum ada data untuk filter ini. Tambahkan lokasi baru di admin.
                  </div>
                ) : (
                  <MapView places={filteredPlaces} selectedId={selectedId} onSelect={setSelectedId} />
                )}
              </div>
            </div>

            {/* Column 2: Detail Information */}
            <div className="card bg-base-100 shadow-lg border border-base-300 lg:col-span-4">
              <div className="card-body space-y-4">
                <h3 className="card-title text-lg">📋 Detail Lokasi</h3>
                
                {selectedId && filteredPlaces.find(p => p.id === selectedId) ? (
                  (() => {
                    const place = filteredPlaces.find(p => p.id === selectedId)!;
                    return (
                      <form className="space-y-5">
                        {/* Row 1: Nama Lokasi & Kategori */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control w-full">
                            <label className="label pb-2">
                              <span className="label-text font-semibold">Nama Lokasi</span>
                            </label>
                            <input
                              type="text"
                              className="input input-bordered input-sm bg-base-200 focus:outline-none w-full"
                              value={place.name}
                              readOnly
                            />
                          </div>

                          <div className="form-control w-full">
                            <label className="label pb-2">
                              <span className="label-text font-semibold">Kategori</span>
                            </label>
                            <input
                              type="text"
                              className="input input-bordered input-sm bg-base-200 focus:outline-none w-full"
                              value={place.category}
                              readOnly
                            />
                          </div>
                        </div>

                        {/* Row 2: Alamat */}
                        <div className="form-control w-full">
                          <label className="label pb-2">
                            <span className="label-text font-semibold">Alamat</span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered textarea-sm bg-base-200 focus:outline-none resize-none w-full"
                            rows={2}
                            value={place.address || "-"}
                            readOnly
                          />
                        </div>

                        {/* Row 3: Nomor Telepon & Lat/Lon */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control w-full">
                            <label className="label pb-2">
                              <span className="label-text font-semibold">Nomor Telepon</span>
                            </label>
                            <input
                              type="text"
                              className="input input-bordered input-sm bg-base-200 focus:outline-none w-full"
                              value={place.phone || "-"}
                              readOnly
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="form-control w-full">
                              <label className="label pb-2">
                                <span className="label-text font-semibold text-xs">Latitude</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-xs bg-base-200 focus:outline-none font-mono w-full"
                                value={place.latitude.toFixed(6)}
                                readOnly
                              />
                            </div>
                            <div className="form-control w-full">
                              <label className="label pb-2">
                                <span className="label-text font-semibold text-xs">Longitude</span>
                              </label>
                              <input
                                type="text"
                                className="input input-bordered input-xs bg-base-200 focus:outline-none font-mono w-full"
                                value={place.longitude.toFixed(6)}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 4: Gambar */}
                        {place.imageUrl && (
                          <div className="form-control w-full">
                            <label className="label pb-2">
                              <span className="label-text font-semibold">Gambar</span>
                            </label>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={place.imageUrl}
                              alt={place.name}
                              className="w-full h-32 object-cover rounded-box border border-base-300"
                            />
                          </div>
                        )}

                        {/* Row 5: Updated Info */}
                        <div className="text-xs text-base-content/60 pt-2 border-t border-base-300">
                          Diperbarui: {place.updatedAt ? formatDate(place.updatedAt) : "Belum pernah diperbarui"}
                        </div>
                      </form>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center py-12 text-center">
                    <div>
                      <p className="text-lg font-semibold mb-2">👈 Klik Marker di Peta</p>
                      <p className="text-sm text-base-content/60">
                        Pilih lokasi di peta untuk melihat informasi detail
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      {/* News Section */}
      <section id="news" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">📰 Berita & Update</h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Informasi terbaru seputar layanan publik dan fasilitas di Kota Depok
          </p>
        </div>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card bg-base-100 shadow-xl border border-base-300 hover-lift transition-smooth">
            <figure className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl">🏥</span>
            </figure>
            <div className="card-body">
              <div className="badge badge-primary badge-sm">Kesehatan</div>
              <h3 className="card-title text-lg">Rumah Sakit Baru Dibuka</h3>
              <p className="text-sm text-base-content/70">
                RS Bhakti Husada membuka layanan 24 jam untuk masyarakat Depok dengan fasilitas lengkap dan modern.
              </p>
              <div className="card-actions justify-between items-center mt-2">
                <span className="text-xs text-base-content/50">2 hari lalu</span>
                <button className="btn btn-primary btn-sm hover-lift transition-smooth">Baca Selengkapnya</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300 hover-lift transition-smooth">
            <figure className="h-48 bg-gradient-to-br from-accent/20 to-warning/20 flex items-center justify-center">
              <span className="text-6xl">👮</span>
            </figure>
            <div className="card-body">
              <div className="badge badge-accent badge-sm">Keamanan</div>
              <h3 className="card-title text-lg">Aplikasi Lapor Polisi Online</h3>
              <p className="text-sm text-base-content/70">
                Kini warga Depok bisa melapor secara online melalui aplikasi resmi Polres Depok untuk kemudahan layanan.
              </p>
              <div className="card-actions justify-between items-center mt-2">
                <span className="text-xs text-base-content/50">5 hari lalu</span>
                <button className="btn btn-accent btn-sm hover-lift transition-smooth">Baca Selengkapnya</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300 hover-lift transition-smooth">
            <figure className="h-48 bg-gradient-to-br from-warning/20 to-error/20 flex items-center justify-center">
              <span className="text-6xl">🔥</span>
            </figure>
            <div className="card-body">
              <div className="badge badge-warning badge-sm">Pemadam Kebakaran</div>
              <h3 className="card-title text-lg">Pelatihan Pemadaman Kebakaran</h3>
              <p className="text-sm text-base-content/70">
                Damkar Depok menggelar pelatihan gratis untuk warga tentang cara menangani kebakaran di lingkungan rumah.
              </p>
              <div className="card-actions justify-between items-center mt-2">
                <span className="text-xs text-base-content/50">1 minggu lalu</span>
                <button className="btn btn-warning btn-sm hover-lift transition-smooth">Baca Selengkapnya</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-base-100 py-16 animate-fadeIn">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 lg:gap-12 grid-cols-1 lg:grid-cols-2 items-center">
            <div className="space-y-6 animate-slideInLeft">
              <h2 className="text-3xl font-bold sm:text-4xl">ℹ️ Tentang Depok Point</h2>
              <p className="text-lg text-base-content/80 leading-relaxed">
                Depok Point adalah sistem informasi geografis (GIS) yang menyediakan data lokasi penting di Kota Depok. 
                Platform ini memudahkan masyarakat untuk menemukan fasilitas publik seperti rumah sakit, kantor polisi, 
                puskesmas, dan layanan penting lainnya.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Akurat & Terpercaya</h3>
                    <p className="text-base-content/70">
                      Data lokasi diverifikasi dan diupdate secara berkala untuk memastikan keakuratan informasi.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Realtime & Cepat</h3>
                    <p className="text-base-content/70">
                      Menggunakan teknologi Firebase Firestore untuk update data secara realtime tanpa delay.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Mudah Diakses</h3>
                    <p className="text-base-content/70">
                      Interface yang user-friendly dan responsive, dapat diakses dari perangkat apapun.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 animate-slideInRight">
              <div className="bg-gradient-to-br from-primary to-primary-focus p-6 rounded-2xl text-primary-content hover-lift transition-smooth">
                <div className="text-4xl mb-2">🏥</div>
                <div className="text-3xl font-bold mb-1">15+</div>
                <div className="text-sm opacity-90">Rumah Sakit</div>
              </div>
              <div className="bg-gradient-to-br from-secondary to-secondary-focus p-6 rounded-2xl text-secondary-content hover-lift transition-smooth">
                <div className="text-4xl mb-2">👮</div>
                <div className="text-3xl font-bold mb-1">20+</div>
                <div className="text-sm opacity-90">Kantor Polisi</div>
              </div>
              <div className="bg-gradient-to-br from-accent to-accent-focus p-6 rounded-2xl text-accent-content hover-lift transition-smooth">
                <div className="text-4xl mb-2">🏢</div>
                <div className="text-3xl font-bold mb-1">30+</div>
                <div className="text-sm opacity-90">Layanan Publik</div>
              </div>
              <div className="bg-gradient-to-br from-warning to-warning-focus p-6 rounded-2xl text-warning-content hover-lift transition-smooth">
                <div className="text-4xl mb-2">🗺️</div>
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-sm opacity-90">Akurasi Data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">📞 Hubungi Kami</h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Ada pertanyaan atau ingin menambahkan data lokasi? Silakan hubungi kami
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 lg:items-start max-w-6xl mx-auto">
          {/* Kolom 1: Alamat */}
          <div className="bg-base-100 border border-base-300 rounded-2xl p-6 h-full">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📍</span>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-lg">Alamat Kantor</h3>
                <p className="text-base-content/70">
                  <strong>Dinas Komunikasi dan Informatika Kota Depok</strong>
                </p>
                <p className="text-base-content/70">
                  Jl. Margonda Raya No. 54 Gedung Dibaleka 2 Depok Lt.7
                </p>
              </div>
            </div>
          </div>

          {/* Kolom 2: Kontak 2x2 (tanpa card) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-base-300 bg-base-100 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚨</span>
                <span className="font-semibold">Call Center</span>
              </div>
              <a href="tel:112" className="text-2xl font-bold text-primary hover:text-primary-focus">
                112
              </a>
            </div>

            <div className="p-4 rounded-lg border border-base-300 bg-base-100 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📧</span>
                <span className="font-semibold">Email</span>
              </div>
              <a href="mailto:portal@depok.go.id" className="text-base-content/80 hover:text-primary">
                portal@depok.go.id
              </a>
            </div>

            <div className="p-4 rounded-lg border border-base-300 bg-base-100 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📱</span>
                <span className="font-semibold">Telepon</span>
              </div>
              <a href="tel:08111232222" className="text-base-content/80 hover:text-primary">
                08111232222
              </a>
            </div>

            <div className="p-4 rounded-lg border border-base-300 bg-base-100 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💬</span>
                <span className="font-semibold">SMS</span>
              </div>
              <a href="sms:08111631500" className="text-base-content/80 hover:text-primary">
                08111631500
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg flex items-center justify-center p-1.5">
                  <Image 
                    src="/logo.svg" 
                    alt="DepokPoint Logo" 
                    width={40} 
                    height={40}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Depok Point</h3>
                  <p className="text-xs text-base-content/60">GIS System</p>
                </div>
              </div>
              <p className="text-sm text-base-content/70 mb-3">
                Sistem informasi geografis untuk layanan publik Kota Depok
              </p>
              <p className="text-xs text-base-content/60">
                Dikelola oleh: <strong>Dinas Komunikasi dan Informatika Kota Depok</strong>
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Link Cepat</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#smart-location" className="link link-hover">Smart Location</a></li>
                <li><a href="#news" className="link link-hover">Berita</a></li>
                <li><a href="#about" className="link link-hover">Tentang</a></li>
                <li><a href="#contact" className="link link-hover">Kontak</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Kontak Resmi</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <a href="mailto:portal@depok.go.id" className="link link-hover">portal@depok.go.id</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  <a href="tel:08111232222" className="link link-hover">08111232222</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>💬</span>
                  <a href="sms:08111631500" className="link link-hover">08111631500</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>🚨</span>
                  <a href="tel:112" className="link link-hover font-bold">Call Center: 112</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Alamat</h4>
              <p className="text-sm text-base-content/70">
                Jl. Margonda Raya No. 54<br />
                Gedung Dibaleka 2 Depok Lt.7<br />
                Kota Depok, Jawa Barat
              </p>
              <div className="flex gap-2 mt-4">
                <a href="https://depok.go.id" target="_blank" rel="noopener noreferrer" className="btn btn-square btn-sm" title="Website Resmi">
                  <span>🌐</span>
                </a>
                <a href="#" className="btn btn-square btn-sm" title="Facebook">
                  <span>📘</span>
                </a>
                <a href="#" className="btn btn-square btn-sm" title="Instagram">
                  <span>📷</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-base-content/10 pt-8 text-center">
            <p className="text-sm text-base-content/60">
              © 2026 Pemerintah Kota Depok. Dinas Komunikasi dan Informatika.<br />
              <span className="text-xs">Built with Next.js, Firebase & OpenStreetMap</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
