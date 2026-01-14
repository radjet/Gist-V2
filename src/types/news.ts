export type Topic = "conflict" | "economy" | "tech" | "climate" | "politics" | "sports" | "health";

export type Article = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string; // ISO string
};

export type StoryCluster = {
  id: string;
  lat: number;
  lng: number;
  topic: Topic;
  intensity: number; // 0..1 (drives size/opacity)
  headline: string;
  articles: Article[];
};
