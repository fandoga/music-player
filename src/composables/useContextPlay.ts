import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { Track } from "../lib/types";
import { usePlayerStore } from "../stores/player";

/** Play/pause state for a whole page (charts, a playlist, search results...). */
export const useContextPlay = (
  key: MaybeRefOrGetter<string>,
  tracks: MaybeRefOrGetter<Track[]>,
  label: MaybeRefOrGetter<string>,
) => {
  const player = usePlayerStore();
  const active = computed(() => player.isContextActive(toValue(key)));

  const toggle = () => {
    if (active.value) {
      void player.togglePlay();
      return;
    }
    const list = toValue(tracks);
    if (!list.length) return;
    player.playList(list, player.shuffle ? Math.floor(Math.random() * list.length) : 0, toValue(key), toValue(label));
  };

  return {
    active,
    playing: computed(() => active.value && player.isPlaying),
    loading: computed(() => active.value && player.isLoading),
    toggle,
  };
};
