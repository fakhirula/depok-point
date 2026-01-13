"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Place } from "@/types/place";

export function LocationManager() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load places
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
            category: data.category || "Lainnya",
            address: data.address || "",
            phone: data.phone || "",
            description: data.description || "",
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            imageUrl: data.imageUrl || "",
            updatedAt: data.updatedAt || null,
          } as Place;
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

  const filteredPlaces = useMemo(() => {
    return places.filter((place) =>
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (place.address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  }, [places, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) return;

    setDeleting(id);
    try {
      await deleteDoc(doc(db, "places", id));
      if (selectedPlace?.id === id) {
        setSelectedPlace(null);
      }
    } catch (err) {
      setError("Gagal menghapus lokasi");
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    try {
      await updateDoc(doc(db, "places", selectedPlace.id), {
        name: selectedPlace.name,
        category: selectedPlace.category,
        address: selectedPlace.address,
        phone: selectedPlace.phone,
        description: selectedPlace.description,
        updatedAt: new Date().toISOString(),
      });

      setEditMode(false);
      setError(null);
    } catch (err) {
      setError("Gagal memperbarui lokasi");
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <h2 className="card-title">📍 Manajemen Lokasi</h2>

        {error && (
          <div className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control">
          <input
            type="text"
            placeholder="Cari lokasi, kategori, alamat..."
            className="input input-bordered input-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <label className="label">
            <span className="label-text-alt text-xs">{filteredPlaces.length} dari {places.length} lokasi</span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* List */}
          <div className="border border-base-300 rounded-box overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner" />
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="p-4 text-center text-base-content/60 text-sm">
                  Tidak ada lokasi yang cocok
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className={`p-3 border-b border-base-200 cursor-pointer transition ${
                      selectedPlace?.id === place.id ? "bg-primary/10" : "hover:bg-base-200"
                    }`}
                    onClick={() => {
                      setSelectedPlace(place);
                      setEditMode(false);
                    }}
                  >
                    <p className="font-semibold text-sm">{place.name}</p>
                    <p className="text-xs text-base-content/60">{place.category}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail & Edit */}
          <div>
            {selectedPlace ? (
              <div className="border border-base-300 rounded-box p-4 space-y-4">
                {editMode ? (
                  <form onSubmit={handleUpdatePlace} className="space-y-3">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm font-semibold">Nama</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={selectedPlace.name}
                        onChange={(e) =>
                          setSelectedPlace((prev) => prev ? { ...prev, name: e.target.value } : null)
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm font-semibold">Kategori</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={selectedPlace.category}
                        onChange={(e) =>
                          setSelectedPlace((prev) => prev ? { ...prev, category: e.target.value } : null)
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm font-semibold">Alamat</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered textarea-sm"
                        value={selectedPlace.address}
                        onChange={(e) =>
                          setSelectedPlace((prev) => prev ? { ...prev, address: e.target.value } : null)
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm font-semibold">Telepon</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={selectedPlace.phone}
                        onChange={(e) =>
                          setSelectedPlace((prev) => prev ? { ...prev, phone: e.target.value } : null)
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm font-semibold">Deskripsi</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered textarea-sm"
                        value={selectedPlace.description}
                        onChange={(e) =>
                          setSelectedPlace((prev) => prev ? { ...prev, description: e.target.value } : null)
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-sm btn-primary flex-1">
                        Simpan
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost flex-1"
                        onClick={() => setEditMode(false)}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-base-content/60">Nama</p>
                      <p className="font-semibold">{selectedPlace.name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-base-content/60">Kategori</p>
                      <p className="font-semibold">{selectedPlace.category}</p>
                    </div>

                    <div>
                      <p className="text-xs text-base-content/60">Alamat</p>
                      <p className="text-sm">{selectedPlace.address || "-"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-base-content/60">Latitude</p>
                        <p className="text-sm font-mono">{selectedPlace.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/60">Longitude</p>
                        <p className="text-sm font-mono">{selectedPlace.longitude.toFixed(6)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-base-content/60">Telepon</p>
                      <p className="text-sm">{selectedPlace.phone || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-base-content/60">Deskripsi</p>
                      <p className="text-sm">{selectedPlace.description || "-"}</p>
                    </div>

                    {selectedPlace.imageUrl && (
                      <div>
                        <p className="text-xs text-base-content/60 mb-2">Gambar</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedPlace.imageUrl}
                          alt={selectedPlace.name}
                          className="w-full h-32 object-cover rounded-box"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-primary flex-1"
                        onClick={() => setEditMode(true)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-error flex-1"
                        onClick={() => handleDelete(selectedPlace.id)}
                        disabled={deleting === selectedPlace.id}
                      >
                        {deleting === selectedPlace.id ? "Menghapus..." : "🗑️ Hapus"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="border border-base-300 rounded-box p-4 text-center text-base-content/60 text-sm">
                Pilih lokasi untuk melihat detail
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
