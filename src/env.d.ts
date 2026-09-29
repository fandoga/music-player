/// <reference types="vite/client" />

import type { vTip } from "./lib/tooltip";

declare module "vue" {
  interface GlobalDirectives {
    vTip: typeof vTip;
  }
}
