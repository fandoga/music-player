<script setup lang="ts">
import { computed, ref } from "vue";
import TrackCard from "./tracks/TrackCard.vue";
import { useChartsQuery } from "../hooks/apiHooks";

const chartCountry = ref("RU");
const chartsQuery = useChartsQuery(chartCountry.value);

const tracks = computed(() => chartsQuery.data.value ?? []);
const isChartsLoading = computed(() => chartsQuery.isLoading.value);
const chartsError = computed(() =>
  chartsQuery.isError.value
    ? "Не удалось получить charts. Проверь backend и параметр country."
    : "",
);
</script>

<template>
  <section class="container max-w-2xl pb-20 mx-auto" id="center">
    <div class="mt-8 bg-code-bg rounded-2xl border-1 border-border p-3 w-full">
      <h2 class="mb-3 text-3xl font-semibold">Чарты</h2>

      <p v-if="isChartsLoading">Загружаем ваше любимое...</p>

      <div
        class="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
        :class="
          isChartsLoading
            ? 'grid-rows-[0fr] opacity-0'
            : 'grid-rows-[1fr] opacity-100'
        "
      >
        <div class="overflow-hidden">
          <p v-if="chartsError">{{ chartsError }}</p>

          <ul v-else class="space-y-2 text-left">
            <TrackCard
              v-for="(song, key) in tracks.slice(0, 20)"
              :key="key"
              :song="song"
            />
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
