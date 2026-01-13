"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Place } from "@/types/place";

const center: [number, number] = [-6.4025, 106.7942];

type Props = {
  places: Place[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export function MapView({ places, selectedId, onSelect }: Props) {
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

      // Initialize map only once
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
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add markers
      places.forEach((place) => {
        const marker = L.circleMarker([place.latitude, place.longitude], {
          radius: 12,
          fillColor: selectedId === place.id ? "#2563eb" : "#16a34a",
          color: selectedId === place.id ? "#1e40af" : "#15803d",
          weight: selectedId === place.id ? 5 : 3,
          opacity: 1,
          fillOpacity: 0.85,
        });

        const popupContent = `
          <div class="space-y-2 text-sm">
            <p class="font-semibold">${place.name}</p>
            <span class="badge badge-outline badge-sm">${place.category}</span>
            ${place.address ? `<p class="text-base-content/80">${place.address}</p>` : ''}
            <div class="text-xs text-base-content/70">
              <p>Koordinat: ${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}</p>
              ${place.phone ? `<p>Telepon: ${place.phone}</p>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => onSelect?.(place.id));
        marker.addTo(map);
        markersRef.current.push(marker);
      });

      return () => {
        // Cleanup handled by mapInstanceRef
      };
    });
  }, [isClient, places, selectedId, onSelect]);

  if (!isClient) {
    return (
      <div className="w-full h-[480px] overflow-hidden rounded-box border border-base-300 shadow-sm bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[480px] overflow-hidden rounded-box border border-base-300 shadow-sm relative z-0"
      style={{ height: '480px', width: '100%' }}
    />
  );
}
