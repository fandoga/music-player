<script setup lang="ts">
import { Music2 } from "@lucide/vue";
import { ref, watch } from "vue";

const props = defineProps<{
  src?: string | null;
  alt?: string;
  iconSize?: number;
}>();

const failed = ref(false);
const loaded = ref(false);

watch(
  () => props.src,
  () => {
    failed.value = false;
    loaded.value = false;
  },
);
</script>

<template>
  <div class="relative overflow-hidden bg-highlight">
    <div
      v-if="!src || failed"
      class="flex size-full items-center justify-center bg-gradient-to-br from-highlight to-elevated text-subtle"
    >
      <Music2 :size="iconSize ?? 18" />
    </div>
    <img
      v-else
      :src="src"
      :alt="alt ?? ''"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      draggable="false"
      class="size-full object-cover transition-opacity duration-300"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    />
  </div>
</template>
