import { defineStore } from "pinia";
import { ref } from "vue";
import { api, ApiError } from "../lib/api";
import type { User } from "../lib/types";
import { useLibraryStore } from "./library";
import { useUiStore } from "./ui";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  // true once we know whether there is a session
  const ready = ref(false);
  const googleClientId = ref<string | null>(null);

  const init = async () => {
    const [config, me] = await Promise.allSettled([api.authConfig(), api.me()]);
    if (config.status === "fulfilled") googleClientId.value = config.value.googleClientId;
    if (me.status === "fulfilled") {
      user.value = me.value;
      void useLibraryStore().load();
    }
    ready.value = true;
  };

  const loginWithGoogle = async (credential: string) => {
    user.value = await api.loginGoogle(credential);
    useUiStore().toast(`Привет, ${user.value.name.split(" ")[0]}!`);
    await useLibraryStore().load();
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      user.value = null;
      useLibraryStore().reset();
      window.google?.accounts.id.disableAutoSelect();
      useUiStore().toast("Вы вышли из аккаунта");
    }
  };

  // Called when any request says the session is gone.
  const handleUnauthorized = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401 && user.value) {
      user.value = null;
      useLibraryStore().reset();
      useUiStore().openLogin("Сессия истекла, войдите снова");
      return true;
    }
    return false;
  };

  return { user, ready, googleClientId, init, loginWithGoogle, logout, handleUnauthorized };
});
