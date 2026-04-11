<script setup lang="ts">
import { ArrowLeft, ArrowRight, CirclePause, CirclePlay } from "@lucide/vue";
import { usePlayerStore } from "../../stores/player";
import { computed, onMounted } from "vue";
import type { SongData } from "../../lib/types";
import { useGetAudioURL } from "../../hooks/audioHooks";

const props = defineProps<{
  trackData: SongData;
}>();

const playerStore = usePlayerStore();
const isPlaying = computed(() => playerStore.isPlaying);
const url = useGetAudioURL(props.trackData);

onMounted(() => playerStore.setupAudio(url));
</script>

<template>
  <div class="flex gap-2 items-center">
    <ArrowLeft
      class="hover:scale-105 cursor-pointer"
      :stroke-width="1"
      :size="42"
    />
    <CirclePause
      v-if="isPlaying"
      @click="playerStore.togglePlay()"
      class="hover:scale-103 cursor-pointer"
      :stroke-width="1"
      :size="52"
    />
    <CirclePlay
      v-else
      @click="playerStore.togglePlay()"
      class="hover:scale-103 cursor-pointer"
      :stroke-width="1"
      :size="52"
    />
    <ArrowRight
      class="hover:scale-105 cursor-pointer"
      :stroke-width="1"
      :size="42"
    />
  </div>
</template>
