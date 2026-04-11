<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import {
  TRACKS_FEED_QUERY_KEY,
  useChartsQuery,
  useSearchQuery,
} from "../hooks/apiHooks";

const query = ref("");
const queryClient = useQueryClient();
const chartsQuery = useChartsQuery("RU");
const searchQuery = useSearchQuery(query);
const isLoading = computed(() => searchQuery.isLoading.value);
const error = computed(() =>
  searchQuery.isError.value
    ? "Не удалось получить треки. Повторите попытку позже"
    : "",
);

const runSearch = async () => {
  if (!query.value.trim()) {
    chartsQuery.refetch();
    return;
  }
  const result = await searchQuery.refetch();
  if (result.data?.[0]) {
    queryClient.setQueryData(TRACKS_FEED_QUERY_KEY, result.data[0]);
  }
};
</script>

<template>
  <div class="w-full max-w-xl">
    <div class="flex gap-2">
      <input
        v-model="query"
        class="flex-1 rounded-lg border text-sm px-2 py-1"
        placeholder="Поиск треков..."
        @keyup.enter="runSearch"
      />
      <button class="rounded-lg border text-sm px-2 py-1" @click="runSearch">
        Поиск
      </button>
    </div>

    <p v-if="isLoading">Ищем треки...</p>
    <p v-else-if="error">{{ error }}</p>
  </div>
</template>
