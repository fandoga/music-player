<script setup lang="ts">
import {
  ChevronRight,
  ExternalLink,
  Heart,
  ListEnd,
  ListMusic,
  ListStart,
  Plus,
  Trash2,
} from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { artistsText, youtubeUrl } from "../../lib/format";
import type { Track } from "../../lib/types";
import { useAuthStore } from "../../stores/auth";
import { useLibraryStore } from "../../stores/library";
import { usePlayerStore } from "../../stores/player";
import { useUiStore } from "../../stores/ui";
import TrackCover from "../common/TrackCover.vue";

const ui = useUiStore();
const auth = useAuthStore();
const library = useLibraryStore();
const player = usePlayerStore();
const route = useRoute();

const menu = ref<HTMLElement>();
const pos = ref({ left: 0, top: 0 });
const submenuOpen = ref(false);
const submenuLeft = ref(false);
// no room for a side submenu on phones: expand it inside the menu instead
const submenuInline = ref(false);

const state = computed(() => ui.trackMenu);
const track = computed(() => state.value?.track);
const liked = computed(() => library.isLiked(track.value?.videoId));

const close = () => {
  ui.closeTrackMenu();
  submenuOpen.value = false;
};

// clamp into the viewport once the menu size is known
watch(
  state,
  async (s) => {
    if (!s) return;
    submenuOpen.value = false;
    pos.value = { left: s.x, top: s.y };
    await nextTick();
    const rect = menu.value?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    let left = s.x;
    let top = s.y;
    // menus opened from the "…" button align their right edge with it
    if (left + rect.width > window.innerWidth - margin) left = Math.max(margin, left - rect.width);
    if (top + rect.height > window.innerHeight - margin)
      top = Math.max(margin, window.innerHeight - rect.height - margin);
    pos.value = { left, top };
    submenuInline.value = window.innerWidth < rect.width + 240 + 2 * margin;
    submenuLeft.value = left + rect.width + 240 > window.innerWidth;
    menu.value?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  },
  { immediate: true },
);

watch(submenuOpen, async (open) => {
  if (!open || !submenuInline.value) return;
  await nextTick();
  const rect = menu.value?.getBoundingClientRect();
  if (rect && rect.bottom > window.innerHeight - 8)
    pos.value = { ...pos.value, top: Math.max(8, window.innerHeight - rect.height - 8) };
});

watch(() => route.fullPath, close);

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    if (submenuOpen.value) submenuOpen.value = false;
    else close();
    return;
  }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const items = [...(menu.value?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  }
};

const onWindow = () => close();
const onScroll = (e: Event) => {
  if (menu.value?.contains(e.target as Node)) return;
  close();
};
onMounted(() => {
  window.addEventListener("resize", onWindow);
  window.addEventListener("blur", onWindow);
  document.addEventListener("scroll", onScroll, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onWindow);
  window.removeEventListener("blur", onWindow);
  document.removeEventListener("scroll", onScroll, true);
});

// The menu closes first, so actions receive the track (and playlist) captured beforehand.
const run = (action: (track: Track, playlistId?: number) => unknown) => {
  const t = track.value;
  const playlistId = state.value?.playlistId;
  close();
  if (t) void action(t, playlistId);
};

const openSubmenu = () => {
  if (!auth.user) {
    const t = track.value;
    close();
    if (t) ui.openLogin("Войдите, чтобы добавлять треки в плейлисты");
    return;
  }
  submenuOpen.value = true;
};
</script>

