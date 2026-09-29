<script setup lang="ts">
import { CircleAlert } from "@lucide/vue";
import { useUiStore } from "../../stores/ui";

const ui = useUiStore();
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-28 z-[300] flex flex-col items-center gap-2 px-4"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-3 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <button
        v-for="t in ui.toasts"
        :key="t.id"
        type="button"
        class="pointer-events-auto flex max-w-md items-center gap-2 rounded-lg px-4 py-3 text-left text-[15px] font-medium shadow-[0_12px_32px_rgb(0_0_0/0.5)]"
        :class="t.kind === 'error' ? 'bg-[#3a1522] text-[#ffd5dc] ring-1 ring-danger/40' : 'bg-[#ede3ff] text-app'"
        @click="ui.dismissToast(t.id)"
      >
        <CircleAlert v-if="t.kind === 'error'" :size="18" class="shrink-0 text-danger" />
        {{ t.message }}
      </button>
    </TransitionGroup>
  </div>
</template>
