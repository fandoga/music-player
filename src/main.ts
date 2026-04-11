import { createApp } from "vue";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";

const queryClient = new QueryClient();
const pinia = createPinia();

createApp(App)
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .mount("#app");
