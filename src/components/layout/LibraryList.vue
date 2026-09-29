<script setup lang="ts">
import { Pause, Play, Volume2 } from "@lucide/vue";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { api } from "../../lib/api";
import { tracksCount } from "../../lib/format";
import { queryClient } from "../../lib/queryClient";
import { useAuthStore } from "../../stores/auth";
import { useLibraryStore } from "../../stores/library";
import { usePlayerStore } from "../../stores/player";
import { useUiStore } from "../../stores/ui";
import PlaylistCover from "../common/PlaylistCover.vue";

defineProps<{ collapsed?: boolean }>();

const auth = useAuthStore();
const library = useLibraryStore();
const player = usePlayerStore();
const ui = useUiStore();
const route = useRoute();

const items = computed(() => [
  {
    key: "liked",
    to: "/liked",
    name: "Любимые треки",
    meta: tracksCount(library.likedTracks.length),
    liked: true,
    covers: [] as string[],
    playlist: null,
  },
  ...library.playlists.map((p) => ({
    key: `playlist:${p.id}`,
    to: `/playlist/${p.id}`,
    name: p.name,
    meta: tracksCount(p.trackCount),
    liked: false,
    covers: p.covers,
    playlist: p,
  })),
]);

const isActive = (to: string) => route.path === to;
const isPlayingFrom = (key: string) => player.contextKey === key && player.isPlaying;

const canPlay = (item: (typeof items.value)[number]) =>
  item.liked ? library.likedTracks.length > 0 : (item.playlist?.trackCount ?? 0) > 0;

const quickPlay = async (item: (typeof items.value)[number]) => {
  if (player.contextKey === item.key && player.current) {
    void player.togglePlay();
    return;
  }
  if (item.liked) {
    player.playList(library.likedTracks, 0, "liked", "Любимые треки");
    return;
  }
  const id = item.playlist!.id;
  try {
    const playlist = await queryClient.fetchQuery({
      queryKey: ["playlist", id],
      queryFn: () => api.playlist(id),
      staleTime: 30_000,
    });
    player.playList(playlist.tracks, 0, item.key, playlist.name);
  } catch {
    ui.toast("Не удалось загрузить плейлист", "error");
  }
};
</script>

<template>
  <div>
    <!-- logged out: promo cards like Spotify -->
    <div v-if="auth.ready && !auth.user" class="flex flex-col gap-4" :class="collapsed ? 'hidden' : ''">
      <div class="rounded-lg bg-elevated p-5">
        <h3 class="font-bold">Создайте свой первый плейлист</h3>
        <p class="mt-2 text-sm text-muted">Войдите через Google — и собирайте любимую музыку в одном месте.</p>
        <button
          type="button"
          class="mt-5 rounded-full bg-fg px-4 py-1.5 text-sm font-bold text-app transition hover:scale-105"
          @click="ui.openLogin('Войдите, чтобы создавать плейлисты')"
        >
          Войти
        </button>
      </div>
      <div class="rounded-lg bg-elevated p-5">
        <h3 class="font-bold">Лайкайте треки и видео</h3>
        <p class="mt-2 text-sm text-muted">Всё, что понравится, сохранится в «Любимых треках».</p>
      </div>
    </div>

    <!-- skeleton while library loads -->
    <ul v-else-if="library.loading && !library.loaded" class="flex flex-col gap-1">
      <li v-for="i in 4" :key="i" class="flex items-center gap-3 p-2">
        <span class="size-12 animate-pulse rounded-md bg-white/10" />
        <span v-if="!collapsed" class="flex flex-col gap-2">
          <span class="h-3 w-32 animate-pulse rounded bg-white/10" />
          <span class="h-2.5 w-20 animate-pulse rounded bg-white/[0.07]" />
        </span>
      </li>
    </ul>

    <ul v-else-if="auth.user" class="flex flex-col">
      <li v-for="item in items" :key="item.key">
        <RouterLink
          :to="item.to"
          v-tip:right="collapsed ? item.name : undefined"
          class="group flex items-center gap-3 rounded-md p-2 transition-colors"
          :class="isActive(item.to) ? 'bg-highlight hover:bg-[#33264a]' : 'hover:bg-white/[0.06]'"
        >
          <div class="relative size-12 shrink-0">
            <PlaylistCover
              :liked="item.liked"
              :covers="item.covers"
              class="size-12 rounded-md shadow-[0_4px_12px_rgb(0_0_0/0.35)]"
            />
            <button
              v-if="canPlay(item)"
              type="button"
              :aria-label="isPlayingFrom(item.key) ? 'Пауза' : `Слушать «${item.name}»`"
              class="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 text-fg opacity-0 transition group-hover:opacity-100"
              @click.prevent.stop="quickPlay(item)"
            >
              <Pause v-if="isPlayingFrom(item.key)" :size="20" fill="currentColor" stroke-width="0" />
              <Play v-else :size="20" fill="currentColor" stroke-width="0" />
            </button>
          </div>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <div
              class="truncate font-medium"
              :class="player.contextKey === item.key && player.current ? 'text-accent-hi' : 'text-fg'"
            >
              {{ item.name }}
            </div>
            <div class="truncate text-sm text-muted">Плейлист • {{ item.meta }}</div>
          </div>
          <Volume2
            v-if="!collapsed && isPlayingFrom(item.key)"
            :size="16"
            class="mr-1 shrink-0 text-accent-hi"
            aria-label="Сейчас играет"
          />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
