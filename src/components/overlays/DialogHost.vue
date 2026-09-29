<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useUiStore } from "../../stores/ui";
import Modal from "./Modal.vue";

const ui = useUiStore();
const dialog = computed(() => ui.dialog);
const value = ref("");

watch(dialog, (d) => {
  value.value = d?.kind === "prompt" ? (d.initial ?? "") : "";
});

const cancel = () => {
  const d = dialog.value;
  if (!d) return;
  ui.closeDialog();
  if (d.kind === "prompt") d.resolve(null);
  else d.resolve(false);
};

const submit = () => {
  const d = dialog.value;
  if (!d) return;
  if (d.kind === "prompt") {
    const text = value.value.trim();
    if (!text) return;
    ui.closeDialog();
    d.resolve(text);
  } else {
    ui.closeDialog();
    d.resolve(true);
  }
};

const selectAll = (e: FocusEvent) => (e.target as HTMLInputElement).select();
</script>

<template>
  <Modal v-if="dialog" :key="dialog.title" :title="dialog.title" @close="cancel">
    <form class="mt-4" @submit.prevent="submit">
      <p v-if="dialog.description" class="text-muted">{{ dialog.description }}</p>
      <template v-if="dialog.kind === 'prompt'">
        <input
          v-model="value"
          autofocus
          maxlength="100"
          :placeholder="dialog.placeholder"
          class="mt-2 h-12 w-full rounded-md bg-white/10 px-4 text-fg outline-none ring-1 ring-transparent transition placeholder:text-subtle focus:bg-white/[0.14] focus:ring-2 focus:ring-accent"
          @focus="selectAll"
        />
        <div class="mt-1 text-right text-xs text-subtle">{{ value.length }}/100</div>
      </template>
      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="h-11 rounded-full px-6 font-bold text-muted transition hover:scale-105 hover:text-fg"
          @click="cancel"
        >
          Отмена
        </button>
        <button
          type="submit"
          :autofocus="dialog.kind === 'confirm'"
          :disabled="dialog.kind === 'prompt' && !value.trim()"
          class="h-11 rounded-full px-7 font-bold transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          :class="dialog.danger ? 'bg-danger text-app' : 'bg-accent text-app hover:bg-accent-hi'"
        >
          {{ dialog.confirmLabel }}
        </button>
      </div>
    </form>
  </Modal>
</template>
