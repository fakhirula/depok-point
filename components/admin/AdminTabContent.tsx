"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Place, PlaceCategory } from "@/types/place";
import dynamic from "next/dynamic";

const AdminMapView = dynamic(() => import("@/components/AdminMapView").then((mod) => mod.AdminMapView), {
  ssr: false,
});

const defaultCategories: { value: PlaceCategory; label: string }[] = [
  { value: "Rumah Sakit", label: "🏥 Rumah Sakit" },
  { value: "Puskesmas", label: "🏥 Puskesmas" },
  { value: "Kantor Polisi", label: "🚓 Kantor Polisi" },
  { value: "Damkar", label: "🚒 Damkar (Dinas Kebakaran)" },
  { value: "Kantor Pemerintahan", label: "🏛️ Kantor Pemerintahan" },
  { value: "Transportasi", label: "🚌 Transportasi" },
  { value: "Lainnya", label: "📍 Lainnya" },
];

interface LocationMarker {
  lat: number;
  lng: number;
}

type FormState = {
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  imageFile?: File | null;
};

export default function AdminTabContent() {
  const [places, setPlaces] = useState<Place[]>([]);
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
            category: (data.category as PlaceCategory) || "Lainnya",
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

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Name Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nama Lokasi *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-md"
                    placeholder="Contoh: RSUD Depok"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Category Select */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Kategori *</span>
                  </label>
                  <select
                    className="select select-bordered select-md"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as PlaceCategory }))}
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address Textarea */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Alamat</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-sm h-20"
                    placeholder="Alamat lengkap lokasi..."
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                {/* Coordinates Section */}
                <div className="divider my-3" />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Koordinat *</span>
                    <span className="label-text-alt text-xs badge badge-outline">
                      {selectedLocation ? "✓ Set" : "⚠ Belum"}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">
                        <span className="label-text text-xs">Latitude</span>
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        className="input input-bordered input-sm text-center font-mono"
                        placeholder="Lat"
                        value={form.latitude}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text text-xs">Longitude</span>
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        className="input input-bordered input-sm text-center font-mono"
                        placeholder="Lng"
                        value={form.longitude}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Telepon</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="+62 21 ..."
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {/* Description Textarea */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Deskripsi</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-sm h-16"
                    placeholder="Deskripsi singkat tentang lokasi..."
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Image Upload */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Foto (Opsional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered file-input-sm"
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

                {/* Submit Section */}
                <div className="divider my-3" />
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
