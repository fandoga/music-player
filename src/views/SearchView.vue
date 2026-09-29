<script setup lang="ts">
import { CircleAlert, Music2, RefreshCw, SearchX, Video } from "@lucide/vue";
import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import EmptyState from "../components/common/EmptyState.vue";
import LikeButton from "../components/common/LikeButton.vue";
import PageTopBar from "../components/common/PageTopBar.vue";
import PlayButton from "../components/common/PlayButton.vue";
import TrackCover from "../components/common/TrackCover.vue";
import TrackList from "../components/tracks/TrackList.vue";
import { api } from "../lib/api";
import { artistsText } from "../lib/format";
import type { SearchSource } from "../lib/types";
import { usePlayerStore } from "../stores/player";
import { useUiStore } from "../stores/ui";

const route = useRoute();
const router = useRouter();
const ui = useUiStore();
const player = usePlayerStore();

const q = computed(() => (typeof route.query.q === "string" ? route.query.q.trim() : ""));
const source = computed<SearchSource>(() =>
  route.query.source === "videos" || route.query.source === "songs"
    ? route.query.source
    : ui.searchSource,
);

// the URL wins: opening a shared link switches the toggle too
watch(source, (s) => (ui.searchSource = s), { immediate: true });

const searchQuery = useQuery({
  queryKey: computed(() => ["search", source.value, q.value] as const),
  queryFn: () => api.search(q.value, source.value),
  enabled: computed(() => q.value.length > 0),
  staleTime: 1000 * 60 * 5,
  placeholderData: keepPreviousData,
});

const results = computed(() => (q.value ? (searchQuery.data.value ?? []) : []));
const top = computed(() => results.value[0]);
const contextKey = computed(() => `search:${source.value}:${q.value}`);
const contextLabel = computed(() => `Поиск: «${q.value}»`);
const isFetchingNew = computed(() => searchQuery.isFetching.value && searchQuery.isPlaceholderData.value);

const topIsCurrent = computed(
  () => !!top.value && player.current?.videoId === top.value.videoId,
);
const playTop = () => {
  if (topIsCurrent.value) return void player.togglePlay();
  player.playList(results.value, 0, contextKey.value, contextLabel.value);
};

const setSource = (s: SearchSource) =>
  router.replace({ name: "search", query: { ...route.query, source: s } });

const suggestions = [
  { q: "Lo-fi hip hop", color: "#7c3aed" },
  { q: "Synthwave", color: "#c026d3" },
  { q: "Русский рок", color: "#9333ea" },
  { q: "Phonk", color: "#4c1d95" },
  { q: "Jazz для работы", color: "#6d28d9" },
  { q: "Classical piano", color: "#a21caf" },
  { q: "Хиты 2000-х", color: "#5b21b6" },
  { q: "Techno", color: "#86198f" },
  { q: "Indie", color: "#7e22ce" },
  { q: "Саундтреки из игр", color: "#581c87" },
];
</script>

