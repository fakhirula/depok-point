/**
 * Utility functions for handling directions and routing
 */

export interface DirectionStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Calculate straight-line distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Format distance in human-readable format
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} menit`;
}

/**
 * Get bearing between two coordinates
 */
export function getBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = lon2 - lon1;
  const y = Math.sin((dLon * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos((dLon * Math.PI) / 180);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Get direction text based on bearing
 */
export function getDirectionText(bearing: number): string {
  const directions = [
    "Utara",
    "Timur Laut",
    "Timur",
    "Tenggara",
    "Selatan",
    "Barat Daya",
    "Barat",
    "Barat Laut",
  ];
  const index = Math.round(((bearing + 360) % 360) / 45) % 8;
  return directions[index];
}

/**
 * Create a simple route with waypoints
 */
export function createRoute(
  waypoints: Array<{ lat: number; lng: number; name?: string }>
): {
  distance: number;
  estimatedTime: number;
  waypoints: typeof waypoints;
} {
  let totalDistance = 0;
  let estimatedTime = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateDistance(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    totalDistance += distance;
    // Estimate 50 km/h average speed
    estimatedTime += (distance / 50) * 3600; // in seconds
  }

  return {
    distance: totalDistance * 1000, // convert to meters
    estimatedTime: estimatedTime,
    waypoints,
  };
}
