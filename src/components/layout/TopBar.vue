<script setup lang="ts">
import { AudioLines, House, Keyboard, Library, LogOut } from "@lucide/vue";
import { ref } from "vue";
import { useClickOutside } from "../../composables/useClickOutside";
import { useAuthStore } from "../../stores/auth";
import { useUiStore } from "../../stores/ui";
import SearchBox from "./SearchBox.vue";

const auth = useAuthStore();
const ui = useUiStore();

const menuOpen = ref(false);
const menuRoot = ref<HTMLElement>();
useClickOutside(menuRoot, () => (menuOpen.value = false));

const logout = () => {
  menuOpen.value = false;
  void auth.logout();
};
</script>

<template>
  <header class="flex h-16 items-center gap-2 px-2">
    <RouterLink
      to="/"
      class="flex shrink-0 items-center gap-2.5 rounded-full pr-2 lg:w-[272px]"
      aria-label="Музыкалити — на главную"
    >
      <span
        class="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-hi to-accent-lo text-fg shadow-[0_4px_16px_rgb(168_85_247/0.4)]"
      >
        <AudioLines :size="22" :stroke-width="2.5" />
      </span>
      <span class="text-lg font-extrabold tracking-tight max-lg:hidden">Музыкалити</span>
    </RouterLink>

    <div class="mx-auto flex w-full max-w-[600px] min-w-0 items-center gap-2">
      <RouterLink
        v-slot="{ isExactActive, navigate, href }"
        to="/"
        custom
      >
        <a
          :href="href"
          v-tip:bottom="'Главная'"
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-elevated transition hover:scale-105 hover:bg-highlight max-sm:hidden"
          :class="isExactActive ? 'text-fg' : 'text-muted hover:text-fg'"
          @click="navigate"
        >
          <House :size="22" :fill="isExactActive ? 'currentColor' : 'none'" :stroke-width="isExactActive ? 1.5 : 2" />
        </a>
      </RouterLink>
      <SearchBox />
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2 lg:w-[272px]">
      <RouterLink
        to="/library"
        v-tip:bottom="'Моя медиатека'"
        class="flex size-10 items-center justify-center rounded-full text-muted transition hover:text-fg md:hidden"
      >
        <Library :size="22" />
      </RouterLink>
      <button
        type="button"
        v-tip:bottom="'Горячие клавиши (?)'"
        class="flex size-10 items-center justify-center rounded-full text-muted transition hover:scale-105 hover:text-fg max-sm:hidden"
        @click="ui.hotkeysOpen = true"
      >
        <Keyboard :size="20" />
      </button>

      <template v-if="auth.ready">
        <div v-if="auth.user" ref="menuRoot" class="relative">
          <button
            type="button"
            v-tip:bottom="auth.user.name"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            class="flex size-12 items-center justify-center rounded-full bg-elevated transition hover:scale-105"
            @click="menuOpen = !menuOpen"
          >
            <img
              v-if="auth.user.picture"
              :src="auth.user.picture"
              :alt="auth.user.name"
              referrerpolicy="no-referrer"
              class="size-8 rounded-full object-cover"
            />
            <span
              v-else
              class="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-app"
            >
              {{ auth.user.name.slice(0, 1).toUpperCase() }}
            </span>
          </button>

          <div
            v-if="menuOpen"
            role="menu"
            class="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right animate-pop-in rounded-md bg-highlight p-1 shadow-[0_16px_40px_rgb(0_0_0/0.6)]"
          >
            <div class="border-b border-white/10 px-3 pb-3 pt-2">
              <div class="truncate font-semibold">{{ auth.user.name }}</div>
              <div class="truncate text-sm text-muted">{{ auth.user.email }}</div>
            </div>
            <button
              type="button"
              role="menuitem"
              class="mt-1 flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition hover:bg-white/10"
              @click="(ui.hotkeysOpen = true), (menuOpen = false)"
            >
              <Keyboard :size="16" class="text-muted" /> Горячие клавиши
            </button>
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition hover:bg-white/10"
              @click="logout"
            >
              <LogOut :size="16" class="text-muted" /> Выйти
            </button>
          </div>
        </div>

        <button
          v-else
          type="button"
          class="h-12 whitespace-nowrap rounded-full bg-fg px-6 text-[15px] font-bold text-app transition hover:scale-105 hover:bg-[#f1e8ff]"
          @click="ui.openLogin()"
        >
          Войти
        </button>
      </template>
      <span v-else class="size-12 animate-pulse rounded-full bg-elevated" />
    </div>
  </header>
</template>
