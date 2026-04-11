export type Song = {
  videoId: string;
  title?: string;
  artists?: Array<{ name?: string }>;
  thumbnails?: { url?: string }[];
  duration_seconds: number;
  duration: string;
};

export type Response = {
  tracks?: Song[];
};

export interface SongData extends Song {
  audioUrl?: string;
  streamingData?: {
    adaptiveFormats: {
      mimeType: string;
      bitrate: number;
      url: string;
      signatureCipher: string;
    }[];
  };
}
