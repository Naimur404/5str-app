/**
 * Formats distance values for display
 * - If distance >= 1 km: shows in km format (e.g., "1.5km")
 * - If distance < 1 km: shows in meters format (e.g., "577m")
 * @param distanceKm - Distance value in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number | undefined | null): string => {
  // Handle invalid values
  if (distanceKm == null || typeof distanceKm !== 'number' || isNaN(distanceKm)) {
    return 'N/A';
  }
  
  // Handle negative values
  if (distanceKm < 0) {
    return 'N/A';
  }
  
  if (distanceKm >= 1) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
};

/**
 * Formats distance with additional context for accessibility
 * @param distanceKm - Distance value in kilometers
 * @returns Formatted distance string with accessibility context
 */
export const formatDistanceWithContext = (distanceKm: number | undefined | null): string => {
  const distance = formatDistance(distanceKm);
  if (distance === 'N/A') {
    return 'Distance unavailable';
  }
  return `${distance} away`;
};