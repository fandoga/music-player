<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PlayerBar from "./components/layout/PlayerBar.vue";
import QueuePanel from "./components/layout/QueuePanel.vue";
import Sidebar from "./components/layout/Sidebar.vue";
import TopBar from "./components/layout/TopBar.vue";
import DialogHost from "./components/overlays/DialogHost.vue";
import HotkeysModal from "./components/overlays/HotkeysModal.vue";
import LoginModal from "./components/overlays/LoginModal.vue";
import Toasts from "./components/overlays/Toasts.vue";
import TrackMenu from "./components/overlays/TrackMenu.vue";
import { useHotkeys } from "./composables/useHotkeys";
import { useAuthStore } from "./stores/auth";
import { useUiStore } from "./stores/ui";

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();

void auth.init();
useHotkeys();

// ---------- main scroller ----------
const scroller = ref<HTMLElement>();
const scrollTop = ref(0);
provide("scrollTop", scrollTop);

const onScroll = () => {
  scrollTop.value = scroller.value?.scrollTop ?? 0;
};

watch(
  () => route.path,
  () => {
    scroller.value?.scrollTo({ top: 0 });
    scrollTop.value = 0;
  },
);

// ---------- queue panel: docked on wide screens, drawer otherwise ----------
const wide = ref(true);
const mq = window.matchMedia("(min-width: 1280px)");
const onMq = () => (wide.value = mq.matches);

onMounted(() => {
  onMq();
  if (!wide.value) ui.queueOpen = false;
  mq.addEventListener("change", onMq);
});
onBeforeUnmount(() => mq.removeEventListener("change", onMq));
</script>

<template>
  <div class="flex h-dvh flex-col bg-app text-fg">
    <TopBar class="shrink-0" />

    <div class="flex min-h-0 flex-1 gap-2 px-2">
      <Sidebar class="max-md:hidden" />

      <main class="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-surface">
        <div ref="scroller" class="scroll-area h-full overflow-y-auto" @scroll.passive="onScroll">
          <RouterView v-slot="{ Component }">
            <component :is="Component" :key="route.path" />
          </RouterView>
        </div>
      </main>

      <QueuePanel v-if="wide && ui.queueOpen" />
    </div>

    <PlayerBar class="shrink-0" />

    <!-- queue as a drawer on narrow screens -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!wide && ui.queueOpen"
        class="fixed inset-0 z-[100] flex justify-end bg-black/60"
        @pointerdown.self="ui.queueOpen = false"
      >
        <QueuePanel class="m-2 mb-[84px] max-w-[calc(100vw-16px)] shadow-2xl ring-1 ring-white/10" />
      </div>
    </Transition>

    <TrackMenu />
    <DialogHost />
    <LoginModal v-if="ui.loginOpen" />
    <HotkeysModal v-if="ui.hotkeysOpen" />
    <Toasts />
  </div>
</template>
