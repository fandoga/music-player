import { onBeforeUnmount, onMounted } from "vue";
import { useLibraryStore } from "../stores/library";
import { usePlayerStore } from "../stores/player";
import { useUiStore } from "../stores/ui";

export const HOTKEYS: { keys: string[]; label: string }[] = [
  { keys: ["Пробел"], label: "Воспроизведение / пауза" },
  { keys: ["Shift", "→"], label: "Следующий трек" },
  { keys: ["Shift", "←"], label: "Предыдущий трек" },
  { keys: ["→"], label: "Перемотать на 5 секунд вперёд" },
  { keys: ["←"], label: "Перемотать на 5 секунд назад" },
  { keys: ["↑"], label: "Громче" },
  { keys: ["↓"], label: "Тише" },
  { keys: ["M"], label: "Выключить / включить звук" },
  { keys: ["S"], label: "Перемешивание" },
  { keys: ["R"], label: "Режим повтора" },
  { keys: ["L"], label: "Лайк текущего трека" },
  { keys: ["Q"], label: "Показать / скрыть очередь" },
  { keys: ["/"], label: "Поиск" },
  { keys: ["?"], label: "Горячие клавиши" },
];

const isTyping = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

export const useHotkeys = () => {
  const player = usePlayerStore();
  const ui = useUiStore();
  const library = useLibraryStore();

  const onKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    // let dialogs and menus handle their own keys
    if (ui.dialog || ui.loginOpen || ui.trackMenu) return;

    const handled = () => e.preventDefault();

    switch (e.code) {
      case "Space":
        // buttons react to Space themselves
        if (e.target instanceof HTMLButtonElement) return;
        handled();
        void player.togglePlay();
        return;
      case "ArrowRight":
        handled();
        if (e.shiftKey) player.next();
        else player.seekBy(5);
        return;
      case "ArrowLeft":
        handled();
        if (e.shiftKey) player.prev();
        else player.seekBy(-5);
        return;
      case "ArrowUp":
        handled();
        player.setVolume(player.volume + 0.05);
        return;
      case "ArrowDown":
        handled();
        player.setVolume(player.volume - 0.05);
        return;
      case "KeyM":
        player.toggleMute();
        return;
      case "KeyS":
        player.toggleShuffle();
        return;
      case "KeyR":
        player.cycleRepeat();
        return;
      case "KeyL":
        if (player.current) void library.toggleLike(player.current);
        return;
      case "KeyQ":
        ui.queueOpen = !ui.queueOpen;
        return;
    }

    if (e.key === "/") {
      handled();
      ui.focusSearch();
    } else if (e.key === "?") {
      ui.hotkeysOpen = !ui.hotkeysOpen;
    }
  };

  onMounted(() => window.addEventListener("keydown", onKeydown));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
};
