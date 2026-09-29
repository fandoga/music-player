<script setup lang="ts">
import { LoaderCircle, Pause, Play } from "@lucide/vue";

withDefaults(
  defineProps<{
    playing?: boolean;
    loading?: boolean;
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
  }>(),
  { size: "lg" },
);

defineEmits<{ click: [] }>();

const sizes = {
  sm: { box: "size-10", icon: 18 },
  md: { box: "size-12", icon: 20 },
  lg: { box: "size-14", icon: 24 },
};
</script>

<template>
  <button
    type="button"
    v-tip="playing ? 'Пауза' : 'Слушать'"
    :disabled="disabled"
    class="flex shrink-0 items-center justify-center rounded-full bg-accent text-app shadow-[0_8px_24px_rgb(168_85_247/0.35)] transition hover:scale-105 hover:bg-accent-hi active:scale-100 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-accent"
    :class="sizes[size].box"
    @click.stop="$emit('click')"
  >
    <LoaderCircle v-if="loading" :size="sizes[size].icon" class="animate-spin" />
    <Pause v-else-if="playing" :size="sizes[size].icon" fill="currentColor" stroke-width="0" />
    <Play v-else :size="sizes[size].icon" fill="currentColor" stroke-width="0" class="ml-0.5" />
  </button>
</template>
