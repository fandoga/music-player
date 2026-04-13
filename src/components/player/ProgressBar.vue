<script lang="ts" setup>
import { computed, ref } from "vue";
import { usePlayerStore } from "../../stores/player";
import { useTrackStore } from "../../stores/track";

const playerStore = usePlayerStore();
const trackStore = useTrackStore();
const duration = computed(() => trackStore.currentTrack?.duration_seconds || 0);
const currentTime = computed(() => playerStore.currentTime);
const dragTime = ref(0);

const isDragging = ref(false);

const handleTimeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  playerStore.updateAudioTime(Number(target.value));
  setTimeout(() => {
    isDragging.value = false;
  }, 50);
};

const handleDragChange = (event: Event) => {
  isDragging.value = true;
  const target = event.target as HTMLInputElement;
  dragTime.value = Number(target.value);
};
</script>

<template>
  <div class="absolute -top-2 w-full">
    <input
      @change="handleTimeChange"
      @input="handleDragChange"
      class="w-full"
      type="range"
      :max="duration"
      :value="isDragging ? dragTime : currentTime"
    />
  </div>
</template>
