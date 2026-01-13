"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CarouselSlide } from "@/types/carousel";

interface CarouselFormState {
  title: string;
  description: string;
  imageFile?: File | null;
  isActive: boolean;
}

export function CarouselManager() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<CarouselFormState>({
    title: "",
    description: "",
    imageFile: null,
    isActive: true,
  });

  // Load carousel slides
  useEffect(() => {
    try {
      const q = query(collection(db, "carouselSlides"));

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
            .sort((a, b) => a.order - b.order);

          setSlides(nextSlides);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error loading carousel slides:", err);
          setError("Gagal memuat carousel slides");
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up listener:", err);
      setError("Gagal setup listener");
      setLoading(false);
    }
  }, []);

  const handleFileChange = (file: File | null) => {
    setForm((prev) => ({ ...prev, imageFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
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
      title: "",
      description: "",
      imageFile: null,
      isActive: true,
    });
    setPreviewUrl(null);
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!form.title.trim()) {
        throw new Error("Judul slide harus diisi");
      }

      if (!form.imageFile && !previewUrl) {
        throw new Error("Gambar harus diupload");
      }

      let imageUrl = previewUrl || "";

      if (form.imageFile) {
        imageUrl = await uploadImage(form.imageFile);
      }

      const newOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;

      await addDoc(collection(db, "carouselSlides"), {
        title: form.title,
        description: form.description,
        imageUrl,
        order: newOrder,
        isActive: form.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus slide ini?")) return;

    try {
      await deleteDoc(doc(db, "carouselSlides", id));
    } catch (err) {
      setError("Gagal menghapus slide");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "carouselSlides", id), {
        isActive: !isActive,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError("Gagal memperbarui status slide");
    }
  };

  const handleReorder = async (slides: CarouselSlide[]) => {
    try {
      for (let i = 0; i < slides.length; i++) {
        await updateDoc(doc(db, "carouselSlides", slides[i].id), {
          order: i,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError("Gagal menyimpan urutan slide");
    }
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newSlides = [...slides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    handleReorder(newSlides);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <span className="text-3xl">🎠</span>
                <span>Manajemen Hero Carousel</span>
              </h2>
              <p className="text-sm text-base-content/70 mt-2">
                Kelola slide carousel yang ditampilkan di halaman utama
              </p>
            </div>
            <button className="btn btn-primary gap-2" onClick={() => setShowForm(!showForm)}>
              {showForm ? (
                <>
                  <span>✕</span>
                  Batal
                </>
              ) : (
                <>
                  <span>➕</span>
                  Slide Baru
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m8-8a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Form Tambah Slide */}
      {showForm && (
        <div className="card bg-base-100 shadow-lg border border-primary/20">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <span>🆕</span>
              <span>Tambah Slide Carousel</span>
            </h3>

            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Judul Slide *</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Contoh: Layanan Kesehatan Terpadu"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Deskripsi</label>
                <textarea
                  className="textarea textarea-bordered h-20 w-full"
                  placeholder="Deskripsi singkat slide..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Gambar *</label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-sm w-full"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  disabled={submitting}
                  required={!previewUrl}
                />
                {previewUrl && (
                  <div className="relative mt-2">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover rounded-lg"
                    />
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    disabled={submitting}
                  />
                  <span className="text-sm">Aktifkan slide ini</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Simpan Slide
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slides List */}
      <div className="space-y-3">
        {slides.length === 0 ? (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body text-center py-12">
              <p className="text-base-content/60">Belum ada carousel slide</p>
            </div>
          </div>
        ) : (
          slides.map((slide, index) => (
            <div key={slide.id} className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Thumbnail */}
                  <div className="relative h-24 bg-base-200 rounded-lg overflow-hidden">
                    {slide.imageUrl ? (
                      <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">No image</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg">{slide.title}</h3>
                    <p className="text-sm text-base-content/70 line-clamp-1">{slide.description}</p>
                    <div className="flex gap-2 mt-3">
                      <span className={`badge ${slide.isActive ? "badge-success" : "badge-ghost"}`}>
                        {slide.isActive ? "✓ Aktif" : "○ Tidak Aktif"}
                      </span>
                      <span className="badge badge-outline text-xs">Urutan: {slide.order + 1}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:col-span-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleToggleActive(slide.id, slide.isActive)}
                        title={slide.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {slide.isActive ? "🔴" : "⚫"}
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => moveSlide(index, "up")}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => moveSlide(index, "down")}
                        disabled={index === slides.length - 1}
                      >
                        ▼
                      </button>
                      <button
                        className="btn btn-sm btn-error btn-ghost"
                        onClick={() => handleDelete(slide.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
