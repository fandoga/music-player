<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    kicker?: string;
    title: string;
    color?: string;
    titleClickable?: boolean;
  }>(),
  { color: "#5b2a9e" },
);
defineEmits<{ titleClick: [] }>();

// shrink long titles like Spotify does
const titleSize = computed(() => {
  const n = props.title.length;
  if (n <= 10) return "text-5xl md:text-7xl xl:text-8xl";
  if (n <= 20) return "text-4xl md:text-6xl xl:text-7xl";
  return "text-3xl md:text-5xl";
});
</script>

<template>
  <header
    class="relative flex min-h-[300px] items-end gap-6 px-6 pb-6 pt-24 max-sm:flex-col max-sm:items-start"
    :style="{ background: `linear-gradient(${color}, color-mix(in srgb, ${color} 45%, #140e1d))` }"
  >
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
    <div class="relative size-[192px] shrink-0 overflow-hidden rounded-md shadow-[0_8px_40px_rgb(0_0_0/0.55)] xl:size-[232px] max-sm:size-[160px]">
      <slot name="cover" />
    </div>
    <div class="relative min-w-0 flex-1">
      <p v-if="kicker" class="text-sm font-semibold">{{ kicker }}</p>
      <h1
        class="mb-4 mt-1 line-clamp-2 break-words font-black leading-[1.05] tracking-tight"
        :class="[titleSize, titleClickable ? 'cursor-pointer' : '']"
        :title="titleClickable ? 'Изменить название' : undefined"
        @click="titleClickable && $emit('titleClick')"
      >
        {{ title }}
      </h1>
      <div class="flex flex-wrap items-center gap-1 text-sm text-fg/80">
        <slot name="meta" />
      </div>
    </div>
  </header>
</template>
