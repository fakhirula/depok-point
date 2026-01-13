"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Place } from "@/types/place";

const center: [number, number] = [-6.4025, 106.7942];

type Props = {
  places: Place[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export function MapView({ places, selectedId, onSelect }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[480px] overflow-hidden rounded-box border border-base-300 shadow-sm bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-[480px] overflow-hidden rounded-box border border-base-300 shadow-sm">
      <MapContainer
        key="map-container"
        center={center}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom
        style={{ height: '480px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((place) => (
          <CircleMarker
            key={place.id}
            center={[place.latitude, place.longitude]}
            pathOptions={{
              color: selectedId === place.id ? "#2563eb" : "#16a34a",
              fillOpacity: 0.85,
              weight: selectedId === place.id ? 5 : 3,
            }}
            radius={12}
            eventHandlers={{
              click: () => onSelect?.(place.id),
            }}
          >
            <Popup>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{place.name}</p>
                <p className="badge badge-outline badge-sm">{place.category}</p>
                {place.address ? <p className="text-base-content/80">{place.address}</p> : null}
                <div className="text-xs text-base-content/70">
                  <p>
                    Koordinat: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                  </p>
                  {place.phone ? <p>Telepon: {place.phone}</p> : null}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
