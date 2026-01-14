"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Place } from "@/types/place";
import { formatDistance, formatDuration } from "@/lib/directions";
import { useSimpleRouting } from "@/lib/useSimpleRouting";

const center: [number, number] = [-6.4025, 106.7942];

interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

type Props = {
  places: Place[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  showDirections?: boolean;
  startPoint?: RouteWaypoint | null;
  endPoint?: RouteWaypoint | null;
  onStartPointChange?: (point: RouteWaypoint | null) => void;
  onEndPointChange?: (point: RouteWaypoint | null) => void;
  onRouteCalculated?: (info: any) => void;
};

export function MapView({ 
  places, 
  selectedId, 
  onSelect, 
  showDirections = false,
  startPoint: externalStartPoint = null,
  endPoint: externalEndPoint = null,
  onStartPointChange,
  onEndPointChange,
  onRouteCalculated,
}: Props) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [startPoint, setStartPoint] = useState<RouteWaypoint | null>(externalStartPoint);
  const [endPoint, setEndPoint] = useState<RouteWaypoint | null>(externalEndPoint);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  // Sync external state with local state
  useEffect(() => {
    setStartPoint(externalStartPoint);
  }, [externalStartPoint]);

  useEffect(() => {
    setEndPoint(externalEndPoint);
  }, [externalEndPoint]);

  // Notify parent when route is calculated
  useEffect(() => {
    onRouteCalculated?.(routeInfo);
  }, [routeInfo, onRouteCalculated]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use routing hook
  useSimpleRouting(
    mapInstanceRef.current,
    showDirections ? startPoint : null,
    showDirections ? endPoint : null,
    setRouteInfo
  );

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
    });
  }, [isClient, places, selectedId, onSelect, showDirections, startPoint, endPoint]);

  return (
    <div className="w-full space-y-4">
      {showDirections && (
        <div className="flex gap-2 flex-wrap p-3 bg-base-100 rounded-box border border-base-300">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-base-content/70">Titik Mulai:</label>
            <p className="text-sm font-medium text-base-content">
              {startPoint?.name || "Pilih dari peta"}
            </p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-base-content/70">Titik Tujuan:</label>
            <p className="text-sm font-medium text-base-content">
              {endPoint?.name || "Pilih dari peta"}
            </p>
          </div>
          {(startPoint || endPoint) && (
            <button
              onClick={() => {
                setStartPoint(null);
                setEndPoint(null);
                setRouteInfo(null);
              }}
              className="btn btn-sm btn-ghost"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-[480px] overflow-hidden rounded-box border border-base-300 shadow-sm relative z-0"
        style={{ height: '480px', width: '100%' }}
      />
    </div>
  );
}
