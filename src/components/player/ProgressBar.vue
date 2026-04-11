<script lang="ts" setup>
import { computed, ref } from "vue";
import { usePlayerStore } from "../../stores/player";
import { useTrackStore } from "../../stores/track";

const playerStore = usePlayerStore();
const trackStore = useTrackStore();
const duration = computed(() => trackStore.currentTrack?.duration_seconds || 0);
const currentTime = computed(() => playerStore.currentTime);

const isDragging = ref(false);

const handleTimeChange = (event: Event) => {
  isDragging.value = false;
  const target = event.target as HTMLInputElement;
  playerStore.updateAudioTime(Number(target.value));
};
</script>

<template>
  <div class="absolute cursor-pointer -top-2 w-full">
    <input
      @change="handleTimeChange"
      @input="isDragging = true"
      class="w-full"
      type="range"
      :max="duration"
      :value="isDragging ? 0 : currentTime"
    />
  </div>
</template>
