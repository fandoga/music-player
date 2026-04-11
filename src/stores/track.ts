import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Song } from "../lib/types";

export const useTrackStore = defineStore("track", () => {
  const currentTrack = ref<Song | null>(null);

  const hasCurrentTrack = computed(() => currentTrack.value !== null);

  const setCurrentTrack = (track: Song) => {
    currentTrack.value = track;
  };

  const clearCurrentTrack = () => {
    currentTrack.value = null;
  };

  return {
    currentTrack,
    hasCurrentTrack,
    setCurrentTrack,
    clearCurrentTrack,
  };
});
