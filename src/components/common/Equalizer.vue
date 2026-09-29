<script setup lang="ts">
defineProps<{ paused?: boolean }>();
</script>

<template>
  <span class="inline-flex h-3.5 items-end gap-[2px]" aria-hidden="true">
    <span
      v-for="(delay, i) in [0, -0.35, -0.6, -0.15]"
      :key="i"
      class="w-[3px] origin-bottom rounded-[1px] bg-accent-hi"
      :class="paused ? 'h-1' : 'h-full animate-eq'"
      :style="{ animationDelay: `${delay}s` }"
    />
  </span>
</template>
