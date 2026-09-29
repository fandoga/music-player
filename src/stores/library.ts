import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, ApiError } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import type { PlaylistSummary, Track } from "../lib/types";
import { useAuthStore } from "./auth";
import { useUiStore } from "./ui";

export const useLibraryStore = defineStore("library", () => {
  const likedTracks = ref<Track[]>([]);
  const playlists = ref<PlaylistSummary[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  const likedIds = computed(() => new Set(likedTracks.value.map((t) => t.videoId)));
  const isLiked = (videoId: string | undefined) => !!videoId && likedIds.value.has(videoId);

  const fail = (error: unknown, message: string) => {
    if (useAuthStore().handleUnauthorized(error)) return;
    useUiStore().toast(message, "error");
  };

  const requireUser = (reason: string) => {
    if (useAuthStore().user) return true;
    useUiStore().openLogin(reason);
    return false;
  };

  const load = async () => {
    loading.value = true;
    try {
      const [likes, lists] = await Promise.all([api.likes(), api.playlists()]);
      likedTracks.value = likes;
      playlists.value = lists;
      loaded.value = true;
    } catch (error) {
      fail(error, "Не удалось загрузить медиатеку");
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    likedTracks.value = [];
    playlists.value = [];
    loaded.value = false;
    queryClient.removeQueries({ queryKey: ["playlist"] });
  };

  const refreshPlaylists = async () => {
    try {
      playlists.value = await api.playlists();
    } catch (error) {
      fail(error, "Не удалось обновить плейлисты");
    }
  };

  // ---------- likes ----------

  const toggleLike = async (track: Track) => {
    if (!requireUser("Войдите, чтобы сохранять понравившиеся треки")) return;
    const ui = useUiStore();
    const snapshot = likedTracks.value;

    if (isLiked(track.videoId)) {
      likedTracks.value = snapshot.filter((t) => t.videoId !== track.videoId);
      try {
        await api.unlike(track.videoId);
        ui.toast("Удалено из «Любимых треков»");
      } catch (error) {
        likedTracks.value = snapshot;
        fail(error, "Не удалось убрать лайк");
      }
    } else {
      likedTracks.value = [track, ...snapshot];
      try {
        await api.like(track);
        ui.toast("Добавлено в «Любимые треки»");
      } catch (error) {
        likedTracks.value = snapshot;
        fail(error, "Не удалось поставить лайк");
      }
    }
  };

  // ---------- playlists ----------

  const createPlaylist = async (withTrack?: Track) => {
    if (!requireUser("Войдите, чтобы создавать плейлисты")) return null;
    const ui = useUiStore();
    const name = await ui.prompt({
      title: "Новый плейлист",
      placeholder: "Название плейлиста",
      initial: `Мой плейлист № ${playlists.value.length + 1}`,
      confirmLabel: "Создать",
    });
    if (!name) return null;

    try {
      const playlist = await api.createPlaylist(name);
      playlists.value = [playlist, ...playlists.value];
      if (withTrack) {
        await addToPlaylist(playlist.id, withTrack, { silent: true });
        ui.toast(`Добавлено в «${playlist.name}»`);
      } else {
        ui.toast(`Плейлист «${playlist.name}» создан`);
      }
      return playlist;
    } catch (error) {
      fail(error, "Не удалось создать плейлист");
      return null;
    }
  };

  const renamePlaylist = async (playlist: PlaylistSummary) => {
    const ui = useUiStore();
    const name = await ui.prompt({
      title: "Переименовать плейлист",
      placeholder: "Название плейлиста",
      initial: playlist.name,
      confirmLabel: "Сохранить",
    });
    if (!name || name === playlist.name) return;

    try {
      const updated = await api.renamePlaylist(playlist.id, name);
      playlists.value = playlists.value.map((p) => (p.id === updated.id ? updated : p));
      void queryClient.invalidateQueries({ queryKey: ["playlist", playlist.id] });
    } catch (error) {
      fail(error, "Не удалось переименовать плейлист");
    }
  };

  const deletePlaylist = async (playlist: PlaylistSummary) => {
    const ui = useUiStore();
    const ok = await ui.confirm({
      title: `Удалить «${playlist.name}»?`,
      description: "Плейлист будет удалён из вашей медиатеки. Это действие нельзя отменить.",
      confirmLabel: "Удалить",
      danger: true,
    });
    if (!ok) return false;

    try {
      await api.deletePlaylist(playlist.id);
      playlists.value = playlists.value.filter((p) => p.id !== playlist.id);
      queryClient.removeQueries({ queryKey: ["playlist", playlist.id] });
      ui.toast("Плейлист удалён");
      return true;
    } catch (error) {
      fail(error, "Не удалось удалить плейлист");
      return false;
    }
  };

  const addToPlaylist = async (
    playlistId: number,
    track: Track,
    { silent = false }: { silent?: boolean } = {},
  ) => {
    const ui = useUiStore();
    const playlist = playlists.value.find((p) => p.id === playlistId);
    try {
      await api.addToPlaylist(playlistId, track);
      if (!silent) ui.toast(`Добавлено в «${playlist?.name ?? "плейлист"}»`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        ui.toast(`Уже есть в «${playlist?.name ?? "плейлисте"}»`);
        return;
      }
      fail(error, "Не удалось добавить трек");
      return;
    }
    void refreshPlaylists();
    void queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
  };

  const removeFromPlaylist = async (playlistId: number, track: Track) => {
    try {
      await api.removeFromPlaylist(playlistId, track.videoId);
      useUiStore().toast("Удалено из плейлиста");
    } catch (error) {
      fail(error, "Не удалось удалить трек");
      return;
    }
    void refreshPlaylists();
    void queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
  };

  return {
    likedTracks,
    playlists,
    loading,
    loaded,
    likedIds,
    isLiked,
    load,
    reset,
    toggleLike,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };
});
