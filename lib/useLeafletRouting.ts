import { useEffect, useRef } from "react";

interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
}

export function useLeafletRouting(
  map: any,
  startPoint: RouteWaypoint | null,
  endPoint: RouteWaypoint | null,
  onRouteCalculated?: (route: RouteInfo) => void
) {
  const routingControlRef = useRef<any>(null);
  const scriptsLoadedRef = useRef(false);

  useEffect(() => {
    if (!map || !startPoint || !endPoint) {
      // Clear route if points are removed
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          console.log("Error removing control:", e);
        }
      }
      return;
    }

    // Ensure CSS is loaded
    const cssId = "leaflet-routing-machine-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href =
        "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
      link.onerror = () => {
        console.warn("Failed to load CSS from unpkg, trying jsdelivr");
        link.href = "https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
      };
      document.head.appendChild(link);
    }

    // Load script if not already loaded
    const scriptId = "leaflet-routing-machine-js";
    if (!document.getElementById(scriptId) && !scriptsLoadedRef.current) {
      const script = document.createElement("script");
      script.id = scriptId;
      // Try multiple CDNs
      const cdnUrls = [
        "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.umd.js",
        "https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.umd.js",
      ];
      
      let cdnIndex = 0;
      
      const loadNextCDN = () => {
        if (cdnIndex >= cdnUrls.length) {
          console.error("Failed to load leaflet-routing-machine from all CDNs");
          return;
        }
        
        script.src = cdnUrls[cdnIndex];
        cdnIndex++;
      };
      
      script.async = true;
      script.onload = () => {
        scriptsLoadedRef.current = true;
        addRoutingControl();
      };
      script.onerror = () => {
        console.warn(`Failed to load from CDN: ${script.src}`);
        loadNextCDN();
        if (cdnIndex < cdnUrls.length) {
          document.head.removeChild(script);
          document.head.appendChild(script);
        }
      };
      
      loadNextCDN();
      document.head.appendChild(script);
    } else if (scriptsLoadedRef.current) {
      addRoutingControl();
    }

    function addRoutingControl() {
      try {
        const L = (window as any).L;

        if (!L || !L.Routing) {
          console.error("Leaflet or Leaflet.Routing not available");
          return;
        }

        // Remove existing control
        if (routingControlRef.current) {
          try {
            map.removeControl(routingControlRef.current);
          } catch (e) {
            console.log("Error removing old control");
          }
        }

        // Create routing control
        routingControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(startPoint.lat, startPoint.lng),
            L.latLng(endPoint.lat, endPoint.lng),
          ],
          routeWhileDragging: false,
          showAlternatives: true,
          lineOptions: {
            styles: [
              {
                color: "#2563eb",
                opacity: 0.8,
                weight: 5,
              },
            ],
          },
          altLineOptions: {
            styles: [
              {
                color: "#e5e7eb",
                opacity: 0.5,
                weight: 3,
              },
            ],
          },
          createMarker: (i: number, wp: any) => {
            let icon;
            if (i === 0) {
              // Start point
              icon = L.divIcon({
                html: '<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">S</div>',
                iconSize: [30, 30],
              });
            } else {
              // End point
              icon = L.divIcon({
                html: '<div style="background-color: #ef4444; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">E</div>',
                iconSize: [30, 30],
              });
            }
            return L.marker(wp.latLng, { icon, draggable: false });
          },
        }).addTo(map);

        // Handle route found
        routingControlRef.current.on("routesfound", function (e: any) {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const route = routes[0];
            const distance = route.summary.totalDistance || 0;
            const duration = route.summary.totalTime || 0;

            onRouteCalculated?.({
              distance,
              duration,
            });
          }
        });

        routingControlRef.current.on("routingerror", function (e: any) {
          console.error("Routing error:", e);
        });
      } catch (error) {
        console.error("Error creating routing control:", error);
      }
    }

    return () => {
      // Cleanup handled by effect re-run
    };
  }, [map, startPoint, endPoint, onRouteCalculated]);

  return { routingControlRef };
}
