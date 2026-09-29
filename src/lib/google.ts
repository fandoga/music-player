// Minimal typings for Google Identity Services (https://accounts.google.com/gsi/client)
interface GsiCredentialResponse {
  credential: string;
}

interface GsiApi {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GsiCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
      disableAutoSelect(): void;
    };
  };
}

declare global {
  interface Window {
    google?: GsiApi;
  }
}

let scriptPromise: Promise<GsiApi> | null = null;

export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  scriptPromise ??= new Promise<GsiApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () =>
      window.google ? resolve(window.google) : reject(new Error("GSI not available"));
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Не удалось загрузить Google Sign-In"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};
