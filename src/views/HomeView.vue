<script setup lang="ts">
import { CircleAlert, Pause, Play, RefreshCw } from "@lucide/vue";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import PageTopBar from "../components/common/PageTopBar.vue";
import PlayButton from "../components/common/PlayButton.vue";
import PlaylistCover from "../components/common/PlaylistCover.vue";
import TrackList from "../components/tracks/TrackList.vue";
import { useContextPlay } from "../composables/useContextPlay";
import { api } from "../lib/api";
import { greeting } from "../lib/format";
import { useAuthStore } from "../stores/auth";
import { useLibraryStore } from "../stores/library";
import { usePlayerStore } from "../stores/player";

const COUNTRY = "RU";

const auth = useAuthStore();
const library = useLibraryStore();
const player = usePlayerStore();

const chartsQuery = useQuery({
  queryKey: ["charts", COUNTRY],
  queryFn: () => api.charts(COUNTRY),
  staleTime: 1000 * 60 * 10,
});

const tracks = computed(() => chartsQuery.data.value?.tracks ?? []);
const chartTitle = computed(() => chartsQuery.data.value?.title || "Чарты");
const charts = useContextPlay("charts", tracks, chartTitle);

const hello = computed(() => {
  const name = auth.user?.name.split(" ")[0];
  return name ? `${greeting()}, ${name}` : greeting();
});

const tiles = computed(() =>
  auth.user
    ? [
        { key: "liked", to: "/liked", name: "Любимые треки", liked: true, covers: [] as string[] },
        ...library.playlists.slice(0, 7).map((p) => ({
          key: `playlist:${p.id}`,
          to: `/playlist/${p.id}`,
          name: p.name,
          liked: false,
          covers: p.covers,
        })),
      ]
    : [],
);

const tilePlaying = (key: string) => player.contextKey === key && player.isPlaying;
const playTile = (key: string) => {
  if (player.contextKey === key && player.current) return void player.togglePlay();
  if (key === "liked" && library.likedTracks.length) {
    player.playList(library.likedTracks, 0, "liked", "Любимые треки");
  }
};
</script>

<template>
  <div class="relative">
    <PageTopBar
      :title="chartTitle"
      color="#3b1d6e"
      :threshold="420"
      show-play
      :playing="charts.playing.value"
      :loading="charts.loading.value"
      @play="charts.toggle"
    />

    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-gradient-to-b from-[#4c1d95]/80 via-[#2e1065]/40 to-transparent"
    />

    <section class="relative px-6 pb-2 pt-20">
      <h1 class="text-3xl font-bold tracking-tight">{{ hello }}</h1>

      <div
        v-if="tiles.length"
        class="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-4"
      >
        <RouterLink
          v-for="tile in tiles"
          :key="tile.key"
          :to="tile.to"
          class="group flex h-16 items-center gap-3 overflow-hidden rounded-md bg-white/[0.08] pr-3 transition-colors hover:bg-white/[0.16]"
        >
          <PlaylistCover
            :liked="tile.liked"
            :covers="tile.covers"
            class="size-16 shrink-0 shadow-[0_4px_16px_rgb(0_0_0/0.4)]"
          />
          <span class="min-w-0 flex-1 truncate font-bold">{{ tile.name }}</span>
          <button
            v-if="tile.liked && library.likedTracks.length"
            type="button"
            :aria-label="tilePlaying(tile.key) ? 'Пауза' : `Слушать «${tile.name}»`"
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-app opacity-0 shadow-lg transition group-hover:opacity-100 hover:scale-105"
            :class="tilePlaying(tile.key) ? 'opacity-100' : ''"
            @click.prevent.stop="playTile(tile.key)"
          >
            <Pause v-if="tilePlaying(tile.key)" :size="16" fill="currentColor" stroke-width="0" />
            <Play v-else :size="16" fill="currentColor" stroke-width="0" class="ml-0.5" />
          </button>
        </RouterLink>
      </div>
    </section>

    <section class="relative px-6 pb-10 pt-8">
      <div class="mb-4 flex items-center gap-4">
        <PlayButton
          :playing="charts.playing.value"
          :loading="charts.loading.value"
          :disabled="!tracks.length"
          @click="charts.toggle"
        />
        <div class="min-w-0">
          <p class="text-sm font-semibold text-muted">Чарты YouTube Music · Россия</p>
          <h2 class="truncate text-2xl font-bold tracking-tight">{{ chartTitle }}</h2>
        </div>
      </div>

      <div
        v-if="chartsQuery.isError.value"
        class="flex flex-col items-center gap-3 rounded-lg bg-elevated px-6 py-12 text-center"
      >
        <CircleAlert :size="32" class="text-danger" />
        <p class="text-lg font-bold">Не удалось загрузить чарты</p>
        <p class="max-w-md text-sm text-muted">
          Проверьте, что бэкенд запущен (<code>uvicorn app:app --port 8000</code>) и есть доступ к YouTube Music.
        </p>
        <button
          type="button"
          class="mt-2 flex items-center gap-2 rounded-full bg-fg px-5 py-2 text-sm font-bold text-app transition hover:scale-105"
          @click="chartsQuery.refetch()"
        >
          <RefreshCw :size="16" /> Повторить
        </button>
      </div>

      <TrackList
        v-else
        :tracks="tracks"
        :loading="chartsQuery.isLoading.value"
        context-key="charts"
        :context-label="chartTitle"
      />
    </section>
  </div>
</template>
