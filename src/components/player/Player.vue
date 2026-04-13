<script setup lang="ts">
import ProgressBar from "./ProgressBar.vue";
import { useTrackStore } from "../../stores/track";
import { computed, ref } from "vue";
import PlayerButton from "./PlayerButton.vue";
import { useGetTrack } from "../../hooks/apiHooks";
import { usePlayerStore } from "../../stores/player";
import VolumePopup from "./VolumePopup.vue";
import VolumeIcon from "../../shared/icons/VolumeIcon.vue";

const playerStore = usePlayerStore();
const Error = computed(() => playerStore.Error);

const open = ref<boolean>(false);

const trackStore = useTrackStore();
const trackImg = computed(() => trackStore.currentTrack?.thumbnails?.[0]?.url);
const trackTitle = computed(() => trackStore.currentTrack?.title);
const trackId = computed(() => trackStore.currentTrack?.videoId);
const trackArtists = computed(() => {
  let res: string[] = [];
  for (const artist of trackStore.currentTrack?.artists || []) {
    res.push(artist?.name || "");
  }
  return res;
});
const trackArtistsText = computed(() => trackArtists.value.join(", ").trim());

const trackQuery = useGetTrack(trackId);
const trackData = computed(() => trackQuery.data.value);

// watch(
//   () => trackId.value,
//   () => {
//     playbackError.value = "";
//   },
// );

// onUnmounted(() => {
//   audio.value.pause();
//   audio.value.src = "";
//   audio.value.load();
// });
</script>

<template>
  <div class="fixed bottom-6 z-120 w-200">
    <VolumePopup :state="open" />
    <div class="relative overflow-hidden rounded-lg h-17 pt-2 bg-accent">
      <ProgressBar />
      <div class="flex items-center px-4 justify-between">
        <div class="flex w-70 items-center py-2 gap-4">
          <div class="w-15 h-10 rounded-lg overflow-hidden">
            <img
              class="w-full h-full object-cover"
              :src="trackImg"
              :alt="trackTitle"
            />
          </div>
          <div v-if="trackTitle">
            <h3 class="text-sm font-semibold">
              {{
                trackTitle?.length > 20
                  ? trackTitle?.slice(0, 20) + "..."
                  : trackTitle
              }}
            </h3>
            <p class="text-muted text-xs">
              {{ trackArtistsText.slice(0, 30) || "Неизвестный исполнитель" }}
            </p>
          </div>
        </div>
        <div v-if="trackData">
          <PlayerButton :trackData />
        </div>
        <div class="flex justify-end w-70">
          <div
            @click="open = !open"
            class="cursor-pointer w-10 h-10 bg-accent-bg rounded-full p-2"
          >
            <VolumeIcon />
          </div>
        </div>
      </div>
      <p v-if="Error" class="text-xs text-center text-dangerous mt-1">
        {{ Error }}
      </p>
    </div>
  </div>
</template>
