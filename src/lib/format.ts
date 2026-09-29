import type { Track } from "./types";

export const formatTime = (seconds: number | null | undefined) => {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

export const artistsText = (track: Pick<Track, "artists"> | null | undefined) =>
  track?.artists
    ?.map((a) => a.name)
    .filter(Boolean)
    .join(", ") || "Неизвестный исполнитель";

export const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
};

export const tracksCount = (n: number) => `${n} ${plural(n, ["трек", "трека", "треков"])}`;

export const totalDuration = (tracks: Track[]) => {
  const seconds = tracks.reduce((sum, t) => sum + (t.durationSeconds ?? 0), 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин`;
};

export const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
};

export const youtubeUrl = (track: Track) =>
  track.source === "video"
    ? `https://www.youtube.com/watch?v=${track.videoId}`
    : `https://music.youtube.com/watch?v=${track.videoId}`;

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable
    }
  },
};
