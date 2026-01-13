"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  createdAt?: string;
}

interface CategoryFormState {
  name: string;
  icon: string;
  color: string;
  description: string;
}

const defaultColors = [
  { name: "Merah", value: "#dc2626" },
  { name: "Biru", value: "#2563eb" },
  { name: "Hijau", value: "#16a34a" },
  { name: "Kuning", value: "#eab308" },
  { name: "Ungu", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Cyan", value: "#06b6d4" },
];

const defaultIcons = ["🏥", "🚓", "🚒", "🏛️", "🚌", "📍", "🏪", "🎓", "⚖️", "🏦"];

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>({
    name: "",
    icon: "📍",
    color: "#2563eb",
    description: "",
  });

  // Load categories from Firestore
  useEffect(() => {
    const q = query(collection(db, "categories"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextCategories: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Category));

        setCategories(nextCategories);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading categories:", err);
        setError("Gagal memuat kategori");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      icon: "📍",
      color: "#2563eb",
      description: "",
    });
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!form.name.trim()) {
        throw new Error("Nama kategori harus diisi");
      }

      if (categories.some((c) => c.name.toLowerCase() === form.name.toLowerCase())) {
        throw new Error("Kategori dengan nama ini sudah ada");
      }

      await addDoc(collection(db, "categories"), {
        name: form.name,
        icon: form.icon,
        color: form.color,
        description: form.description,
        createdAt: new Date().toISOString(),
      });

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (err) {
      setError("Gagal menghapus kategori");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title flex items-center gap-2">
                <span className="text-3xl">📚</span>
                <span>Manajemen Kategori Lokasi</span>
              </h2>
              <p className="text-sm text-base-content/70 mt-2">
                Kelola kategori untuk mengorganisir berbagai jenis lokasi penting di Kota Depok
              </p>
            </div>
            <button
              className="btn btn-primary gap-2"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? (
                <>
                  <span>✕</span>
                  Batal
                </>
              ) : (
                <>
                  <span>➕</span>
                  Kategori Baru
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

      {/* Form Tambah Kategori */}
      {showForm && (
        <div className="card bg-base-100 shadow-lg border border-primary/20">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <span>🆕</span>
              <span>Tambah Kategori Baru</span>
            </h3>

            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Kategori */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nama Kategori *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-md"
                    placeholder="Contoh: Bandara, Stasiun"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* Deskripsi */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Deskripsi</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-md"
                    placeholder="Deskripsi singkat"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Icon Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Emoji Icon</span>
                  </label>
                  <select
                    className="select select-bordered select-md text-lg"
                    value={form.icon}
                    onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                    disabled={submitting}
                  >
                    {defaultIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon} {icon === form.icon ? "(Dipilih)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Warna Marker</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-base-300"
                      style={{ backgroundColor: form.color }}
                    />
                    <select
                      className="select select-bordered select-md flex-1"
                      value={form.color}
                      onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                      disabled={submitting}
                    >
                      {defaultColors.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider my-2" />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Simpan Kategori
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  ↻ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kategori List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">
            <span>📋</span>
            <span>Daftar Kategori ({categories.length})</span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-lg mb-2">Belum ada kategori</p>
              <p className="text-sm">Buat kategori baru untuk memulai mengorganisir lokasi</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-4xl">{category.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-base-content/60">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-base-300 shadow"
                      style={{ backgroundColor: category.color }}
                      title={`Warna: ${category.color}`}
                    />
                    <button
                      className="btn btn-ghost btn-sm text-error hover:bg-error/20"
                      onClick={() => handleDelete(category.id)}
                      title="Hapus kategori"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
