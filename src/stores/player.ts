import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { api } from "../lib/api";
import { artistsText, storage } from "../lib/format";
import type { RepeatMode, Track } from "../lib/types";
import { useUiStore } from "./ui";

const URL_TTL = 1000 * 60 * 30;
const MAX_PERSISTED_QUEUE = 300;

type LoadState = "idle" | "loading" | "ready" | "error";

interface PersistedQueue {
  queue: Track[];
  // original (unshuffled) order as indexes into `queue`
  order: number[];
  index: number;
  contextKey: string;
  contextLabel: string;
}

const shuffled = <T>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const usePlayerStore = defineStore("player", () => {
  const audio = new Audio();
  audio.preload = "auto";

  // ---------- state ----------
  const persisted = storage.get<PersistedQueue | null>("player.queue", null);

  const queue = ref<Track[]>(persisted?.queue ?? []);
  // Queue order before shuffling, restored when shuffle is turned off.
  const originalQueue = ref<Track[]>(
    persisted && persisted.order?.length === persisted.queue.length
      ? persisted.order.map((i) => persisted.queue[i]).filter(Boolean)
      : [...(persisted?.queue ?? [])],
  );
  const index = ref(persisted && persisted.queue[persisted.index] ? persisted.index : -1);
  const contextKey = ref(persisted?.contextKey ?? "");
  const contextLabel = ref(persisted?.contextLabel ?? "");

  const isPlaying = ref(false);
  const isBuffering = ref(false);
  const loadState = ref<LoadState>("idle");
  const currentTime = ref(0);
  const duration = ref(0);

  const volume = ref(storage.get("player.volume", 0.7));
  const muted = ref(storage.get("player.muted", false));
  const shuffle = ref(storage.get("player.shuffle", false));
  const repeat = ref<RepeatMode>(storage.get("player.repeat", "off"));

  const current = computed<Track | null>(() => queue.value[index.value] ?? null);
  const upNext = computed(() => queue.value.slice(index.value + 1));
  const isLoading = computed(() => loadState.value === "loading" || isBuffering.value);
  const hasNext = computed(
    () => index.value < queue.value.length - 1 || (repeat.value === "all" && queue.value.length > 0),
  );

  audio.volume = volume.value;
  audio.muted = muted.value;
  duration.value = current.value?.durationSeconds ?? 0;

  // ---------- stream url resolution ----------
  const urlCache = new Map<string, { url: string; at: number }>();
  const inflight = new Map<string, Promise<string>>();

  const resolveUrl = (videoId: string) => {
    const cached = urlCache.get(videoId);
    if (cached && Date.now() - cached.at < URL_TTL) return Promise.resolve(cached.url);

    let pending = inflight.get(videoId);
    if (!pending) {
      pending = api
        .stream(videoId)
        .then(({ audioUrl }) => {
          urlCache.set(videoId, { url: audioUrl, at: Date.now() });
          return audioUrl;
        })
        .finally(() => inflight.delete(videoId));
      inflight.set(videoId, pending);
    }
    return pending;
  };

  const prefetchNext = () => {
    const next = queue.value[index.value + 1] ?? (repeat.value === "all" ? queue.value[0] : null);
    if (next && next.videoId !== current.value?.videoId) {
      resolveUrl(next.videoId).catch(() => undefined);
    }
  };

  // ---------- loading ----------
  let loadToken = 0;
  let loadedVideoId: string | null = null;
  let consecutiveFailures = 0;
  let retriedExpired = false;

  const load = async (autoplay: boolean, startAt = 0) => {
    const track = current.value;
    const token = ++loadToken;
    audio.pause();
    loadedVideoId = null;
    currentTime.value = startAt;
    duration.value = track?.durationSeconds ?? 0;

    if (!track) {
      audio.removeAttribute("src");
      audio.load();
      loadState.value = "idle";
      return;
    }

    loadState.value = "loading";
    try {
      const url = await resolveUrl(track.videoId);
      if (token !== loadToken) return;
      audio.src = url;
      if (startAt) audio.currentTime = startAt;
      loadedVideoId = track.videoId;
      loadState.value = "ready";
      if (autoplay) await audio.play();
      consecutiveFailures = 0;
    } catch (error) {
      if (token !== loadToken) return;
      // play() rejected by autoplay policy: track is ready, just paused
      if (error instanceof DOMException && error.name === "NotAllowedError") return;
      handleLoadError(autoplay);
    }
  };

  const handleLoadError = (autoplay: boolean) => {
    loadState.value = "error";
    isPlaying.value = false;
    consecutiveFailures++;
    const ui = useUiStore();
    if (autoplay && consecutiveFailures < 3 && index.value < queue.value.length - 1) {
      ui.toast("Трек недоступен, включаем следующий", "error");
      index.value++;
      void load(true);
    } else {
      ui.toast("Не удалось загрузить трек. Проверьте, что бэкенд запущен", "error");
    }
  };

  // ---------- audio events ----------
  audio.addEventListener("play", () => (isPlaying.value = true));
  audio.addEventListener("pause", () => (isPlaying.value = false));
  audio.addEventListener("waiting", () => (isBuffering.value = true));
  audio.addEventListener("playing", () => {
    isBuffering.value = false;
    retriedExpired = false;
    prefetchNext();
  });
  audio.addEventListener("canplay", () => (isBuffering.value = false));
  audio.addEventListener("timeupdate", () => {
    currentTime.value = audio.currentTime;
  });
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) duration.value = audio.duration;
    updatePositionState();
  });
  audio.addEventListener("ended", () => {
    if (repeat.value === "one") {
      audio.currentTime = 0;
      void audio.play();
      return;
    }
    next(true);
  });
  audio.addEventListener("error", () => {
    if (!loadedVideoId || loadState.value !== "ready") return;
    // Stream URLs expire after a few hours: drop the cached one and retry once.
    urlCache.delete(loadedVideoId);
    if (!retriedExpired) {
      retriedExpired = true;
      void load(isPlaying.value || !audio.paused, audio.currentTime || currentTime.value);
      return;
    }
    handleLoadError(false);
  });

  // ---------- controls ----------
  const togglePlay = async () => {
    if (!current.value) return;
    if (loadState.value === "loading") return;
    if (loadedVideoId !== current.value.videoId || loadState.value === "error") {
      await load(true, loadState.value === "error" ? 0 : currentTime.value);
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        useUiStore().toast("Браузер заблокировал воспроизведение", "error");
      }
    } else {
      audio.pause();
    }
  };

  const playAt = (i: number) => {
    if (!queue.value[i]) return;
    index.value = i;
    void load(true);
  };

  /** Start playing a list of tracks (a page/context) from the given position. */
  const playList = (tracks: Track[], startIndex: number, key: string, label: string) => {
    if (!tracks.length) return;
    const start = tracks[startIndex] ?? tracks[0];
    originalQueue.value = [...tracks];
    contextKey.value = key;
    contextLabel.value = label;
    if (shuffle.value) {
      queue.value = [start, ...shuffled(tracks.filter((t) => t !== start))];
      index.value = 0;
    } else {
      queue.value = [...tracks];
      index.value = tracks.indexOf(start);
    }
    consecutiveFailures = 0;
    void load(true);
  };

  const isContextActive = (key: string) => contextKey.value === key && !!current.value;

  const next = (auto = false) => {
    if (!queue.value.length) return;
    if (index.value < queue.value.length - 1) {
      index.value++;
    } else if (repeat.value === "all") {
      index.value = 0;
    } else {
      if (auto) {
        // End of queue: stop and rewind like Spotify does.
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }
    void load(true);
  };

  const prev = () => {
    if (!queue.value.length) return;
    if (currentTime.value > 3 || (index.value === 0 && repeat.value !== "all")) {
      seek(0);
      return;
    }
    index.value = index.value > 0 ? index.value - 1 : queue.value.length - 1;
    void load(true);
  };

  const seek = (seconds: number) => {
    const max = duration.value || audio.duration || 0;
    const target = Math.max(0, max ? Math.min(seconds, max - 0.25) : seconds);
    currentTime.value = target;
    if (loadedVideoId === current.value?.videoId) audio.currentTime = target;
    updatePositionState();
  };

  const seekBy = (delta: number) => seek(currentTime.value + delta);

  const setVolume = (value: number) => {
    volume.value = Math.min(1, Math.max(0, value));
    audio.volume = volume.value;
    if (volume.value > 0 && muted.value) muted.value = false;
    if (volume.value === 0) muted.value = true;
  };

  const toggleMute = () => {
    if (muted.value && volume.value === 0) setVolume(0.5);
    muted.value = !muted.value;
  };

  watch(muted, (value) => {
    audio.muted = value;
    storage.set("player.muted", value);
  });
  watch(volume, (value) => storage.set("player.volume", value));

  const toggleShuffle = () => {
    shuffle.value = !shuffle.value;
    const now = current.value;
    if (!now) return;
    if (shuffle.value) {
      originalQueue.value = [...queue.value];
      const rest = queue.value.filter((_, i) => i !== index.value);
      queue.value = [now, ...shuffled(rest)];
      index.value = 0;
    } else {
      // keep manually queued tracks that are missing from the original order
      const known = new Set(originalQueue.value);
      const extra = queue.value.filter((t) => !known.has(t));
      queue.value = [...originalQueue.value, ...extra];
      index.value = Math.max(0, queue.value.indexOf(now));
    }
    prefetchNext();
  };

  const cycleRepeat = () => {
    repeat.value = repeat.value === "off" ? "all" : repeat.value === "all" ? "one" : "off";
  };

  watch(shuffle, (v) => storage.set("player.shuffle", v));
  watch(repeat, (v) => storage.set("player.repeat", v));

  // ---------- queue editing ----------
  const playNext = (track: Track) => {
    const ui = useUiStore();
    if (!current.value) {
      playList([track], 0, `track:${track.videoId}`, track.title);
      return;
    }
    const copy = { ...track };
    queue.value.splice(index.value + 1, 0, copy);
    const pos = originalQueue.value.indexOf(current.value);
    originalQueue.value.splice(pos + 1, 0, copy);
    ui.toast("Будет воспроизведено следующим");
    prefetchNext();
  };

  const addToQueue = (track: Track) => {
    if (!current.value) {
      playList([track], 0, `track:${track.videoId}`, track.title);
      return;
    }
    const copy = { ...track };
    queue.value.push(copy);
    originalQueue.value.push(copy);
    useUiStore().toast("Добавлено в очередь");
  };

  const removeFromQueue = (i: number) => {
    if (i <= index.value || !queue.value[i]) return;
    const [removed] = queue.value.splice(i, 1);
    originalQueue.value = originalQueue.value.filter((t) => t !== removed);
  };

  const clearUpNext = () => {
    const now = current.value;
    if (!now) return;
    queue.value = [now];
    originalQueue.value = [now];
    index.value = 0;
  };

  // ---------- persistence ----------
  let persistTimer: number | undefined;
  watch(
    [queue, index, contextKey],
    () => {
      clearTimeout(persistTimer);
      persistTimer = window.setTimeout(() => {
        // keep a window around the current track so storage stays small
        const start = Math.max(0, index.value - 50);
        const q = queue.value.slice(start, start + MAX_PERSISTED_QUEUE);
        const order = originalQueue.value.map((t) => q.indexOf(t)).filter((i) => i >= 0);
        storage.set("player.queue", {
          queue: q,
          order,
          index: index.value - start,
          contextKey: contextKey.value,
          contextLabel: contextLabel.value,
        } satisfies PersistedQueue);
      }, 400);
    },
    { deep: true },
  );

  // ---------- media session & title ----------
  const mediaSession = "mediaSession" in navigator ? navigator.mediaSession : null;

  function updatePositionState() {
    if (!mediaSession?.setPositionState || !duration.value) return;
    try {
      mediaSession.setPositionState({
        duration: duration.value,
        position: Math.min(currentTime.value, duration.value),
        playbackRate: 1,
      });
    } catch {
      // ignore invalid state
    }
  }

  if (mediaSession) {
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void togglePlay()],
      ["pause", () => audio.pause()],
      ["previoustrack", () => prev()],
      ["nexttrack", () => next()],
      ["seekbackward", (d) => seekBy(-(d.seekOffset ?? 10))],
      ["seekforward", (d) => seekBy(d.seekOffset ?? 10)],
      ["seekto", (d) => d.seekTime !== undefined && seek(d.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // action not supported
      }
    }
  }

  watch(
    current,
    (track) => {
      if (!mediaSession) return;
      mediaSession.metadata = track
        ? new MediaMetadata({
            title: track.title,
            artist: artistsText(track),
            album: track.album?.name ?? "",
            artwork: track.thumbnail ? [{ src: track.thumbnail, sizes: "544x544" }] : [],
          })
        : null;
    },
    { immediate: true },
  );

  watch(isPlaying, (playing) => {
    if (mediaSession) mediaSession.playbackState = playing ? "playing" : "paused";
  });

  watch(
    [current, isPlaying],
    ([track, playing]) => {
      document.title =
        track && playing ? `${track.title} • ${artistsText(track)}` : "Музыкалити";
    },
    { immediate: true },
  );

  return {
    queue,
    index,
    current,
    upNext,
    contextKey,
    contextLabel,
    isPlaying,
    isLoading,
    loadState,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    hasNext,
    togglePlay,
    playList,
    playAt,
    isContextActive,
    next,
    prev,
    seek,
    seekBy,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    playNext,
    addToQueue,
    removeFromQueue,
    clearUpNext,
  };
});
