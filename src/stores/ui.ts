import { defineStore } from "pinia";
import { ref, shallowRef, watch } from "vue";
import type { SearchSource, Track } from "../lib/types";
import { storage } from "../lib/format";

export interface Toast {
  id: number;
  message: string;
  kind: "info" | "error";
}

interface DialogBase {
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean;
}

export type Dialog =
  | (DialogBase & {
      kind: "prompt";
      placeholder?: string;
      initial?: string;
      resolve: (value: string | null) => void;
    })
  | (DialogBase & { kind: "confirm"; resolve: (value: boolean) => void });

export interface TrackMenuState {
  x: number;
  y: number;
  track: Track;
  playlistId?: number;
}

export const useUiStore = defineStore("ui", () => {
  // ---------- layout preferences ----------
  const queueOpen = ref(storage.get("ui.queueOpen", true));
  const sidebarCollapsed = ref(storage.get("ui.sidebarCollapsed", false));
  const searchSource = ref<SearchSource>(storage.get("ui.searchSource", "songs"));

  watch(queueOpen, (v) => storage.set("ui.queueOpen", v));
  watch(sidebarCollapsed, (v) => storage.set("ui.sidebarCollapsed", v));
  watch(searchSource, (v) => storage.set("ui.searchSource", v));

  // Bumped to ask the search field to take focus (hotkey "/").
  const searchFocusTick = ref(0);
  const focusSearch = () => searchFocusTick.value++;

  const hotkeysOpen = ref(false);

  // ---------- toasts ----------
  const toasts = ref<Toast[]>([]);
  let toastId = 0;

  const toast = (message: string, kind: Toast["kind"] = "info") => {
    const id = ++toastId;
    toasts.value = [...toasts.value.slice(-2), { id, message, kind }];
    setTimeout(() => dismissToast(id), kind === "error" ? 4500 : 2800);
  };

  const dismissToast = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  // ---------- login modal ----------
  const loginOpen = ref(false);
  const loginReason = ref("");

  const openLogin = (reason = "") => {
    loginReason.value = reason;
    loginOpen.value = true;
  };

  // ---------- dialogs ----------
  const dialog = shallowRef<Dialog | null>(null);

  const closeDialog = () => {
    dialog.value = null;
  };

  const prompt = (options: Omit<Extract<Dialog, { kind: "prompt" }>, "kind" | "resolve">) =>
    new Promise<string | null>((resolve) => {
      dialog.value = { ...options, kind: "prompt", resolve };
    });

  const confirm = (options: Omit<Extract<Dialog, { kind: "confirm" }>, "kind" | "resolve">) =>
    new Promise<boolean>((resolve) => {
      dialog.value = { ...options, kind: "confirm", resolve };
    });

  // ---------- track context menu ----------
  const trackMenu = shallowRef<TrackMenuState | null>(null);

  const openTrackMenu = (state: TrackMenuState) => {
    trackMenu.value = state;
  };
  const closeTrackMenu = () => {
    trackMenu.value = null;
  };

  return {
    queueOpen,
    sidebarCollapsed,
    searchSource,
    searchFocusTick,
    focusSearch,
    hotkeysOpen,
    toasts,
    toast,
    dismissToast,
    loginOpen,
    loginReason,
    openLogin,
    dialog,
    closeDialog,
    prompt,
    confirm,
    trackMenu,
    openTrackMenu,
    closeTrackMenu,
  };
});
