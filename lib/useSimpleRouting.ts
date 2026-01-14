import { useEffect, useRef } from "react";

interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry?: any;
}

interface OSRMResponse {
  routes: Array<{
    geometry: any;
    distance: number;
    duration: number;
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        name: string;
        instruction: string;
      }>;
    }>;
  }>;
}

export function useSimpleRouting(
  map: any,
  startPoint: RouteWaypoint | null,
  endPoint: RouteWaypoint | null,
  onRouteCalculated?: (route: RouteInfo) => void
) {
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !startPoint || !endPoint) {
      // Clear polyline if points are removed
      if (polylineRef.current) {
        map?.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      return;
    }

    // Fetch route from OSRM
    fetchRoute(startPoint, endPoint);

    async function fetchRoute(start: RouteWaypoint, end: RouteWaypoint) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true&annotations=distance,duration`;

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.status}`);
        }

        const data: OSRMResponse = await response.json();

        if (!data.routes || data.routes.length === 0) {
          return;
        }

        const route = data.routes[0];
        const distance = route.distance; // meters
        const duration = route.duration; // seconds

        // Clear existing polyline
        if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
        }

        // Decode and display route
        if (route.geometry) {
          const L = (window as any).L;
          
          // Decode polyline from OSRM
          const coordinates = decodePolyline(route.geometry);

          // Draw polyline on map
          polylineRef.current = L.polyline(coordinates, {
            color: "#2563eb",
            weight: 5,
            opacity: 0.8,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          // Fit bounds to show entire route
          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        // Add start and end markers
        const L = (window as any).L;

        // Remove old routing markers
        map.eachLayer((layer: any) => {
          if (
            layer instanceof L.CircleMarker &&
            layer.options.fillColor &&
            (layer.options.fillColor === "#10b981" || layer.options.fillColor === "#ef4444")
          ) {
            map.removeLayer(layer);
          }
        });

        // Add start marker
        L.circleMarker([start.lat, start.lng], {
          radius: 10,
          fillColor: "#10b981",
          color: "#059669",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .bindPopup(`<strong>📍 Awal:</strong><br/>${start.name || "Titik Mulai"}`)
          .addTo(map);

        // Add end marker
        L.circleMarker([end.lat, end.lng], {
          radius: 10,
          fillColor: "#ef4444",
          color: "#dc2626",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .bindPopup(`<strong>🎯 Akhir:</strong><br/>${end.name || "Titik Akhir"}`)
          .addTo(map);

        // Call callback with route info
        onRouteCalculated?.({
          distance,
          duration,
          geometry: route.geometry,
        });
      } catch (error) {
        // Route fetch error - silently fail
      }
    }

    return () => {
      // Cleanup
    };
  }, [map, startPoint, endPoint, onRouteCalculated]);

  return { polylineRef };
}

/**
 * Decode polyline from OSRM format
 * OSRM uses Google's polyline algorithm with precision 1e5 (NOT 1e6!)
 * Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): Array<[number, number]> {
  const inv = 1.0 / 1e5;  // OSRM uses 1e5 precision, not 1e6!
  const decoded: Array<[number, number]> = [];
  let previous = [0, 0];
  let i = 0;

  while (i < encoded.length) {
    let point = [0, 0];
    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let result = 0;
      let byte = 0;
      do {
        byte = encoded.charCodeAt(i++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const value = (result & 1) ? ~(result >> 1) : result >> 1;
      point[j] = previous[j] + value;
      previous[j] = point[j];
    }
    // point[0] = latitude, point[1] = longitude
    // Return as [lat, lng] which Leaflet expects
    decoded.push([point[0] * inv, point[1] * inv]);
  }

  return decoded;
}
