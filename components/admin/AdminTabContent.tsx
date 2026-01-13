"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Place } from "@/types/place";
import dynamic from "next/dynamic";

const AdminMapView = dynamic(() => import("@/components/AdminMapView").then((mod) => mod.AdminMapView), {
  ssr: false,
});

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

interface LocationMarker {
  lat: number;
  lng: number;
}

type FormState = {
  name: string;
  category: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  imageFile?: File | null;
};

export default function AdminTabContent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "Rumah Sakit",
    address: "",
    latitude: "",
    longitude: "",
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

        // Auto-set first category when kosong
        if (nextCategories.length > 0) {
          setForm((prev) => ({
            ...prev,
            category: prev.category || nextCategories[0].name,
          }));
        }
      },
      (err) => {
        console.error("Error loading categories:", err);
        setCategoriesLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "places"), orderBy("name"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextPlaces: Place[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Tanpa nama",
            category: (data.category as string) || "Lainnya",
            address: data.address || "",
            phone: data.phone || "",
            description: data.description || "",
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            imageUrl: data.imageUrl || "",
            updatedAt: data.updatedAt || null,
          };
        });
        setPlaces(nextPlaces);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Gagal memuat data lokasi");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleMapClick = (location: LocationMarker) => {
    setSelectedLocation(location);
    setForm((prev) => ({
      ...prev,
      latitude: location.lat.toFixed(6),
      longitude: location.lng.toFixed(6),
    }));
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
    const res = await fetch("/api/upload", { method: "POST", body: data });
    if (!res.ok) throw new Error("Gagal mengunggah gambar");
    const body = await res.json();
    return body.url as string;
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "Rumah Sakit",
      address: "",
      latitude: "",
      longitude: "",
      phone: "",
      description: "",
      imageFile: null,
    });
    setPreviewUrl(null);
    setSelectedLocation(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);

      if (!form.name.trim()) throw new Error("Nama lokasi harus diisi");
      if (!form.category) throw new Error("Kategori harus dipilih");
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Klik peta untuk mengatur koordinat");
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
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m8-8a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <span>Klik pada Peta untuk Mengatur Koordinat</span>
              </h2>
              <p className="text-sm text-base-content/70 mb-4">
                Klik lokasi pada peta untuk mengisi koordinat latitude dan longitude secara otomatis
              </p>
              {loading ? (
                <div className="flex justify-center py-20">
                  <span className="loading loading-spinner loading-lg" />
                </div>
              ) : (
                <AdminMapView
                  places={places}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleMapClick}
                />
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-lg sticky top-24">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 text-xl">
                <span>➕</span>
                <span>Lokasi Baru</span>
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nama Lokasi *</label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Contoh: RSUD Depok"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Kategori *</label>
                    <select
                      className="select select-bordered w-full"
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      disabled={categoriesLoading}
                    >
                      <option value="" disabled>
                        {categoriesLoading ? "Memuat kategori..." : "Pilih kategori"}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                      {categories.length === 0 && !categoriesLoading ? (
                        <option value="Lainnya">Lainnya</option>
                      ) : null}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Telepon</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="0857xxxx / +62 ..."
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Alamat</label>
                  <textarea
                    className="textarea textarea-bordered h-24 w-full"
                    placeholder="Alamat lengkap lokasi..."
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Koordinat *</label>
                    <span className="text-xs badge badge-outline">
                      {selectedLocation ? "✓ Set" : "⚠ Belum"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="input input-bordered input-sm text-center font-mono w-full"
                        placeholder="Lat"
                        value={form.latitude}
                        readOnly
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="input input-bordered input-sm text-center font-mono w-full"
                        placeholder="Lng"
                        value={form.longitude}
                        readOnly
                      />
                    </div>
                  </div>
                  <p className="text-xs text-base-content/60 mt-2">Klik peta untuk mengisi koordinat otomatis</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Deskripsi</label>
                  <textarea
                    className="textarea textarea-bordered h-20 w-full"
                    placeholder="Deskripsi singkat tentang lokasi..."
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Foto (Opsional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered file-input-sm w-full"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                  {previewUrl && (
                    <div className="mt-2 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="h-24 w-full object-cover rounded-lg" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 btn btn-xs btn-circle btn-ghost"
                        onClick={() => handleFileChange(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={submitting || !selectedLocation}
                  >
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        Simpan Lokasi
                      </>
                    )}
                  </button>

                  {!selectedLocation && (
                    <div className="alert alert-warning text-sm py-2">
                      <span>⚠️ Klik peta terlebih dahulu untuk mengatur koordinat</span>
                    </div>
                  )}

                  {selectedLocation && (
                    <button className="btn btn-outline btn-block btn-sm" type="button" onClick={resetForm}>
                      ↻ Reset Form
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
