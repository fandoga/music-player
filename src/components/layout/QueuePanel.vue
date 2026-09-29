<script setup lang="ts">
import { ListMusic, Play, X } from "@lucide/vue";
import { computed } from "vue";
import { artistsText } from "../../lib/format";
import { usePlayerStore } from "../../stores/player";
import { useUiStore } from "../../stores/ui";
import Equalizer from "../common/Equalizer.vue";
import LikeButton from "../common/LikeButton.vue";
import TrackCover from "../common/TrackCover.vue";

const player = usePlayerStore();
const ui = useUiStore();

const upNext = computed(() =>
  player.upNext.map((track, i) => ({ track, index: player.index + 1 + i })),
);

const openMenu = (e: MouseEvent, index: number) => {
  const track = player.queue[index];
  if (track) ui.openTrackMenu({ x: e.clientX, y: e.clientY, track });
};
</script>

<template>
  <aside class="flex w-[340px] flex-col overflow-hidden rounded-lg bg-surface" aria-label="Очередь воспроизведения">
    <div class="flex h-16 shrink-0 items-center justify-between pl-4 pr-3">
      <h2 class="font-bold">Сейчас играет</h2>
      <button
        type="button"
        v-tip="'Закрыть (Q)'"
        class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-elevated hover:text-fg"
        @click="ui.queueOpen = false"
      >
        <X :size="18" />
      </button>
    </div>

    <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      <div v-if="!player.current" class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span class="flex size-16 items-center justify-center rounded-full bg-elevated text-muted">
          <ListMusic :size="28" />
        </span>
        <p class="font-bold">Очередь пуста</p>
        <p class="text-sm text-muted">Включите трек из чартов, поиска или своей медиатеки — он появится здесь.</p>
      </div>

      <template v-else>
        <!-- now playing -->
        <div class="relative">
          <TrackCover
            :key="player.current.videoId"
            :src="player.current.thumbnail"
            :alt="player.current.title"
            :icon-size="56"
            class="aspect-square w-full animate-fade-in rounded-lg shadow-[0_12px_32px_rgb(0_0_0/0.5)]"
          />
        </div>
        <div class="mt-4 flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-2xl font-bold leading-tight" :title="player.current.title">
              {{ player.current.title }}
            </h3>
            <p class="truncate text-muted" :title="artistsText(player.current)">
              {{ artistsText(player.current) }}
            </p>
          </div>
          <LikeButton :track="player.current" :size="22" always-visible class="mt-1" />
        </div>

        <!-- up next -->
        <section class="mt-6 rounded-lg bg-elevated p-3">
          <div class="mb-2 flex items-center justify-between gap-2 px-1">
            <h3 class="truncate font-bold">
              Далее
              <span v-if="player.contextLabel" class="font-normal text-muted">
                из «{{ player.contextLabel }}»
              </span>
            </h3>
            <button
              v-if="upNext.length"
              type="button"
              class="shrink-0 text-sm font-semibold text-muted transition hover:text-fg hover:underline"
              @click="player.clearUpNext()"
            >
              Очистить
            </button>
          </div>

          <p v-if="!upNext.length" class="px-1 py-3 text-sm text-muted">
            {{ player.repeat === "all" ? "Очередь начнётся заново" : "Больше ничего нет — добавьте треки в очередь через меню «…»" }}
          </p>

          <TransitionGroup tag="ol" name="queue" class="relative">
            <li
              v-for="{ track, index } in upNext.slice(0, 80)"
              :key="`${index}-${track.videoId}`"
              class="group flex cursor-default items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-white/[0.07]"
              @click="player.playAt(index)"
              @contextmenu.prevent="openMenu($event, index)"
            >
              <div class="relative size-10 shrink-0">
                <TrackCover :src="track.thumbnailSmall || track.thumbnail" class="size-10 rounded" />
                <span
                  class="absolute inset-0 flex items-center justify-center rounded bg-black/50 opacity-0 transition group-hover:opacity-100"
                >
                  <Play :size="16" fill="currentColor" stroke-width="0" />
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">{{ track.title }}</div>
                <div class="truncate text-[13px] text-muted">{{ artistsText(track) }}</div>
              </div>
              <button
                type="button"
                v-tip="'Убрать из очереди'"
                class="rounded-full p-1 text-muted opacity-0 transition hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
                @click.stop="player.removeFromQueue(index)"
              >
                <X :size="16" />
              </button>
            </li>
          </TransitionGroup>
          <p v-if="upNext.length > 80" class="px-1 pt-2 text-sm text-muted">
            и ещё {{ upNext.length - 80 }}
          </p>
        </section>

        <div v-if="player.isPlaying" class="mt-4 flex items-center gap-2 px-1 text-xs text-subtle">
          <Equalizer /> Воспроизводится{{ player.current.source === "video" ? " видео с YouTube" : "" }}
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.queue-move,
.queue-enter-active,
.queue-leave-active {
  transition: all 0.2s ease;
}
.queue-enter-from,
.queue-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.queue-leave-active {
  position: absolute;
  width: 100%;
}
</style>
