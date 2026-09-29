<script setup lang="ts">
import type { Component } from "vue";

defineProps<{ icon: Component; title: string; text?: string }>();
</script>

<template>
  <div class="flex flex-col items-center px-6 py-16 text-center">
    <span class="flex size-20 items-center justify-center rounded-full bg-elevated text-muted">
      <component :is="icon" :size="34" />
    </span>
    <h2 class="mt-6 text-2xl font-bold md:text-3xl">{{ title }}</h2>
    <p v-if="text" class="mt-2 max-w-md text-muted">{{ text }}</p>
    <div class="mt-6 flex gap-3"><slot /></div>
  </div>
</template>
