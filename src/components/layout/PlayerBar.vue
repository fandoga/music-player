<script setup lang="ts">
import {
  ListMusic,
  LoaderCircle,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "@lucide/vue";
import { computed, ref } from "vue";
import { artistsText, formatTime } from "../../lib/format";
import { usePlayerStore } from "../../stores/player";
import { useUiStore } from "../../stores/ui";
import LikeButton from "../common/LikeButton.vue";
import Slider from "../common/Slider.vue";
import TrackCover from "../common/TrackCover.vue";

const player = usePlayerStore();
const ui = useUiStore();

const track = computed(() => player.current);
const disabled = computed(() => !track.value);

// ---------- progress ----------
const scrubbing = ref<number | null>(null);
const progress = computed(() =>
  player.duration ? (scrubbing.value ?? player.currentTime) / player.duration : 0,
);
const shownTime = computed(() =>
  scrubbing.value !== null ? scrubbing.value : player.currentTime,
);
const onScrub = (v: number) => (scrubbing.value = v * player.duration);
const onSeek = (v: number) => {
  player.seek(v * player.duration);
  scrubbing.value = null;
};

// ---------- volume ----------
const shownVolume = computed(() => (player.muted ? 0 : player.volume));
const VolumeIcon = computed(() => {
  const v = shownVolume.value;
  if (v === 0) return VolumeX;
  if (v < 0.34) return Volume;
  if (v < 0.67) return Volume1;
  return Volume2;
});

const repeatLabel = computed(
  () =>
    ({
      off: "Включить повтор",
      all: "Повторять трек",
      one: "Выключить повтор",
    })[player.repeat],
);
</script>

<template>
  <footer class="relative grid h-[76px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-2 md:grid-cols-[minmax(180px,30%)_minmax(0,40%)_minmax(180px,30%)]">
    <!-- now playing -->
    <div class="flex min-w-0 items-center gap-3">
      <template v-if="track">
        <button
          type="button"
          v-tip="ui.queueOpen ? 'Скрыть панель «Сейчас играет»' : 'Показать панель «Сейчас играет»'"
          class="group relative size-14 shrink-0 overflow-hidden rounded-md shadow-[0_4px_12px_rgb(0_0_0/0.4)]"
          @click="ui.queueOpen = !ui.queueOpen"
        >
          <TrackCover :key="track.videoId" :src="track.thumbnailSmall || track.thumbnail" :alt="track.title" class="size-full" />
        </button>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold" :title="track.title">{{ track.title }}</div>
          <div class="truncate text-xs text-muted" :title="artistsText(track)">{{ artistsText(track) }}</div>
        </div>
        <LikeButton :track="track" :size="18" always-visible class="ml-1 shrink-0" />
      </template>
      <div v-else class="flex items-center gap-3 text-sm text-subtle">
        <span class="size-14 rounded-md bg-elevated" />
        <span class="max-sm:hidden">Выберите трек, чтобы начать</span>
      </div>
    </div>

    <!-- controls -->
    <div class="flex flex-col items-center gap-1">
      <div class="flex items-center gap-4 md:gap-5">
        <button
          type="button"
          v-tip="player.shuffle ? 'Не перемешивать (S)' : 'Перемешать (S)'"
          :aria-pressed="player.shuffle"
          class="relative text-muted transition hover:scale-105 hover:text-fg max-md:hidden"
          :class="player.shuffle ? 'text-accent-hi hover:text-accent-hi' : ''"
          @click="player.toggleShuffle()"
        >
          <Shuffle :size="18" />
          <span v-if="player.shuffle" class="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent-hi" />
        </button>
        <button
          type="button"
          v-tip="'Назад'"
          :disabled="disabled"
          class="text-muted transition hover:scale-105 hover:text-fg disabled:opacity-40 disabled:hover:scale-100 max-md:hidden"
          @click="player.prev()"
        >
          <SkipBack :size="20" fill="currentColor" />
        </button>
        <button
          type="button"
          v-tip="player.isPlaying ? 'Пауза (пробел)' : 'Слушать (пробел)'"
          :disabled="disabled"
          class="flex size-9 items-center justify-center rounded-full bg-fg text-app transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          @click="player.togglePlay()"
        >
          <LoaderCircle v-if="player.isLoading && !disabled" :size="18" class="animate-spin" />
          <Pause v-else-if="player.isPlaying" :size="18" fill="currentColor" stroke-width="0" />
          <Play v-else :size="18" fill="currentColor" stroke-width="0" class="ml-0.5" />
        </button>
        <button
          type="button"
          v-tip="'Далее'"
          :disabled="disabled || !player.hasNext"
          class="text-muted transition hover:scale-105 hover:text-fg disabled:opacity-40 disabled:hover:scale-100"
          @click="player.next()"
        >
          <SkipForward :size="20" fill="currentColor" />
        </button>
        <button
          type="button"
          v-tip="`${repeatLabel} (R)`"
          :aria-pressed="player.repeat !== 'off'"
          class="relative text-muted transition hover:scale-105 hover:text-fg max-md:hidden"
          :class="player.repeat !== 'off' ? 'text-accent-hi hover:text-accent-hi' : ''"
          @click="player.cycleRepeat()"
        >
          <Repeat1 v-if="player.repeat === 'one'" :size="18" />
          <Repeat v-else :size="18" />
          <span v-if="player.repeat !== 'off'" class="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent-hi" />
        </button>
      </div>

      <div class="flex w-full items-center gap-2 text-xs tabular-nums text-muted max-md:hidden">
        <span class="w-10 text-right">{{ formatTime(shownTime) }}</span>
        <Slider
          :value="progress"
          :disabled="disabled || !player.duration"
          label="Позиция воспроизведения"
          :value-text="`${formatTime(shownTime)} из ${formatTime(player.duration)}`"
          :step="5 / (player.duration || 100)"
          @input="onScrub"
          @change="onSeek"
        />
        <span class="w-10">{{ formatTime(player.duration) }}</span>
      </div>
    </div>

    <!-- extra -->
    <div class="flex items-center justify-end gap-3 max-md:hidden">
      <button
        type="button"
        v-tip="'Очередь (Q)'"
        :aria-pressed="ui.queueOpen"
        class="relative text-muted transition hover:scale-105 hover:text-fg"
        :class="ui.queueOpen ? 'text-accent-hi hover:text-accent-hi' : ''"
        @click="ui.queueOpen = !ui.queueOpen"
      >
        <ListMusic :size="18" />
        <span v-if="ui.queueOpen" class="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent-hi" />
      </button>
      <button
        type="button"
        v-tip="player.muted ? 'Включить звук (M)' : 'Выключить звук (M)'"
        class="text-muted transition hover:scale-105 hover:text-fg"
        @click="player.toggleMute()"
      >
        <component :is="VolumeIcon" :size="18" />
      </button>
      <div class="w-[100px] xl:w-[120px]">
        <Slider
          :value="shownVolume"
          label="Громкость"
          :value-text="`${Math.round(shownVolume * 100)}%`"
          @input="player.setVolume"
          @change="player.setVolume"
        />
      </div>
    </div>

    <!-- mobile progress line -->
    <div
      v-if="track"
      class="pointer-events-none absolute inset-x-3 top-0 h-0.5 overflow-hidden rounded-full bg-white/10 md:hidden"
    >
      <div class="h-full bg-accent-hi" :style="{ width: `${progress * 100}%` }" />
    </div>
  </footer>
</template>
