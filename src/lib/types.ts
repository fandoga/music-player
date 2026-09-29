export type TrackSource = "song" | "video";
export type SearchSource = "songs" | "videos";

export interface Track {
  videoId: string;
  title: string;
  artists: { name: string; id?: string | null }[];
  album?: { name: string; id?: string | null } | null;
  duration?: string | null;
  durationSeconds?: number | null;
  thumbnail?: string | null;
  thumbnailSmall?: string | null;
  source: TrackSource;
}

export interface ChartResponse {
  title?: string;
  tracks: Track[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  trackCount: number;
  covers: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: Track[];
}

export type RepeatMode = "off" | "all" | "one";
