"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
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
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    const loadMapComponents = async () => {
      const [leaflet, reactLeaflet] = await Promise.all([
        import("leaflet"),
        import("react-leaflet"),
      ]);
      
      const defaultIcon = leaflet.default.icon({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (location: LocationMarker) => void }) => {
        reactLeaflet.useMapEvents({
          click(e: any) {
            onLocationSelect({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              isNew: true,
            });
          },
        });
        return null;
      };

      setMapComponents({
        ...reactLeaflet,
        defaultIcon,
        MapClickHandler,
      });
      setL(leaflet.default);
    };

    loadMapComponents();
  }, []);

  if (!mapComponents) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-box border border-base-300 bg-base-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, defaultIcon, MapClickHandler } = mapComponents;

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

      <div className="w-full overflow-hidden rounded-box border border-base-300 shadow-sm bg-base-100">
        <MapContainer center={center} zoom={12} className="h-[500px] w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Existing places markers */}
          {places.map((place) => (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={defaultIcon}
              opacity={selectedLocation?.isNew && selectedLocation.lat !== place.latitude ? 0.5 : 1}
            >
              <Popup>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{place.name}</p>
                  <p className="badge badge-outline badge-sm">{place.category}</p>
                  {place.address ? <p className="text-base-content/80">{place.address}</p> : null}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* New location marker */}
          {selectedLocation?.isNew && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={defaultIcon}>
              <Popup>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-primary">Lokasi Baru</p>
                  <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
                  <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
                  <p className="text-xs text-base-content/70">Isi form di samping untuk melanjutkan</p>
                </div>
              </Popup>
            </Marker>
          )}

          <MapClickHandler onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>

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
