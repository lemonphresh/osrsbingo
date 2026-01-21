import OSRSMap from '../../src/assets/osrsmap12112025.png';

export const MAP_CONFIG = {
  mapWidth: 8192,
  mapHeight: 5632,
  mapImageUrl: OSRSMap,

  _slopeX: 2.9165021964249197,
  _interceptX: -3247.7248971193417,
  _slopeY: 2.799493670886076,
  _interceptY: -5943.081772151899,
};

/**
 * Convert OSRS coordinates to pixel positions using calibrated transformation
 */
export const convertCoordinates = (osrsX, osrsY) => {
  const pixelX = MAP_CONFIG._slopeX * osrsX + MAP_CONFIG._interceptX;
  const pixelY = MAP_CONFIG._slopeY * osrsY + MAP_CONFIG._interceptY;

  // Return in Leaflet format [y, x]
  return [pixelY, pixelX];
};

/**
 * Convert pixel coordinates back to OSRS coordinates
 */
export const reverseCoordinates = (pixelY, pixelX) => {
  const osrsX = Math.round((pixelX - MAP_CONFIG._interceptX) / MAP_CONFIG._slopeX);
  const osrsY = Math.round((pixelY - MAP_CONFIG._interceptY) / MAP_CONFIG._slopeY);

  return { osrsX, osrsY };
};

/**
 * Get map bounds for Leaflet
 */
export const getMapBounds = () => {
  return {
    default: [
      [0, 0],
      [MAP_CONFIG.mapHeight, MAP_CONFIG.mapWidth],
    ],
    mapWidth: MAP_CONFIG.mapWidth,
    mapHeight: MAP_CONFIG.mapHeight,
  };
};