<template>
  <div class="relative">
    <PageTopBar color="#1d1529" />

    <div class="px-6 pb-10 pt-20">
      <!-- source toggle for small screens (in the top bar on desktop) -->
      <div class="mb-6 flex gap-2 sm:hidden">
        <button
          v-for="s in [
            { v: 'songs' as const, label: 'Треки', icon: Music2 },
            { v: 'videos' as const, label: 'Видео', icon: Video },
          ]"
          :key="s.v"
          type="button"
          class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition"
          :class="source === s.v ? 'bg-accent text-app' : 'bg-white/[0.08] text-fg hover:bg-white/[0.14]'"
          @click="setSource(s.v)"
        >
          <component :is="s.icon" :size="14" /> {{ s.label }}
        </button>
      </div>

      <!-- browse -->
      <template v-if="!q">
        <h1 class="mb-5 text-2xl font-bold">Попробуйте найти</h1>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          <RouterLink
            v-for="(s, i) in suggestions"
            :key="s.q"
            :to="{ name: 'search', query: { q: s.q, source } }"
            class="group relative aspect-[16/10] overflow-hidden rounded-lg p-4 transition hover:brightness-110"
            :style="{ background: `linear-gradient(135deg, ${s.color}, color-mix(in srgb, ${s.color} 55%, #0b0712))` }"
          >
            <span class="relative z-10 text-xl font-bold leading-tight">{{ s.q }}</span>
            <span
              class="absolute -bottom-3 -right-4 flex size-24 rotate-[25deg] items-center justify-center rounded-md bg-black/25 shadow-xl transition-transform group-hover:rotate-[20deg] group-hover:scale-105"
            >
              <component :is="i % 3 === 0 ? Video : Music2" :size="40" class="text-white/70" />
            </span>
          </RouterLink>
        </div>
      </template>

      <!-- error -->
      <div
        v-else-if="searchQuery.isError.value && !results.length"
        class="flex flex-col items-center gap-3 rounded-lg bg-elevated px-6 py-12 text-center"
      >
        <CircleAlert :size="32" class="text-danger" />
        <p class="text-lg font-bold">Поиск сейчас не работает</p>
        <p class="text-sm text-muted">Проверьте, что бэкенд запущен, и попробуйте ещё раз.</p>
        <button
          type="button"
          class="mt-2 flex items-center gap-2 rounded-full bg-fg px-5 py-2 text-sm font-bold text-app transition hover:scale-105"
          @click="searchQuery.refetch()"
        >
          <RefreshCw :size="16" /> Повторить
        </button>
      </div>

      <!-- empty -->
      <EmptyState
        v-else-if="searchQuery.isSuccess.value && !results.length && !searchQuery.isFetching.value"
        :icon="SearchX"
        :title="`Ничего не нашлось по запросу «${q}»`"
        :text="
          source === 'songs'
            ? 'Проверьте написание или поищите среди видео на YouTube.'
            : 'Проверьте написание или поищите среди треков YouTube Music.'
        "
      >
        <button
          type="button"
          class="rounded-full bg-fg px-6 py-2.5 font-bold text-app transition hover:scale-105"
          @click="setSource(source === 'songs' ? 'videos' : 'songs')"
        >
          Искать {{ source === "songs" ? "видео" : "треки" }}
        </button>
      </EmptyState>

      <!-- results -->
      <div v-else class="transition-opacity" :class="isFetchingNew ? 'opacity-60' : ''">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section>
            <h2 class="mb-3 text-2xl font-bold">Лучший результат</h2>
            <div
              v-if="top"
              class="group relative flex cursor-default flex-col gap-5 rounded-lg bg-white/[0.05] p-5 transition-colors hover:bg-white/[0.1]"
              @click="playTop"
            >
              <TrackCover
                :src="top.thumbnail"
                :alt="top.title"
                :icon-size="40"
                class="size-24 rounded-md shadow-[0_8px_24px_rgb(0_0_0/0.5)]"
              />
              <div class="min-w-0">
                <div class="line-clamp-2 text-3xl font-bold leading-tight" :title="top.title">{{ top.title }}</div>
                <div class="mt-2 flex items-center gap-2 text-sm text-muted">
                  <span class="rounded-full bg-black/40 px-3 py-1 font-semibold text-fg">
                    {{ top.source === "video" ? "Видео" : "Трек" }}
                  </span>
                  <span class="truncate">{{ artistsText(top) }}</span>
                </div>
              </div>
              <div
                class="absolute bottom-5 right-5 flex items-center gap-3 transition duration-200"
                :class="topIsCurrent ? '' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'"
              >
                <LikeButton :track="top" :size="22" always-visible />
                <PlayButton
                  :playing="topIsCurrent && player.isPlaying"
                  :loading="topIsCurrent && player.loadState === 'loading'"
                  size="md"
                  @click="playTop"
                />
              </div>
            </div>
            <div v-else class="h-[228px] animate-pulse rounded-lg bg-white/[0.05]" />
          </section>

          <section class="min-w-0">
            <h2 class="mb-3 text-2xl font-bold">{{ source === "songs" ? "Треки" : "Видео" }}</h2>
            <TrackList
              :tracks="results.slice(0, 4)"
              :queue-tracks="results"
              :loading="searchQuery.isLoading.value"
              :skeleton-count="4"
              :show-header="false"
              :show-album="false"
              :context-key="contextKey"
              :context-label="contextLabel"
            />
          </section>
        </div>

        <section v-if="results.length > 4" class="mt-10">
          <h2 class="mb-3 text-2xl font-bold">Все результаты</h2>
          <TrackList
            :tracks="results"
            :show-album="source === 'songs'"
            :context-key="contextKey"
            :context-label="contextLabel"
          />
        </section>
      </div>
    </div>
  </div>
</template>
