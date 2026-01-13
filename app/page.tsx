"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Place, PlaceCategory } from "@/types/place";
import { Navbar } from "@/components/Navbar";

const MapView = dynamic(() => import("@/components/MapView").then((mod) => mod.MapView), {
  ssr: false,
});

const categories: { value: PlaceCategory | "all"; label: string }[] = [
  { value: "all", label: "Semua Kategori" },
  { value: "Rumah Sakit", label: "Rumah Sakit" },
  { value: "Puskesmas", label: "Puskesmas" },
  { value: "Kantor Polisi", label: "Kantor Polisi" },
  { value: "Damkar", label: "Damkar" },
  { value: "Kantor Pemerintahan", label: "Kantor Pemerintahan" },
  { value: "Transportasi", label: "Transportasi" },
  { value: "Lainnya", label: "Lainnya" },
];

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
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
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
      const matchSearch = place.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [places, selectedCategory, search]);

  const stats = useMemo(() => {
    const total = places.length;
    const hospitalCount = places.filter((p) => p.category === "Rumah Sakit").length;
    const policeCount = places.filter((p) => p.category === "Kantor Polisi").length;
    return {
      total,
      hospitalCount,
      policeCount,
      selectedCount: filteredPlaces.length,
    };
  }, [places, filteredPlaces.length]);

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
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <div className="inline-block">
                  <span className="badge badge-primary badge-lg">🗺️ Depok Point</span>
                </div>
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Sistem Informasi <span className="text-primary">GIS</span> Kota Depok
                </h1>
                <p className="text-lg text-base-content/80 leading-relaxed">
                  Temukan lokasi penting di Kota Depok dengan mudah. Rumah sakit, kantor polisi, damkar, puskesmas, dan layanan publik lainnya dalam satu peta interaktif.
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <a href="#smart-location" className="btn btn-primary btn-lg">
                    📍 Jelajahi Peta
                  </a>
                  <a href="#about" className="btn btn-outline btn-lg">
                    ℹ️ Pelajari Lebih Lanjut
                  </a>
                </div>
                <div className="flex flex-wrap gap-3 pt-6">
                  <div className="badge badge-outline badge-lg">🔥 Realtime Updates</div>
                  <div className="badge badge-outline badge-lg">☁️ Cloud Storage</div>
                  <div className="badge badge-outline badge-lg">🗺️ OpenStreetMap</div>
                </div>
              </div>
              
              <div className="w-full rounded-2xl bg-base-100 p-2 shadow-2xl border border-base-300">
                <div className="aspect-video rounded-xl overflow-hidden">
                  <MapView places={filteredPlaces} selectedId={selectedId} onSelect={setSelectedId} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300">
              <div className="stat-figure text-primary text-4xl">📍</div>
              <div className="stat-title">Total Lokasi</div>
              <div className="stat-value text-primary">{stats.total}</div>
              <div className="stat-desc">Semua kategori tersedia</div>
            </div>
            <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300">
              <div className="stat-figure text-secondary text-4xl">🏥</div>
              <div className="stat-title">Rumah Sakit</div>
              <div className="stat-value text-secondary">{stats.hospitalCount}</div>
              <div className="stat-desc">Fasilitas kesehatan</div>
            </div>
            <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300">
              <div className="stat-figure text-accent text-4xl">👮</div>
              <div className="stat-title">Kantor Polisi</div>
              <div className="stat-value text-accent">{stats.policeCount}</div>
              <div className="stat-desc">Keamanan & layanan</div>
            </div>
            <div className="stat rounded-2xl bg-base-100 shadow-lg border border-base-300">
              <div className="stat-figure text-warning text-4xl">🔥</div>
              <div className="stat-title">Damkar</div>
              <div className="stat-value text-warning">{stats.damkarCount}</div>
              <div className="stat-desc">Penanggulangan bencana</div>
            </div>
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

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="card bg-base-100 shadow">
                <div className="card-body gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="form-control w-full md:max-w-xs">
                      <label className="label">
                        <span className="label-text">Cari lokasi</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Rumah sakit, kantor polisi, dll"
                        className="input input-bordered"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="form-control w-full md:max-w-xs">
                      <label className="label">
                        <span className="label-text">Kategori</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as PlaceCategory | "all")}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control w-full md:max-w-xs">
                  <label className="label">
                    <span className="label-text">Urutan</span>
                  </label>
                  <input className="input input-bordered" value="Abjad (Firestore)" readOnly />
                </div>
              </div>
              {error ? (
                <div className="alert alert-error flex items-center gap-2 text-sm">
                  <span>{error}</span>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {loading ? (
                  <div className="col-span-2 flex items-center justify-center py-10">
                    <span className="loading loading-spinner loading-lg text-primary" aria-label="Memuat" />
                  </div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="col-span-2 rounded-box border border-dashed border-base-300 p-6 text-center text-sm">
                    Belum ada data untuk filter ini. Tambahkan lokasi baru di form sebelah kanan.
                  </div>
                ) : (
                  filteredPlaces.map((place) => (
                    <article key={place.id} className="card bg-base-100 shadow-sm border border-base-200">
                      <div className="card-body gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="card-title text-lg">{place.name}</h3>
                            <div className="flex flex-wrap gap-2 text-sm text-base-content/70">
                              <span className="badge badge-outline">{place.category}</span>
                              <span className="badge badge-ghost">{formatDate(place.updatedAt)}</span>
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-ghost"
                            type="button"
                            onClick={() => setSelectedId(place.id)}
                          >
                            Fokus
                          </button>
                        </div>
                        {place.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="h-40 w-full rounded-box object-cover"
                          />
                        ) : null}
                        {place.address ? <p className="text-sm text-base-content/80">{place.address}</p> : null}
                        <div className="grid grid-cols-2 gap-2 text-sm text-base-content/80">
                          <span>Lat: {place.latitude.toFixed(4)}</span>
                          <span>Lng: {place.longitude.toFixed(4)}</span>
                          {place.phone ? <span className="col-span-2">Telp: {place.phone}</span> : null}
                        </div>
                        {place.description ? (
                          <p className="text-sm text-base-content/70">{place.description}</p>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl border border-base-300 sticky top-4">
            <div className="card-body">
              <div className="mb-4">
                <h2 className="card-title text-xl mb-2">➕ Tambah Lokasi Baru</h2>
                <p className="text-sm text-base-content/60">
                  Lengkapi form di bawah untuk menambahkan lokasi baru ke sistem
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Nama Lokasi */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-base-content">
                    📍 Nama Lokasi
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-2.5 bg-base-200 border-2 border-base-300 rounded-lg text-base-content placeholder-base-content/50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100"
                    placeholder="Contoh: RSUD Kota Depok"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-semibold text-base-content">
                    📚 Kategori
                  </label>
                  <select
                    id="category"
                    className="w-full px-4 py-2.5 bg-base-200 border-2 border-base-300 rounded-lg text-base-content transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as PlaceCategory }))}
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Alamat */}
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-base-content">
                    📮 Alamat Lengkap
                  </label>
                  <textarea
                    id="address"
                    className="w-full px-4 py-2.5 bg-base-200 border-2 border-base-300 rounded-lg text-base-content placeholder-base-content/50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100 min-h-[80px] resize-none"
                    placeholder="Jl. Margonda Raya No. 123, Depok"
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                {/* Koordinat */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-base-content">
                    🗺️ Koordinat Lokasi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="latitude" className="block text-xs text-base-content/70">
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        type="number"
                        step="0.0001"
                        className="w-full px-3 py-2 bg-base-200 border-2 border-base-300 rounded-lg text-sm text-base-content transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100"
                        placeholder="-6.4025"
                        value={form.latitude}
                        onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="longitude" className="block text-xs text-base-content/70">
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        type="number"
                        step="0.0001"
                        className="w-full px-3 py-2 bg-base-200 border-2 border-base-300 rounded-lg text-sm text-base-content transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100"
                        placeholder="106.7942"
                        value={form.longitude}
                        onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-base-content/50 mt-1">
                    💡 Tip: Klik pada peta untuk mendapatkan koordinat otomatis
                  </p>
                </div>

                {/* Divider */}
                <div className="divider my-4">Informasi Tambahan (Opsional)</div>

                {/* Telepon */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-base-content">
                    📞 Nomor Telepon
                  </label>
                  <input
                    id="phone"
                    type="text"
                    className="w-full px-4 py-2.5 bg-base-200 border-2 border-base-300 rounded-lg text-base-content placeholder-base-content/50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100"
                    placeholder="021-12345678"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-base-content">
                    📝 Deskripsi
                  </label>
                  <textarea
                    id="description"
                    className="w-full px-4 py-2.5 bg-base-200 border-2 border-base-300 rounded-lg text-base-content placeholder-base-content/50 transition-all duration-200 focus:outline-none focus:border-primary focus:bg-base-100 min-h-[80px] resize-none"
                    placeholder="Informasi tambahan tentang lokasi ini..."
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Upload Foto */}
                <div className="space-y-2">
                  <label htmlFor="image" className="block text-sm font-semibold text-base-content">
                    📷 Foto Lokasi
                  </label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                  {previewUrl && (
                    <div className="mt-3 relative rounded-lg overflow-hidden border-2 border-base-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={previewUrl} 
                        alt="Pratinjau" 
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleFileChange(null);
                          const fileInput = document.getElementById('image') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button 
                  className="w-full px-4 py-3 bg-primary text-primary-content font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  type="submit" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Menyimpan Data...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Simpan Lokasi Baru
                    </>
                  )}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-4 bg-info/10 border border-info/20 rounded-lg p-3">
                <p className="text-xs text-info font-semibold mb-1">ℹ️ Informasi</p>
                <ul className="text-xs text-base-content/70 space-y-1">
                  <li>• Data akan disimpan ke Firebase Firestore</li>
                  <li>• Foto akan diupload ke Cloudinary</li>
                  <li>• Field bertanda * wajib diisi</li>
                </ul>
              </div>
            </div>
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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow">
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
                <button className="btn btn-primary btn-sm">Baca Selengkapnya</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow">
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
                <button className="btn btn-accent btn-sm">Baca Selengkapnya</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow">
            <figure className="h-48 bg-gradient-to-br from-warning/20 to-error/20 flex items-center justify-center">
              <span className="text-6xl">🔥</span>
            </figure>
            <div className="card-body">
              <div className="badge badge-warning badge-sm">Damkar</div>
              <h3 className="card-title text-lg">Pelatihan Pemadaman Kebakaran</h3>
              <p className="text-sm text-base-content/70">
                Damkar Depok menggelar pelatihan gratis untuk warga tentang cara menangani kebakaran di lingkungan rumah.
              </p>
              <div className="card-actions justify-between items-center mt-2">
                <span className="text-xs text-base-content/50">1 minggu lalu</span>
                <button className="btn btn-warning btn-sm">Baca Selengkapnya</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-base-100 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary to-primary-focus p-6 rounded-2xl text-primary-content">
                <div className="text-4xl mb-2">🏥</div>
                <div className="text-3xl font-bold mb-1">15+</div>
                <div className="text-sm opacity-90">Rumah Sakit</div>
              </div>
              <div className="bg-gradient-to-br from-secondary to-secondary-focus p-6 rounded-2xl text-secondary-content">
                <div className="text-4xl mb-2">👮</div>
                <div className="text-3xl font-bold mb-1">20+</div>
                <div className="text-sm opacity-90">Kantor Polisi</div>
              </div>
              <div className="bg-gradient-to-br from-accent to-accent-focus p-6 rounded-2xl text-accent-content">
                <div className="text-4xl mb-2">🏢</div>
                <div className="text-3xl font-bold mb-1">30+</div>
                <div className="text-sm opacity-90">Layanan Publik</div>
              </div>
              <div className="bg-gradient-to-br from-warning to-warning-focus p-6 rounded-2xl text-warning-content">
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
        
        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📧</span>
              </div>
              <h3 className="card-title text-lg">Email</h3>
              <p className="text-base-content/70">info@depokpoint.id</p>
              <p className="text-base-content/70">admin@depokpoint.id</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="card-title text-lg">Telepon</h3>
              <p className="text-base-content/70">+62 21 1234 5678</p>
              <p className="text-base-content/70">+62 812 3456 7890</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="card-title text-lg">Alamat</h3>
              <p className="text-base-content/70">Jl. Margonda Raya</p>
              <p className="text-base-content/70">Depok, Jawa Barat</p>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h3 className="card-title mb-4">Kirim Pesan</h3>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="form-control">
                    <input type="text" placeholder="Nama Anda" className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <input type="email" placeholder="Email Anda" className="input input-bordered" />
                  </div>
                </div>
                <div className="form-control">
                  <input type="text" placeholder="Subjek" className="input input-bordered" />
                </div>
                <div className="form-control">
                  <textarea className="textarea textarea-bordered h-32" placeholder="Pesan Anda"></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Depok Point</h3>
                  <p className="text-xs text-base-content/60">GIS System</p>
                </div>
              </div>
              <p className="text-sm text-base-content/70">
                Sistem informasi geografis untuk layanan publik Kota Depok
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
              <h4 className="font-bold mb-4">Kategori</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="link link-hover">Rumah Sakit</a></li>
                <li><a href="#" className="link link-hover">Kantor Polisi</a></li>
                <li><a href="#" className="link link-hover">Puskesmas</a></li>
                <li><a href="#" className="link link-hover">Damkar</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Ikuti Kami</h4>
              <div className="flex gap-2">
                <a href="#" className="btn btn-square btn-sm">
                  <span>📘</span>
                </a>
                <a href="#" className="btn btn-square btn-sm">
                  <span>📷</span>
                </a>
                <a href="#" className="btn btn-square btn-sm">
                  <span>🐦</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-base-content/10 pt-8 text-center">
            <p className="text-sm text-base-content/60">
              © 2026 Depok Point. All rights reserved. Built with Next.js & Firebase.
            </p>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
