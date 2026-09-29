<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { computed, inject, ref, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlayButton from "./PlayButton.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    color?: string;
    /** scroll offset after which the bar becomes solid and shows the title */
    threshold?: number;
    showPlay?: boolean;
    playing?: boolean;
    loading?: boolean;
  }>(),
  { color: "#3b1d6e", threshold: 220 },
);
defineEmits<{ play: [] }>();

const router = useRouter();
const route = useRoute();
const scrollTop = inject<Ref<number>>("scrollTop", ref(0));

const solidness = computed(() => Math.min(1, Math.max(0, (scrollTop.value - 40) / 120)));
const showTitle = computed(() => scrollTop.value > props.threshold);

// history.state is not reactive: re-read it on every navigation
const canBack = computed(() => (route.fullPath, !!window.history.state?.back));
const canForward = computed(() => (route.fullPath, !!window.history.state?.forward));
</script>

<template>
  <div class="sticky top-0 z-20 -mb-16 flex h-16 items-center gap-2 px-4">
    <div
      class="pointer-events-none absolute inset-0 rounded-t-lg"
      :style="{
        opacity: solidness,
        background: `linear-gradient(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.35)), ${color}`,
      }"
    />
    <div class="relative flex items-center gap-2 max-md:hidden">
      <button
        type="button"
        v-tip:bottom="'Назад'"
        :disabled="!canBack"
        class="flex size-8 items-center justify-center rounded-full bg-black/50 text-fg transition hover:bg-black/70 disabled:opacity-40"
        @click="router.back()"
      >
        <ChevronLeft :size="20" />
      </button>
      <button
        type="button"
        v-tip:bottom="'Вперёд'"
        :disabled="!canForward"
        class="flex size-8 items-center justify-center rounded-full bg-black/50 text-fg transition hover:bg-black/70 disabled:opacity-40"
        @click="router.forward()"
      >
        <ChevronRight :size="20" />
      </button>
    </div>
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-1"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div v-if="showTitle && title" class="relative flex min-w-0 items-center gap-3">
        <PlayButton v-if="showPlay" size="sm" :playing="playing" :loading="loading" @click="$emit('play')" />
        <span class="truncate text-xl font-bold">{{ title }}</span>
      </div>
    </Transition>
    <div class="relative ml-auto"><slot /></div>
  </div>
</template>
