<script setup lang="ts">
import { HOTKEYS } from "../../composables/useHotkeys";
import { useUiStore } from "../../stores/ui";
import Modal from "./Modal.vue";

const ui = useUiStore();
</script>

<template>
  <Modal title="Горячие клавиши" width="max-w-lg" @close="ui.hotkeysOpen = false">
    <ul class="mt-5 flex flex-col">
      <li
        v-for="h in HOTKEYS"
        :key="h.label"
        class="flex items-center justify-between gap-4 border-b border-white/5 py-2.5 last:border-0"
      >
        <span class="text-muted">{{ h.label }}</span>
        <span class="flex shrink-0 gap-1">
          <kbd
            v-for="k in h.keys"
            :key="k"
            class="min-w-7 rounded-md bg-white/10 px-2 py-0.5 text-center text-sm font-semibold shadow-[inset_0_-2px_0_rgb(0_0_0/0.35)]"
          >
            {{ k }}
          </kbd>
        </span>
      </li>
    </ul>
  </Modal>
</template>
