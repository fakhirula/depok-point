"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Place } from "@/types/place";

interface LocationMarker {
  lat: number;
  lng: number;
  isNew?: boolean;
}

type Props = {
  places: Place[];
  selectedLocation?: LocationMarker;
  onLocationSelect: (location: LocationMarker) => void;
};

export function AdminMapView({ places, selectedLocation, onLocationSelect }: Props) {
  const center: [number, number] = [-6.4025, 106.7942];
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Dynamically import Leaflet
    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default;

      // Initialize map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: center,
          zoom: 12,
          scrollWheelZoom: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // Handle map click
        mapInstanceRef.current.on('click', (e: any) => {
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            isNew: true,
          });
        });
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add existing places markers
      places.forEach((place) => {
        const marker = L.marker([place.latitude, place.longitude], {
          opacity: selectedLocation?.isNew && selectedLocation.lat !== place.latitude ? 0.5 : 1,
        });

        const popupContent = `
          <div class="space-y-2 text-sm">
            <p class="font-semibold">${place.name}</p>
            <span class="badge badge-outline badge-sm">${place.category}</span>
            ${place.address ? `<p class="text-base-content/80">${place.address}</p>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Add new location marker if selected
      if (selectedLocation?.isNew) {
        const newMarker = L.marker([selectedLocation.lat, selectedLocation.lng]);

        const newPopupContent = `
          <div class="space-y-2 text-sm">
            <p class="font-semibold text-primary">Lokasi Baru</p>
            <p>Lat: ${selectedLocation.lat.toFixed(6)}</p>
            <p>Lng: ${selectedLocation.lng.toFixed(6)}</p>
            <p class="text-xs text-base-content/70">Isi form di samping untuk melanjutkan</p>
          </div>
        `;

        newMarker.bindPopup(newPopupContent);
        newMarker.addTo(map);
        markersRef.current.push(newMarker);

        // Center map on new location
        map.setView([selectedLocation.lat, selectedLocation.lng], 12);
      }

      return () => {
        // Cleanup handled by mapInstanceRef
      };
    });
  }, [isClient, places, selectedLocation, onLocationSelect]);

  if (!isClient) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-box border border-base-300 bg-base-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>Klik pada peta untuk mengatur koordinat lokasi baru</span>
      </div>

      <div
        ref={mapRef}
        className="w-full overflow-hidden rounded-box border border-base-300 shadow-sm bg-base-100"
        style={{ height: '500px', width: '100%' }}
      />

      {selectedLocation && (
        <div className="rounded-box bg-success/10 border border-success p-3 text-sm text-success">
          <p className="font-semibold">✓ Koordinat Terpilih</p>
          <p>Latitude: {selectedLocation.lat.toFixed(6)}</p>
          <p>Longitude: {selectedLocation.lng.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
}
