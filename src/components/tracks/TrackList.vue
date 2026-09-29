<script setup lang="ts">
import { Clock3 } from "@lucide/vue";
import type { Track } from "../../lib/types";
import { usePlayerStore } from "../../stores/player";
import TrackRow from "./TrackRow.vue";

const props = withDefaults(
  defineProps<{
    tracks: Track[];
    /** full list to enqueue when a row is played (defaults to `tracks`) */
    queueTracks?: Track[];
    contextKey: string;
    contextLabel: string;
    loading?: boolean;
    showAlbum?: boolean;
    showHeader?: boolean;
    playlistId?: number;
    skeletonCount?: number;
  }>(),
  { showAlbum: true, showHeader: true, skeletonCount: 10 },
);

const player = usePlayerStore();

const play = (index: number) => {
  player.playList(props.queueTracks ?? props.tracks, index, props.contextKey, props.contextLabel);
};
</script>

<template>
  <div>
    <div
      v-if="showHeader"
      class="sticky top-16 z-10 mb-2 grid h-9 items-center gap-4 border-b border-white/10 bg-surface px-4 text-sm text-muted max-sm:hidden"
      :class="
        showAlbum
          ? 'grid-cols-[1.25rem_minmax(0,4fr)_minmax(0,2fr)_auto] max-lg:grid-cols-[1.25rem_minmax(0,1fr)_auto]'
          : 'grid-cols-[1.25rem_minmax(0,1fr)_auto]'
      "
    >
      <span class="text-right">#</span>
      <span>Название</span>
      <span v-if="showAlbum" class="max-lg:hidden">Альбом</span>
      <span class="flex justify-end gap-3 pr-[38px]">
        <span class="flex w-11 justify-end" v-tip="'Длительность'"><Clock3 :size="16" /></span>
      </span>
    </div>

    <ul v-if="loading" aria-busy="true" aria-label="Загрузка треков">
      <li
        v-for="i in skeletonCount"
        :key="i"
        class="grid h-14 grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-4 px-4"
      >
        <span class="ml-auto h-3 w-3 animate-pulse rounded bg-white/10" />
        <span class="flex items-center gap-3">
          <span class="size-10 animate-pulse rounded bg-white/10" />
          <span class="flex flex-col gap-2">
            <span
              class="h-3 animate-pulse rounded bg-white/10"
              :style="{ width: `${120 + ((i * 53) % 140)}px` }"
            />
            <span
              class="h-2.5 animate-pulse rounded bg-white/[0.07]"
              :style="{ width: `${70 + ((i * 37) % 90)}px` }"
            />
          </span>
        </span>
        <span class="h-3 w-10 animate-pulse rounded bg-white/10" />
      </li>
    </ul>

    <ol v-else>
      <TrackRow
        v-for="(track, i) in tracks"
        :key="track.videoId"
        :track="track"
        :position="i + 1"
        :show-album="showAlbum"
        :context-key="contextKey"
        :playlist-id="playlistId"
        @play="play(i)"
      />
    </ol>
  </div>
</template>
