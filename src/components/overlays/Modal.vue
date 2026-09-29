<script setup lang="ts">
import { X } from "@lucide/vue";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(defineProps<{ title?: string; width?: string; closable?: boolean }>(), {
  width: "max-w-md",
  closable: true,
});
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement>();
let previouslyFocused: HTMLElement | null = null;

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.closable) {
    e.stopPropagation();
    emit("close");
  }
  // keep Tab inside the dialog
  if (e.key === "Tab" && panel.value) {
    const focusable = panel.value.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

onMounted(async () => {
  previouslyFocused = document.activeElement as HTMLElement | null;
  await nextTick();
  const auto = panel.value?.querySelector<HTMLElement>("[autofocus]") ?? panel.value;
  auto?.focus();
});

onBeforeUnmount(() => previouslyFocused?.focus?.());
</script>

<template>
  <div
    class="fixed inset-0 z-[200] flex animate-fade-in items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
    @pointerdown.self="closable && emit('close')"
    @keydown="onKeydown"
  >
    <div
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
      class="relative w-full animate-pop-in rounded-xl bg-elevated p-6 shadow-[0_24px_64px_rgb(0_0_0/0.6)] outline-none ring-1 ring-white/5"
      :class="width"
    >
      <button
        v-if="closable"
        type="button"
        aria-label="Закрыть"
        class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-white/10 hover:text-fg"
        @click="emit('close')"
      >
        <X :size="18" />
      </button>
      <h2 v-if="title" class="pr-8 text-2xl font-bold">{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>
