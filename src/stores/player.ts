import { defineStore } from "pinia";
import { ref, watch, type Ref } from "vue";

export const usePlayerStore = defineStore("player", () => {
  const audio = new Audio();
  const Error = ref("");
  const isPlaying = ref<boolean>(false);
  const url = ref<string>("");
  const currentTime = ref(0);

  // Дополнительная логика

  audio.addEventListener("pause", () => {
    isPlaying.value = false;
  });
  audio.addEventListener("ended", () => {
    isPlaying.value = false;
  });
  audio.addEventListener("timeupdate", () => {
    if (audio) {
      currentTime.value = audio.currentTime;
    }
  });

  watch(url, async (newUrl) => {
    if (!newUrl) return;

    const shouldResume = isPlaying.value;
    audio.pause();
    audio.src = newUrl;

    if (shouldResume) {
      try {
        await audio.play();
      } catch {
        isPlaying.value = false;
        Error.value = "Не удалось продолжить воспроизведение";
      }
    }
  });

  // Основные экшены

  const updateAudioTime = (newTime: number) => {
    if (!audio || !newTime) return;
    audio.currentTime = newTime;
  };

  const setupAudio = (URL: Ref<string>) => {
    url.value = URL.value;
    audio.src = URL.value;
    audio.load();
  };

  const togglePlay = async () => {
    Error.value = "";

    if (!url.value) {
      Error.value = "Повторите попытку";
      return;
    }

    if (isPlaying.value) {
      audio.pause();
      isPlaying.value = false;
      return;
    }

    try {
      audio.play();
      isPlaying.value = true;
    } catch {
      isPlaying.value = false;
      Error.value = "Браузер заблокировал воспроизведение";
    }
  };

  return {
    togglePlay,
    setupAudio,
    updateAudioTime,
    Error,
    isPlaying,
    currentTime,
  };
});
