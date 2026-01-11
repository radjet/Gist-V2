export interface BasemapProvider {
  /**
   * Generates a tile URL for a given zoom, x, y, and device pixel ratio.
   */
  getTileUrl(z: number, x: number, y: number, dpr: 1 | 2): string;
  
  /**
   * Attribution text to display.
   */
  attribution: string;
}

interface MapboxProviderParams {
  token: string;
  styleId: string;
  tileSize?: number;
  maxZoom?: number;
}

export function createMapboxProvider({
  token,
  styleId,
  tileSize = 512,
  maxZoom = 5
}: MapboxProviderParams): BasemapProvider {
  return {
    attribution: '© Mapbox',
    getTileUrl: (z, x, y, dpr) => {
      const ratio = dpr === 2 ? '@2x' : '';
      return `https://api.mapbox.com/styles/v1/${styleId}/tiles/${tileSize}/${z}/${x}/${y}${ratio}?access_token=${token}`;
    }
  };
}