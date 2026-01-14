export type ProcessingStatus = "processing" | "ready" | "failed";

export type BiasLabel = "left" | "center" | "right" | "non_political";

export type BiasInfo = {
  label: BiasLabel;
  score: number;        // 0..1 (0=left, 0.5=center, 1=right)
  confidence: number;   // 0..1
  rationale?: string;   // optional, short
};

export type CoverageItem = {
  id: string;
  sourceName: string;
  sourceCountry?: string;
  publishedAt: string;          // ISO string
  headline: string;
  summary: string;              // Gemini output
  imageUrl?: string;
  url?: string;
  status: ProcessingStatus;
  bias?: BiasInfo;
};

export type Hotspot = {
  id: string;
  tag: string;                  // e.g., "CLIMATE", "CONFLICT"
  headline: string;
  summary: string;              // short hotspot summary
  lat: number;
  lng: number;                  // Standardizing on 'lng' for Mapbox compatibility
  displayLocation?: string;     // "Mumbai, India"
  intensity: number;            // numeric for ranking 0..1
  isBreaking: boolean;
  sourceCount: number;
  lastSeenAt: string;           // ISO
  imageUrl?: string;
  status: ProcessingStatus;
  bias?: BiasInfo;
  coverage: CoverageItem[];     
};

export type ArticlePoint = {
  id: string;
  clusterId: string;
  lat: number;
  lng: number;
  title: string;
  source: string;
};
