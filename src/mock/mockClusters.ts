import { Hotspot, CoverageItem, ArticlePoint } from '../types/gist';

const now = new Date();
const timeAgo = (min: number) => new Date(now.getTime() - 1000 * 60 * min).toISOString();

// Stable Unsplash IDs for consistent visuals
const IMG_VOLCANO = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80";
const IMG_TECH = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80";
const IMG_FINANCE = "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=600&q=80";
const IMG_CLIMATE = "https://images.unsplash.com/photo-1569163139599-0f4517e36b31?w=600&q=80";
const IMG_POLITICS = "https://images.unsplash.com/photo-1529101091760-61df6be34fc8?w=600&q=80";
const IMG_OCEAN = "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=600&q=80";

const mockCoverage = (count: number, topic: string): CoverageItem[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `cov-${topic}-${i}`,
    sourceName: i % 2 === 0 ? 'Reuters' : 'The Guardian',
    sourceCountry: i % 2 === 0 ? 'UK' : 'USA',
    publishedAt: timeAgo(30 + i * 45),
    headline: `${topic} coverage: Detailed analysis of ongoing situation - report ${i + 1}`,
    summary: "Generated summary of the specific angle covered by this outlet, highlighting key quotes and data points.",
    url: '#',
    status: 'ready',
    imageUrl: i === 0 ? IMG_TECH : undefined, // only some have images
    bias: i % 2 === 0 ? { label: 'center', score: 0.5, confidence: 0.9 } : undefined
  }));
};

export const mockClusters: Hotspot[] = [
  {
    id: '1',
    tag: 'CRISIS',
    headline: 'Volcanic Eruption in Iceland',
    summary: 'A new fissure eruption has started on the Reykjanes peninsula, prompting evacuations. Lava flows are threatening infrastructure near Grindavík.',
    lat: 63.88,
    lng: -22.43,
    displayLocation: 'Reykjanes, Iceland',
    intensity: 0.95,
    isBreaking: true,
    sourceCount: 124,
    lastSeenAt: timeAgo(15),
    imageUrl: IMG_VOLCANO,
    status: 'ready',
    coverage: mockCoverage(5, 'Eruption'),
    bias: { label: 'non_political', score: 0.5, confidence: 0.95 }
  },
  {
    id: '2',
    tag: 'TECH',
    headline: 'Global AI Summit Keynote',
    summary: 'Major tech leaders gather in San Francisco to discuss regulation, safety, and the next generation of generative models.',
    lat: 37.7749,
    lng: -122.4194,
    displayLocation: 'San Francisco, USA',
    intensity: 0.85,
    isBreaking: false,
    sourceCount: 85,
    lastSeenAt: timeAgo(120),
    imageUrl: IMG_TECH,
    status: 'processing', // Simulating active processing
    coverage: mockCoverage(8, 'AI Summit'),
    bias: { label: 'center', score: 0.45, confidence: 0.8 }
  },
  {
    id: '3',
    tag: 'ECONOMY',
    headline: 'Markets Rally on Inflation Data',
    summary: 'Global stock markets hit record highs as new reports suggest inflation is cooling faster than central banks anticipated.',
    lat: 40.7128,
    lng: -74.0060,
    displayLocation: 'New York, USA',
    intensity: 0.75,
    isBreaking: false,
    sourceCount: 200,
    lastSeenAt: timeAgo(45),
    imageUrl: IMG_FINANCE,
    status: 'ready',
    coverage: mockCoverage(12, 'Markets'),
    bias: { label: 'right', score: 0.7, confidence: 0.85 }
  },
  {
    id: '4',
    tag: 'CLIMATE',
    headline: 'Typhoon Mawar Approaches',
    summary: 'Category 4 storm is expected to make landfall within 24 hours. Emergency services in Manila are on high alert.',
    lat: 14.5995,
    lng: 120.9842,
    displayLocation: 'Manila, Philippines',
    intensity: 0.92,
    isBreaking: true,
    sourceCount: 65,
    lastSeenAt: timeAgo(10),
    imageUrl: undefined, // Test fallback
    status: 'ready',
    coverage: mockCoverage(6, 'Typhoon'),
    bias: { label: 'non_political', score: 0.5, confidence: 0.9 }
  },
  {
    id: '5',
    tag: 'POLITICS',
    headline: 'EU Expansion Summit',
    summary: 'Leaders meet in Berlin to discuss the potential accession of new member states amidst geopolitical tensions.',
    lat: 52.5200,
    lng: 13.4050,
    displayLocation: 'Berlin, Germany',
    intensity: 0.65,
    isBreaking: false,
    sourceCount: 45,
    lastSeenAt: timeAgo(300),
    imageUrl: IMG_POLITICS,
    status: 'ready',
    coverage: mockCoverage(4, 'EU Summit'),
    bias: { label: 'left', score: 0.3, confidence: 0.75 }
  },
  {
    id: '6',
    tag: 'ENVIRONMENT',
    headline: 'Pacific Ocean Cleanup Milestone',
    summary: 'Non-profit announces removal of 100,000kg of plastic from the Great Pacific Garbage Patch.',
    lat: 35.0,
    lng: -140.0,
    displayLocation: 'North Pacific Ocean',
    intensity: 0.55,
    isBreaking: false,
    sourceCount: 30,
    lastSeenAt: timeAgo(600),
    imageUrl: IMG_OCEAN,
    status: 'failed', // Test failed state
    coverage: mockCoverage(3, 'Cleanup'),
  },
  {
    id: '7',
    tag: 'CONFLICT',
    headline: 'Eastern Border Tensions',
    summary: 'Satellite imagery reveals new movement along the contested border regions.',
    lat: 50.4501,
    lng: 30.5234,
    displayLocation: 'Kyiv, Ukraine',
    intensity: 0.88,
    isBreaking: true,
    sourceCount: 150,
    lastSeenAt: timeAgo(20),
    status: 'ready',
    coverage: mockCoverage(10, 'Border'),
    bias: { label: 'center', score: 0.5, confidence: 0.6 }
  }
];

// --- Mock Article Points Generator (Deterministic Jitter) ---
const generateArticlePoints = (clusters: Hotspot[]): ArticlePoint[] => {
  const points: ArticlePoint[] = [];
  
  clusters.forEach((cluster, clusterIdx) => {
    // Generate 5-15 articles per cluster
    const count = Math.floor(5 + cluster.intensity * 10); 
    
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random based on cluster index and particle index
      const seed = (clusterIdx * 100) + i;
      const rnd1 = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
      const rnd2 = Math.cos(seed) * 10000 - Math.floor(Math.cos(seed) * 10000);
      
      // Radius ~50km max (approx 0.5 deg)
      const r = 0.5 * Math.sqrt(rnd1);
      const theta = rnd2 * 2 * Math.PI;
      
      const dLat = r * Math.cos(theta);
      const dLng = r * Math.sin(theta); // Rough approx, ignoring projection distortion for mock

      points.push({
        id: `${cluster.id}-art-${i}`,
        clusterId: cluster.id,
        lat: cluster.lat + dLat,
        lng: cluster.lng + dLng,
        title: `Detailed Report ${i+1} on ${cluster.tag}`,
        source: i % 2 === 0 ? 'Local News' : 'Global Wire'
      });
    }
  });

  return points;
};

export const mockArticlePoints = generateArticlePoints(mockClusters);