<template>
  <div v-if="state && track" class="fixed inset-0 z-[150]" @pointerdown.self="close" @contextmenu.prevent="close">
    <div
      ref="menu"
      role="menu"
      :aria-label="`Действия: ${track.title}`"
      class="absolute w-[280px] animate-pop-in rounded-md bg-highlight p-1 text-sm shadow-[0_16px_40px_rgb(0_0_0/0.6)] ring-1 ring-white/5"
      :class="submenuInline ? 'scroll-area max-h-[calc(100dvh-16px)] overflow-y-auto' : ''"
      :style="{ left: `${pos.left}px`, top: `${pos.top}px` }"
      @keydown="onKeydown"
    >
      <div class="flex items-center gap-3 border-b border-white/10 px-2 pb-2 pt-1.5">
        <TrackCover :src="track.thumbnailSmall || track.thumbnail" class="size-9 shrink-0 rounded" />
        <div class="min-w-0">
          <div class="truncate font-semibold">{{ track.title }}</div>
          <div class="truncate text-xs text-muted">{{ artistsText(track) }}</div>
        </div>
      </div>

      <div class="py-1">
        <button role="menuitem" class="menu-item" @click="run((t) => player.playNext(t))">
          <ListStart :size="16" /> Воспроизвести следующим
        </button>
        <button role="menuitem" class="menu-item" @click="run((t) => player.addToQueue(t))">
          <ListEnd :size="16" /> Добавить в конец очереди
        </button>
      </div>

      <div class="border-t border-white/10 py-1">
        <button role="menuitem" class="menu-item" @click="run((t) => library.toggleLike(t))">
          <Heart
            :size="16"
            :class="liked ? 'text-accent-hi' : ''"
            :fill="liked ? 'currentColor' : 'none'"
          />
          {{ liked ? "Удалить из «Любимых треков»" : "Добавить в «Любимые треки»" }}
        </button>

        <div
          class="relative"
          @mouseenter="auth.user && !submenuInline && (submenuOpen = true)"
          @mouseleave="!submenuInline && (submenuOpen = false)"
        >
          <button
            role="menuitem"
            aria-haspopup="menu"
            :aria-expanded="submenuOpen"
            class="menu-item"
            @click="submenuInline && submenuOpen ? (submenuOpen = false) : openSubmenu()"
            @keydown.right.prevent="openSubmenu"
          >
            <Plus :size="16" /> Добавить в плейлист
            <ChevronRight
              :size="16"
              class="ml-auto transition-transform"
              :class="submenuInline && submenuOpen ? 'rotate-90' : ''"
            />
          </button>

          <div
            v-if="submenuOpen"
            role="menu"
            class="scroll-area max-h-[320px] overflow-y-auto rounded-md p-1"
            :class="
              submenuInline
                ? 'ml-4 max-h-[200px] border-l border-white/10'
                : [
                    'absolute top-0 w-[240px] bg-highlight shadow-[0_16px_40px_rgb(0_0_0/0.6)] ring-1 ring-white/5',
                    submenuLeft ? 'right-full mr-1' : 'left-full ml-1',
                  ]
            "
          >
            <button role="menuitem" class="menu-item" @click="run((t) => library.createPlaylist(t))">
              <Plus :size="16" /> Новый плейлист
            </button>
            <div v-if="library.playlists.length" class="my-1 border-t border-white/10" />
            <button
              v-for="p in library.playlists"
              :key="p.id"
              role="menuitem"
              class="menu-item"
              @click="run((t) => library.addToPlaylist(p.id, t))"
            >
              <ListMusic :size="16" /> <span class="truncate">{{ p.name }}</span>
            </button>
          </div>
        </div>

        <button
          v-if="state.playlistId"
          role="menuitem"
          class="menu-item"
          @click="run((t, pid) => pid && library.removeFromPlaylist(pid, t))"
        >
          <Trash2 :size="16" /> Удалить из этого плейлиста
        </button>
      </div>

      <div class="border-t border-white/10 pt-1">
        <a
          role="menuitem"
          class="menu-item"
          :href="youtubeUrl(track)"
          target="_blank"
          rel="noopener noreferrer"
          @click="close"
        >
          <ExternalLink :size="16" />
          {{ track.source === "video" ? "Открыть на YouTube" : "Открыть в YouTube Music" }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../style.css";

.menu-item {
  @apply flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-fg/90 outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10;
}
:where(.menu-item) :deep(svg) {
  @apply shrink-0 text-muted;
}
</style>
