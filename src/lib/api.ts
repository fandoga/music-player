import type {
  ChartResponse,
  PlaylistDetail,
  PlaylistSummary,
  SearchSource,
  Track,
  User,
} from "./types";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      // not a JSON body
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const enc = encodeURIComponent;

export const api = {
  charts: (country: string) => request<ChartResponse>(`/charts?country=${enc(country)}`),
  search: (q: string, source: SearchSource) =>
    request<Track[]>(`/search?q=${enc(q.trim())}&source=${source}`),
  stream: (videoId: string) =>
    request<{ videoId: string; audioUrl: string }>(`/track?id=${enc(videoId)}`),

  authConfig: () => request<{ googleClientId: string | null }>("/auth/config"),
  me: () => request<User>("/auth/me"),
  loginGoogle: (credential: string) =>
    request<User>("/auth/google", { method: "POST", body: { credential } }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  likes: () => request<Track[]>("/likes"),
  like: (track: Track) =>
    request<void>(`/likes/${enc(track.videoId)}`, { method: "PUT", body: track }),
  unlike: (videoId: string) => request<void>(`/likes/${enc(videoId)}`, { method: "DELETE" }),

  playlists: () => request<PlaylistSummary[]>("/playlists"),
  playlist: (id: number) => request<PlaylistDetail>(`/playlists/${id}`),
  createPlaylist: (name: string) =>
    request<PlaylistSummary>("/playlists", { method: "POST", body: { name } }),
  renamePlaylist: (id: number, name: string) =>
    request<PlaylistSummary>(`/playlists/${id}`, { method: "PATCH", body: { name } }),
  deletePlaylist: (id: number) => request<void>(`/playlists/${id}`, { method: "DELETE" }),
  addToPlaylist: (id: number, track: Track) =>
    request<void>(`/playlists/${id}/tracks`, { method: "POST", body: track }),
  removeFromPlaylist: (id: number, videoId: string) =>
    request<void>(`/playlists/${id}/tracks/${enc(videoId)}`, { method: "DELETE" }),
};
