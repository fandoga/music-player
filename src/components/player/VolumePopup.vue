<script setup lang="ts">
import { usePlayerStore } from "../../stores/player";

defineProps<{
  state: boolean;
}>();

const playerStore = usePlayerStore();

const handleUpadateVolume = (event: Event) => {
  const target = event.target as HTMLInputElement;
  playerStore.updateAudioVolume(target.value);
};
</script>

<template>
  <div
    class="absolute -top-47 right-4 h-45 w-10 rounded-full bg-accent p-2"
    v-if="state"
  >
    <div class="flex h-full w-full items-center justify-center">
      <input
        @input="handleUpadateVolume"
        type="range"
        min="0"
        max="100"
        :value="
          playerStore.currentVolume === 0
            ? '70'
            : playerStore.currentVolume * 100
        "
        class="h-2 w-40 -rotate-90 cursor-pointer rounded-full bg-white/30 accent-white"
      />
    </div>
  </div>
</template>
