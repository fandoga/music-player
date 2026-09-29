<script setup lang="ts">
import { Heart } from "@lucide/vue";
import { computed, ref } from "vue";
import type { Track } from "../../lib/types";
import { useLibraryStore } from "../../stores/library";

const props = withDefaults(defineProps<{ track: Track; size?: number; alwaysVisible?: boolean }>(), {
  size: 18,
});

const library = useLibraryStore();
const liked = computed(() => library.isLiked(props.track.videoId));
const bump = ref(false);

const onClick = () => {
  if (!liked.value) {
    bump.value = true;
    setTimeout(() => (bump.value = false), 300);
  }
  void library.toggleLike(props.track);
};
</script>

<template>
  <button
    type="button"
    v-tip="liked ? 'Удалить из «Любимых треков»' : 'Добавить в «Любимые треки»'"
    :aria-pressed="liked"
    class="flex items-center justify-center rounded-full p-1 transition hover:scale-105 active:scale-95"
    :class="[
      liked ? 'text-accent-hi' : 'text-muted hover:text-fg',
      liked || alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
      bump ? 'scale-125' : '',
    ]"
    @click.stop="onClick"
    @dblclick.stop
  >
    <Heart :size="size" :fill="liked ? 'currentColor' : 'none'" :stroke-width="2" />
  </button>
</template>
