<script setup lang="ts">
import { Library, PanelLeftClose, Plus } from "@lucide/vue";
import { useLibraryStore } from "../../stores/library";
import { useUiStore } from "../../stores/ui";
import LibraryList from "./LibraryList.vue";

const library = useLibraryStore();
const ui = useUiStore();
</script>

<template>
  <aside
    class="flex flex-col overflow-hidden rounded-lg bg-surface transition-[width] duration-200"
    :class="ui.sidebarCollapsed ? 'w-[72px]' : 'w-[300px]'"
    aria-label="Моя медиатека"
  >
    <div
      class="flex h-16 shrink-0 items-center px-4"
      :class="ui.sidebarCollapsed ? 'justify-center' : 'justify-between'"
    >
      <button
        type="button"
        v-tip:right="ui.sidebarCollapsed ? 'Развернуть медиатеку' : 'Свернуть медиатеку'"
        class="group flex items-center gap-3 font-bold text-muted transition hover:text-fg"
        @click="ui.sidebarCollapsed = !ui.sidebarCollapsed"
      >
        <Library v-if="ui.sidebarCollapsed" :size="24" />
        <template v-else>
          <Library :size="24" class="group-hover:hidden" />
          <PanelLeftClose :size="24" class="hidden group-hover:block" />
          <span>Моя медиатека</span>
        </template>
      </button>
      <button
        v-if="!ui.sidebarCollapsed"
        type="button"
        v-tip="'Создать плейлист'"
        class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-elevated hover:text-fg"
        @click="library.createPlaylist()"
      >
        <Plus :size="20" />
      </button>
    </div>

    <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      <LibraryList :collapsed="ui.sidebarCollapsed" />
    </div>
  </aside>
</template>
