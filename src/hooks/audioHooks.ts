import { computed, type Ref } from "vue";
import type { SongData } from "../lib/types";

function extractUrl(signatureCipher: string | undefined) {
  if (!signatureCipher) return;
  const params = new URLSearchParams(signatureCipher);
  return params.get("url");
}

export const useGetAudioURL = (track: SongData | undefined) =>
  computed(() => {
    if (track?.audioUrl) {
      return track.audioUrl;
    }

    const audioFormats =
      track?.streamingData.adaptiveFormats.filter((f) =>
        f.mimeType.includes("audio"),
      ) ?? [];

    const bestAudio = [...audioFormats].sort(
      (a, b) => b.bitrate - a.bitrate,
    )[0];

    return extractUrl(bestAudio?.signatureCipher) || "";
  });
