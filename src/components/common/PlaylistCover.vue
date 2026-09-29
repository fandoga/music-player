<script setup lang="ts">
import { Heart, ListMusic } from "@lucide/vue";
import TrackCover from "./TrackCover.vue";

defineProps<{
  covers?: string[];
  liked?: boolean;
  iconSize?: number;
}>();
</script>

<template>
  <div class="overflow-hidden">
    <div
      v-if="liked"
      class="flex size-full items-center justify-center bg-gradient-to-br from-[#5b21b6] via-[#8b5cf6] to-[#d8b4fe] text-fg"
    >
      <Heart :size="iconSize ?? 18" fill="currentColor" stroke-width="0" />
    </div>
    <div v-else-if="covers && covers.length >= 4" class="grid size-full grid-cols-2 grid-rows-2">
      <TrackCover v-for="src in covers.slice(0, 4)" :key="src" :src="src" class="size-full" />
    </div>
    <TrackCover v-else-if="covers && covers.length" :src="covers[0]" class="size-full" />
    <div
      v-else
      class="flex size-full items-center justify-center bg-gradient-to-br from-highlight to-elevated text-subtle"
    >
      <ListMusic :size="iconSize ?? 18" />
    </div>
  </div>
</template>
