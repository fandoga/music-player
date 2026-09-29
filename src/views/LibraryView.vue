<script setup lang="ts">
import { Plus } from "@lucide/vue";
import PageTopBar from "../components/common/PageTopBar.vue";
import LibraryList from "../components/layout/LibraryList.vue";
import { useLibraryStore } from "../stores/library";

const library = useLibraryStore();
</script>

<template>
  <div class="relative">
    <PageTopBar color="#1d1529" />
    <div class="px-4 pb-10 pt-20">
      <div class="mb-4 flex items-center justify-between px-2">
        <h1 class="text-2xl font-bold">Моя медиатека</h1>
        <button
          type="button"
          v-tip="'Создать плейлист'"
          class="flex size-9 items-center justify-center rounded-full bg-elevated text-muted transition hover:text-fg"
          @click="library.createPlaylist()"
        >
          <Plus :size="20" />
        </button>
      </div>
      <LibraryList />
    </div>
  </div>
</template>
