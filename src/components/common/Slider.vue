<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    /** 0..1 */
    value: number;
    disabled?: boolean;
    label: string;
    valueText?: string;
    step?: number;
  }>(),
  { step: 0.05 },
);

const emit = defineEmits<{
  /** live value while dragging */
  input: [value: number];
  /** final value on release / keyboard */
  change: [value: number];
}>();

const track = ref<HTMLDivElement>();
const dragging = ref(false);
const dragValue = ref(0);

const shown = computed(() => {
  const v = dragging.value ? dragValue.value : props.value;
  return Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
});

const valueAt = (clientX: number) => {
  const rect = track.value!.getBoundingClientRect();
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
};

const onPointerDown = (e: PointerEvent) => {
  if (props.disabled || e.button !== 0) return;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  dragging.value = true;
  dragValue.value = valueAt(e.clientX);
  emit("input", dragValue.value);
};

const onPointerMove = (e: PointerEvent) => {
  if (!dragging.value) return;
  dragValue.value = valueAt(e.clientX);
  emit("input", dragValue.value);
};

const onPointerUp = () => {
  if (!dragging.value) return;
  dragging.value = false;
  emit("change", dragValue.value);
};

const onKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;
  const delta =
    e.key === "ArrowRight" || e.key === "ArrowUp"
      ? props.step
      : e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? -props.step
        : e.key === "Home"
          ? -1
          : e.key === "End"
            ? 1
            : 0;
  if (!delta) return;
  e.preventDefault();
  e.stopPropagation();
  emit("change", Math.min(1, Math.max(0, props.value + delta)));
};
</script>

<template>
  <div
    class="group relative flex h-4 w-full touch-none items-center"
    :class="disabled ? 'opacity-50' : 'cursor-pointer'"
    role="slider"
    :tabindex="disabled ? -1 : 0"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(shown * 100)"
    :aria-valuetext="valueText"
    :aria-disabled="disabled"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeydown"
  >
    <div ref="track" class="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
      <div
        class="absolute inset-y-0 left-0 rounded-full"
        :class="
          dragging
            ? 'bg-accent'
            : 'bg-fg group-hover:bg-accent group-focus-visible:bg-accent'
        "
        :style="{ width: `${shown * 100}%` }"
      />
    </div>
    <div
      class="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg shadow-[0_2px_6px_rgb(0_0_0/0.5)] transition-opacity"
      :class="
        dragging
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
      "
      :style="{ left: `${shown * 100}%` }"
    />
  </div>
</template>
