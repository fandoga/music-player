<script setup lang="ts">
import { ListMusic, Pencil, Search, Shuffle, Trash2 } from "@lucide/vue";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRouter } from "vue-router";
import EmptyState from "../components/common/EmptyState.vue";
import PageHeader from "../components/common/PageHeader.vue";
import PageTopBar from "../components/common/PageTopBar.vue";
import PlayButton from "../components/common/PlayButton.vue";
import PlaylistCover from "../components/common/PlaylistCover.vue";
import TrackList from "../components/tracks/TrackList.vue";
import { useContextPlay } from "../composables/useContextPlay";
import { api, ApiError } from "../lib/api";
import { totalDuration, tracksCount } from "../lib/format";
import { useAuthStore } from "../stores/auth";
import { useLibraryStore } from "../stores/library";
import { usePlayerStore } from "../stores/player";
import { useUiStore } from "../stores/ui";

const props = defineProps<{ id: number }>();

const auth = useAuthStore();
const library = useLibraryStore();
const player = usePlayerStore();
const ui = useUiStore();
const router = useRouter();

const query = useQuery({
  queryKey: computed(() => ["playlist", props.id] as const),
  queryFn: () => api.playlist(props.id),
  enabled: computed(() => !!auth.user),
  retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
});

const playlist = computed(() => query.data.value);
// the sidebar copy updates instantly after rename
const summary = computed(() => library.playlists.find((p) => p.id === props.id));
const name = computed(() => summary.value?.name ?? playlist.value?.name ?? "");
const tracks = computed(() => playlist.value?.tracks ?? []);
const notFound = computed(
  () => query.error.value instanceof ApiError && query.error.value.status === 404,
);

const key = computed(() => `playlist:${props.id}`);
const ctx = useContextPlay(key, tracks, name);

// a stable purple-ish hue per playlist
const color = computed(() => `hsl(${255 + ((props.id * 37) % 60)} 55% 38%)`);

const rename = () => summary.value && library.renamePlaylist(summary.value);
const remove = async () => {
  if (summary.value && (await library.deletePlaylist(summary.value))) void router.push("/");
};
</script>

<template>
  <div class="relative">
    <PageTopBar
      :title="name"
      :color="color"
      :threshold="260"
      :show-play="tracks.length > 0"
      :playing="ctx.playing.value"
      :loading="ctx.loading.value"
      @play="ctx.toggle"
    />

    <template v-if="(auth.ready && !auth.user) || notFound">
      <div class="h-16" />
      <EmptyState
        :icon="ListMusic"
        :title="notFound ? 'Плейлист не найден' : 'Войдите, чтобы открыть плейлист'"
        :text="notFound ? 'Возможно, он был удалён.' : undefined"
      >
        <button
          v-if="!auth.user"
          type="button"
          class="rounded-full bg-fg px-8 py-3 font-bold text-app transition hover:scale-105"
          @click="ui.openLogin()"
        >
          Войти
        </button>
        <RouterLink
          v-else
          to="/"
          class="rounded-full bg-fg px-8 py-3 font-bold text-app transition hover:scale-105"
        >
          На главную
        </RouterLink>
      </EmptyState>
    </template>

    <template v-else>
      <PageHeader
        kicker="Плейлист"
        :title="name || ' '"
        :color="color"
        title-clickable
        @title-click="rename"
      >
        <template #cover>
          <PlaylistCover :covers="playlist?.covers ?? summary?.covers" :icon-size="72" class="size-full" />
        </template>
        <template #meta>
          <span v-if="auth.user" class="font-bold text-fg">{{ auth.user.name }}</span>
          <span>• {{ tracksCount(playlist?.trackCount ?? summary?.trackCount ?? 0) }}<span v-if="tracks.length" class="text-fg/60">, {{ totalDuration(tracks) }}</span></span>
        </template>
      </PageHeader>

      <div class="relative">
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-[220px]"
          :style="{ background: `linear-gradient(color-mix(in srgb, ${color} 30%, transparent), transparent)` }"
        />
        <div class="relative flex items-center gap-6 px-6 py-6">
          <PlayButton
            :playing="ctx.playing.value"
            :loading="ctx.loading.value"
            :disabled="!tracks.length"
            @click="ctx.toggle"
          />
          <button
            type="button"
            v-tip="player.shuffle ? 'Не перемешивать' : 'Перемешать'"
            :aria-pressed="player.shuffle"
            class="transition hover:scale-105"
            :class="player.shuffle ? 'text-accent-hi' : 'text-muted hover:text-fg'"
            @click="player.toggleShuffle()"
          >
            <Shuffle :size="28" />
          </button>
          <button
            type="button"
            v-tip="'Переименовать'"
            class="text-muted transition hover:scale-105 hover:text-fg"
            @click="rename"
          >
            <Pencil :size="24" />
          </button>
          <button
            type="button"
            v-tip="'Удалить плейлист'"
            class="text-muted transition hover:scale-105 hover:text-danger"
            @click="remove"
          >
            <Trash2 :size="24" />
          </button>
        </div>

        <div class="relative px-6 pb-10">
          <EmptyState
            v-if="query.isSuccess.value && !tracks.length"
            :icon="Search"
            title="Давайте что-нибудь добавим"
            text="Найдите треки или видео и выберите «Добавить в плейлист» в меню «…»."
          >
            <RouterLink
              to="/search"
              class="rounded-full bg-fg px-8 py-3 font-bold text-app transition hover:scale-105"
            >
              Найти треки
            </RouterLink>
          </EmptyState>
          <TrackList
            v-else
            :tracks="tracks"
            :loading="query.isLoading.value || !auth.ready"
            :context-key="key"
            :context-label="name"
            :playlist-id="id"
          />
        </div>
      </div>
    </template>
  </div>
</template>
