/**
 * Formats distance values for display
 * - If distance >= 1 km: shows in km format (e.g., "1.5km")
 * - If distance < 1 km: shows in meters format (e.g., "577m")
 * @param distanceKm - Distance value in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number): string => {
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
export const formatDistanceWithContext = (distanceKm: number): string => {
  const distance = formatDistance(distanceKm);
  return `${distance} away`;
};