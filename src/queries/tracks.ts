import type { Song, Response, SongData } from "../lib/types";

export const fetchCharts = async (country: string): Promise<Song[]> => {
  const response = await fetch(
    `/api/charts?country=${encodeURIComponent(country.trim() || "US")}`,
  );

  if (!response.ok) {
    throw new Error("Failed to load charts");
  }

  const data = (await response.json()) as Response | Song;

  if (Array.isArray((data as Response)?.tracks)) {
    return (data as Response).tracks ?? [];
  }

  if (data && typeof data === "object") {
    return [data as Song];
  }

  return [];
};

export const fetchSearch = async (q: string): Promise<Song[]> => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);

  if (!response.ok) {
    throw new Error("Failed to load tracks");
  }

  const data = (await response.json()) as Response | Song;

  if (Array.isArray((data as Response)?.tracks)) {
    return (data as Response).tracks ?? [];
  }

  if (data && typeof data === "object") {
    return [data as Song];
  }

  return [];
};

export const fetchTrack = async (id: string): Promise<SongData> => {
  const response = await fetch(`/api/track?id=${id}`);

  if (!response.ok) {
    throw new Error("Failed to load tracks");
  }

  const data = (await response.json()) as Partial<SongData>;

  if (data && typeof data === "object" && data.streamingData) {
    return data as SongData;
  }

  throw new Error("Invalid track payload");
};
