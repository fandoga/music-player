<script setup lang="ts">
import { Ellipsis, LoaderCircle, Pause, Play } from "@lucide/vue";
import { computed } from "vue";
import { artistsText, formatTime } from "../../lib/format";
import type { Track } from "../../lib/types";
import { usePlayerStore } from "../../stores/player";
import { useUiStore } from "../../stores/ui";
import Equalizer from "../common/Equalizer.vue";
import LikeButton from "../common/LikeButton.vue";
import TrackCover from "../common/TrackCover.vue";

const props = defineProps<{
  track: Track;
  position: number;
  showAlbum: boolean;
  contextKey: string;
  playlistId?: number;
}>();

const emit = defineEmits<{ play: [] }>();

const player = usePlayerStore();
const ui = useUiStore();

const isCurrent = computed(
  () =>
    player.current?.videoId === props.track.videoId &&
    (player.contextKey === props.contextKey || !player.contextKey),
);
const isPlaying = computed(() => isCurrent.value && player.isPlaying);
const isLoading = computed(() => isCurrent.value && player.loadState === "loading");

const onPlayClick = () => {
  if (isCurrent.value) void player.togglePlay();
  else emit("play");
};

// Clicking the row of the current track resumes it but never restarts it.
const onRowClick = () => {
  if (!isCurrent.value) emit("play");
  else if (!player.isPlaying) void player.togglePlay();
};

const openMenu = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const fromButton = e.type === "click";
  ui.openTrackMenu({
    x: fromButton ? rect.right : e.clientX,
    y: fromButton ? rect.bottom + 4 : e.clientY,
    track: props.track,
    playlistId: props.playlistId,
  });
};
</script>

<template>
  <li
    class="group grid h-14 cursor-default select-none items-center gap-4 rounded-md px-4 max-sm:gap-3 max-sm:px-2 transition-colors hover:bg-white/[0.07] focus-within:bg-white/[0.07]"
    :class="[
      showAlbum
        ? 'grid-cols-[1.25rem_minmax(0,4fr)_minmax(0,2fr)_auto] max-lg:grid-cols-[1.25rem_minmax(0,1fr)_auto]'
        : 'grid-cols-[1.25rem_minmax(0,1fr)_auto]',
      ui.trackMenu?.track.videoId === track.videoId ? 'bg-white/[0.1]' : '',
    ]"
    @click="onRowClick"
    @contextmenu.prevent="openMenu"
  >
    <!-- index / play state -->
    <div class="relative flex h-full items-center justify-end text-[15px] tabular-nums text-muted">
      <span
        class="group-hover:hidden group-focus-within:hidden"
        :class="isCurrent ? 'text-accent-hi' : ''"
      >
        <Equalizer v-if="isPlaying" />
        <template v-else>{{ position }}</template>
      </span>
      <button
        type="button"
        v-tip="isPlaying ? 'Пауза' : `Слушать «${track.title}»`"
        class="absolute right-0 hidden text-fg group-hover:block group-focus-within:block"
        @click.stop="onPlayClick"
      >
        <LoaderCircle v-if="isLoading" :size="16" class="animate-spin" />
        <Pause v-else-if="isPlaying" :size="16" fill="currentColor" stroke-width="0" />
        <Play v-else :size="16" fill="currentColor" stroke-width="0" />
      </button>
    </div>

    <!-- title -->
    <div class="flex min-w-0 items-center gap-3">
      <TrackCover
        :src="track.thumbnailSmall || track.thumbnail"
        :alt="track.title"
        class="size-10 shrink-0 rounded"
      />
      <div class="min-w-0">
        <div
          class="truncate text-[15px] font-medium leading-tight"
          :class="isCurrent ? 'text-accent-hi' : 'text-fg'"
          :title="track.title"
        >
          {{ track.title }}
        </div>
        <div class="truncate text-sm text-muted group-hover:text-fg/80" :title="artistsText(track)">
          {{ artistsText(track) }}
        </div>
      </div>
    </div>

    <!-- album -->
    <div v-if="showAlbum" class="truncate text-sm text-muted group-hover:text-fg/80 max-lg:hidden">
      {{ track.album?.name ?? "" }}
    </div>

    <!-- actions -->
    <div class="flex items-center justify-end gap-3">
      <LikeButton :track="track" :size="17" />
      <span class="w-11 text-right text-sm tabular-nums text-muted max-sm:hidden">
        {{ track.duration || formatTime(track.durationSeconds) }}
      </span>
      <button
        type="button"
        v-tip="`Другие действия: «${track.title}»`"
        class="rounded-full p-1 text-muted opacity-0 transition hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        @click.stop="openMenu"
        @dblclick.stop
      >
        <Ellipsis :size="18" />
      </button>
    </div>
  </li>
</template>
