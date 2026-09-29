<script setup lang="ts">
import { Disc3 } from "@lucide/vue";
import EmptyState from "../components/common/EmptyState.vue";
import PageTopBar from "../components/common/PageTopBar.vue";
</script>

<template>
  <div class="relative">
    <PageTopBar />
    <div class="pt-24">
      <EmptyState :icon="Disc3" title="Страница не найдена" text="Кажется, эта пластинка потерялась.">
        <RouterLink to="/" class="rounded-full bg-fg px-8 py-3 font-bold text-app transition hover:scale-105">
          На главную
        </RouterLink>
      </EmptyState>
    </div>
  </div>
</template>
