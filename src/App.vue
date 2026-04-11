<script setup lang="ts">
import Header from "./components/Header.vue";
import Main from "./components/Main.vue";
import Player from "./components/player/Player.vue";
import { useTrackStore } from "./stores/track";

const playerStore = useTrackStore();
</script>

<template>
  <Header />
  <div class="w-full flex flex-row pt-16 justify-center">
    <Main />
    <Player v-if="playerStore.hasCurrentTrack" />
  </div>
</template>
