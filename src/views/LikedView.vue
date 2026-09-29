<script setup lang="ts">
import { Heart, Shuffle } from "@lucide/vue";
import { computed } from "vue";
import EmptyState from "../components/common/EmptyState.vue";
import PageHeader from "../components/common/PageHeader.vue";
import PageTopBar from "../components/common/PageTopBar.vue";
import PlayButton from "../components/common/PlayButton.vue";
import PlaylistCover from "../components/common/PlaylistCover.vue";
import TrackList from "../components/tracks/TrackList.vue";
import { useContextPlay } from "../composables/useContextPlay";
import { totalDuration, tracksCount } from "../lib/format";
import { useAuthStore } from "../stores/auth";
import { useLibraryStore } from "../stores/library";
import { usePlayerStore } from "../stores/player";
import { useUiStore } from "../stores/ui";

const auth = useAuthStore();
const library = useLibraryStore();
const player = usePlayerStore();
const ui = useUiStore();

const tracks = computed(() => library.likedTracks);
const ctx = useContextPlay("liked", tracks, "Любимые треки");
const COLOR = "#5b21b6";
</script>

<template>
  <div class="relative">
    <PageTopBar
      title="Любимые треки"
      :color="COLOR"
      :threshold="260"
      :show-play="tracks.length > 0"
      :playing="ctx.playing.value"
      :loading="ctx.loading.value"
      @play="ctx.toggle"
    />

    <template v-if="auth.ready && !auth.user">
      <div class="h-16" />
      <EmptyState
        :icon="Heart"
        title="Здесь будут ваши любимые треки"
        text="Войдите через Google и ставьте лайки трекам и видео — они сохранятся в этом плейлисте."
      >
        <button
          type="button"
          class="rounded-full bg-fg px-8 py-3 font-bold text-app transition hover:scale-105"
          @click="ui.openLogin()"
        >
          Войти
        </button>
      </EmptyState>
    </template>

    <template v-else>
      <PageHeader kicker="Плейлист" title="Любимые треки" :color="COLOR">
        <template #cover><PlaylistCover liked :icon-size="72" class="size-full" /></template>
        <template #meta>
          <span v-if="auth.user" class="font-bold text-fg">{{ auth.user.name }}</span>
          <span>• {{ tracksCount(tracks.length) }}<span v-if="tracks.length" class="text-fg/60">, {{ totalDuration(tracks) }}</span></span>
        </template>
      </PageHeader>

      <div class="relative">
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-[220px]"
          :style="{ background: `linear-gradient(color-mix(in srgb, ${COLOR} 30%, transparent), transparent)` }"
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
        </div>

        <div class="relative px-6 pb-10">
          <EmptyState
            v-if="library.loaded && !tracks.length"
            :icon="Heart"
            title="Пока пусто"
            text="Нажимайте на сердечко рядом с треком — и он появится здесь."
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
            :loading="!library.loaded"
            context-key="liked"
            context-label="Любимые треки"
          />
        </div>
      </div>
    </template>
  </div>
</template>
