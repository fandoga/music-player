<script setup lang="ts">
import { Music2, Search, Video, X } from "@lucide/vue";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { SearchSource } from "../../lib/types";
import { useUiStore } from "../../stores/ui";

const route = useRoute();
const router = useRouter();
const ui = useUiStore();

const input = ref<HTMLInputElement>();
const query = ref(typeof route.query.q === "string" ? route.query.q : "");

const sources: { value: SearchSource; label: string; hint: string; icon: typeof Music2 }[] = [
  { value: "songs", label: "Треки", hint: "Искать треки в YouTube Music", icon: Music2 },
  { value: "videos", label: "Видео", hint: "Искать видео на YouTube", icon: Video },
];

// keep the field in sync with back/forward navigation
watch(
  () => route.query.q,
  (q) => {
    if (route.name !== "search") return;
    const value = typeof q === "string" ? q : "";
    if (value.trim() !== query.value.trim()) query.value = value;
  },
);

let timer: number | undefined;

const navigate = (immediate = false) => {
  clearTimeout(timer);
  const run = () => {
    const q = query.value.trim();
    const target = {
      name: "search" as const,
      query: q ? { q, source: ui.searchSource } : { source: ui.searchSource },
    };
    if (route.name === "search") void router.replace(target);
    else if (q) void router.push(target);
  };
  if (immediate) run();
  else timer = window.setTimeout(run, 350);
};

watch(query, () => navigate());

const setSource = (source: SearchSource) => {
  if (ui.searchSource === source) return;
  ui.searchSource = source;
  if (route.name === "search") navigate(true);
  input.value?.focus();
};

const clear = () => {
  query.value = "";
  navigate(true);
  input.value?.focus();
};

const onFocusClick = () => {
  if (route.name !== "search") void router.push({ name: "search", query: { source: ui.searchSource } });
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") navigate(true);
  if (e.key === "Escape") {
    if (query.value) query.value = "";
    else input.value?.blur();
  }
};

watch(
  () => ui.searchFocusTick,
  () => {
    input.value?.focus();
    input.value?.select();
  },
);
</script>

<template>
  <div
    class="group/search flex h-12 w-full min-w-0 items-center gap-2 rounded-full bg-elevated pl-4 pr-1.5 ring-1 ring-transparent transition hover:bg-highlight hover:ring-white/10 focus-within:bg-highlight focus-within:ring-2 focus-within:ring-accent/70"
  >
    <Search
      :size="20"
      class="shrink-0 text-muted transition group-focus-within/search:text-fg"
      aria-hidden="true"
    />
    <input
      ref="input"
      v-model="query"
      type="search"
      :placeholder="ui.searchSource === 'songs' ? 'Что хотите послушать?' : 'Найти видео на YouTube'"
      aria-label="Поиск"
      autocomplete="off"
      spellcheck="false"
      class="h-full min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none focus-visible:outline-none placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
      @click="onFocusClick"
      @keydown="onKeydown"
    />
    <button
      v-if="query"
      type="button"
      v-tip="'Очистить'"
      class="rounded-full p-1 text-muted transition hover:text-fg"
      @click="clear"
    >
      <X :size="18" />
    </button>

    <div class="h-6 w-px shrink-0 bg-white/10 max-sm:hidden" />

    <!-- where to search: YouTube Music tracks or YouTube videos -->
    <div
      role="radiogroup"
      aria-label="Источник поиска"
      class="relative flex shrink-0 rounded-full bg-app/60 p-1 max-sm:hidden"
    >
      <span
        class="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-accent transition-transform duration-200 ease-out"
        :class="ui.searchSource === 'songs' ? 'translate-x-0' : 'translate-x-full'"
        aria-hidden="true"
      />
      <button
        v-for="s in sources"
        :key="s.value"
        type="button"
        role="radio"
        :aria-checked="ui.searchSource === s.value"
        v-tip:bottom="s.hint"
        class="relative z-10 flex w-[84px] items-center justify-center gap-1.5 rounded-full py-1 text-[13px] font-semibold transition-colors"
        :class="ui.searchSource === s.value ? 'text-app' : 'text-muted hover:text-fg'"
        @click="setSource(s.value)"
      >
        <component :is="s.icon" :size="14" :stroke-width="2.5" />
        {{ s.label }}
      </button>
    </div>
  </div>
</template>
