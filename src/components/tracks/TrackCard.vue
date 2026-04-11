<script setup lang="ts">
import { CirclePlay } from "@lucide/vue";
import type { Song } from "../../lib/types";
import { useTrackStore } from "../../stores/track";

const props = defineProps<{
  song: Song;
}>();

const trackStore = useTrackStore();
</script>

<template>
  <li
    class="w-full flex items-center group gap-2 hover:bg-accent-bg cursor-pointer rounded-lg p-2 border-1 border-border"
    @click="trackStore.setCurrentTrack(props.song)"
  >
    <div class="relative rounded-xl overflow-hidden w-15 h-10">
      <div
        class="absolute w-full h-full flex items-center justify-center group-hover:opacity-100 z-10 opacity-0"
      >
        <CirclePlay :size="30" />
      </div>
      <img
        class="object-cover transition-[opacity] group-hover:opacity-60 bg-repeat w-full h-full"
        :src="song.thumbnails?.[0]?.url"
      />
    </div>
    <div class="flex flex-col items-start justify-center">
      <p class="font-semibold">
        {{ song.title?.slice(0, 70) || "Unknown title" }}
      </p>
      <p class="text-muted text-sm">
        {{
          song.artists
            ?.map((artist) => artist.name)
            .filter(Boolean)
            .join(", ") || "Unknown artist"
        }}
      </p>
    </div>
  </li>
</template>
