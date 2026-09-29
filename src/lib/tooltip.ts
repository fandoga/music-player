import type { Directive } from "vue";

// Lightweight Spotify-like tooltip: v-tip="'Text'" or v-tip:bottom="'Text'"
type Placement = "top" | "bottom" | "left" | "right";

let el: HTMLDivElement | null = null;
let timer: number | undefined;

const hide = () => {
  clearTimeout(timer);
  el?.remove();
  el = null;
};

const show = (target: HTMLElement, text: string, placement: Placement) => {
  hide();
  el = document.createElement("div");
  el.className = "tooltip";
  el.textContent = text;
  document.body.appendChild(el);

  const rect = target.getBoundingClientRect();
  const tip = el.getBoundingClientRect();
  const gap = 8;
  let top = rect.top - tip.height - gap;
  let left = rect.left + rect.width / 2 - tip.width / 2;
  if (placement === "bottom") top = rect.bottom + gap;
  if (placement === "left" || placement === "right") {
    top = rect.top + rect.height / 2 - tip.height / 2;
    left = placement === "left" ? rect.left - tip.width - gap : rect.right + gap;
  }
  el.style.top = `${Math.max(4, top)}px`;
  el.style.left = `${Math.min(window.innerWidth - tip.width - 4, Math.max(4, left))}px`;
};

interface TipEl extends HTMLElement {
  __tip?: { text: string; placement: Placement; cleanup: () => void };
}

export const vTip: Directive<TipEl, string | undefined | null> = {
  mounted(target, binding) {
    const state = {
      text: binding.value ?? "",
      placement: (binding.arg as Placement) || "top",
      cleanup: () => {},
    };
    const enter = () => {
      clearTimeout(timer);
      if (!state.text) return;
      timer = window.setTimeout(() => show(target, state.text, state.placement), 450);
    };
    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", hide);
    target.addEventListener("mousedown", hide);
    state.cleanup = () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", hide);
      target.removeEventListener("mousedown", hide);
    };
    // icon-only controls get the tooltip as their accessible name
    const iconOnly = !target.textContent?.trim() && !target.hasAttribute("aria-label");
    if (iconOnly && state.text) target.setAttribute("aria-label", state.text);
    target.__tip = { ...state, iconOnly } as typeof state;
  },
  updated(target, binding) {
    if (!target.__tip) return;
    target.__tip.text = binding.value ?? "";
    if (binding.value && (target.__tip as { iconOnly?: boolean }).iconOnly)
      target.setAttribute("aria-label", binding.value);
    if (el && binding.value !== binding.oldValue) {
      if (binding.value) el.textContent = binding.value;
      else hide();
    }
  },
  beforeUnmount(target) {
    target.__tip?.cleanup();
    hide();
  },
};
