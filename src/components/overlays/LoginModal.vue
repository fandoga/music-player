<script setup lang="ts">
import { AudioLines, CircleAlert, Heart, ListMusic, LoaderCircle } from "@lucide/vue";
import { onMounted, ref } from "vue";
import { loadGoogleIdentity } from "../../lib/google";
import { useAuthStore } from "../../stores/auth";
import { useUiStore } from "../../stores/ui";
import Modal from "./Modal.vue";

const auth = useAuthStore();
const ui = useUiStore();

const buttonHost = ref<HTMLElement>();
const status = ref<"loading" | "ready" | "signing-in" | "error" | "not-configured">("loading");
const error = ref("");

const close = () => (ui.loginOpen = false);

onMounted(async () => {
  if (!auth.googleClientId) {
    status.value = "not-configured";
    return;
  }
  try {
    const google = await loadGoogleIdentity();
    google.accounts.id.initialize({
      client_id: auth.googleClientId,
      cancel_on_tap_outside: true,
      callback: async ({ credential }) => {
        status.value = "signing-in";
        try {
          await auth.loginWithGoogle(credential);
          close();
        } catch {
          status.value = "error";
          error.value = "Не удалось войти. Попробуйте ещё раз.";
        }
      },
    });
    if (buttonHost.value) {
      google.accounts.id.renderButton(buttonHost.value, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        locale: "ru",
        width: 300,
      });
    }
    status.value = "ready";
  } catch (e) {
    status.value = "error";
    error.value = e instanceof Error ? e.message : "Google Sign-In недоступен";
  }
});
</script>

<template>
  <Modal width="max-w-[420px]" @close="close">
    <div class="flex flex-col items-center pt-2 text-center">
      <span
        class="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-hi to-accent-lo shadow-[0_8px_24px_rgb(168_85_247/0.45)]"
      >
        <AudioLines :size="28" :stroke-width="2.5" />
      </span>
      <h2 class="mt-5 text-[28px] font-extrabold leading-tight tracking-tight">
        Войдите в Музыкалити
      </h2>
      <p class="mt-2 text-muted">
        {{ ui.loginReason || "Сохраняйте любимые треки и собирайте плейлисты." }}
      </p>

      <ul class="mt-6 flex w-full flex-col gap-2 text-left text-sm">
        <li class="flex items-center gap-3 rounded-lg bg-white/[0.04] px-4 py-3">
          <Heart :size="18" class="shrink-0 text-accent-hi" /> Лайки для треков и видео с YouTube
        </li>
        <li class="flex items-center gap-3 rounded-lg bg-white/[0.04] px-4 py-3">
          <ListMusic :size="18" class="shrink-0 text-accent-hi" /> Свои плейлисты на всех устройствах
        </li>
      </ul>

      <div class="mt-6 flex min-h-11 w-full flex-col items-center justify-center gap-3">
        <div
          v-show="status === 'ready' || status === 'error'"
          ref="buttonHost"
          class="flex min-h-11 justify-center [color-scheme:light]"
        />
        <div v-if="status === 'loading' || status === 'signing-in'" class="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle :size="18" class="animate-spin" />
          {{ status === "loading" ? "Загружаем Google…" : "Входим…" }}
        </div>
        <p v-if="status === 'error'" class="flex items-center gap-2 text-sm text-danger">
          <CircleAlert :size="16" /> {{ error }}
        </p>
        <div
          v-if="status === 'not-configured'"
          class="w-full rounded-lg border border-danger/30 bg-danger/10 p-4 text-left text-sm"
        >
          <p class="flex items-center gap-2 font-semibold text-danger">
            <CircleAlert :size="16" /> Вход через Google не настроен
          </p>
          <p class="mt-1.5 text-muted">
            Укажите <code class="rounded bg-black/30 px-1 text-fg">GOOGLE_CLIENT_ID</code> в
            <code class="rounded bg-black/30 px-1 text-fg">backend/.env</code> и перезапустите бэкенд.
          </p>
        </div>
      </div>

      <p class="mt-6 text-xs text-subtle">
        Мы получаем только ваше имя, почту и аватар из Google-аккаунта.
      </p>
    </div>
  </Modal>
</template>
