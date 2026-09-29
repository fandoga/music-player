import { onBeforeUnmount, onMounted, type Ref } from "vue";

export const useClickOutside = (
  target: Ref<HTMLElement | undefined | null>,
  handler: () => void,
) => {
  const listener = (e: PointerEvent) => {
    if (target.value && !target.value.contains(e.target as Node)) handler();
  };
  onMounted(() => document.addEventListener("pointerdown", listener, true));
  onBeforeUnmount(() => document.removeEventListener("pointerdown", listener, true));
};
