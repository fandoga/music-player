import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("./views/HomeView.vue") },
    { path: "/search", name: "search", component: () => import("./views/SearchView.vue") },
    { path: "/liked", name: "liked", component: () => import("./views/LikedView.vue") },
    { path: "/library", name: "library", component: () => import("./views/LibraryView.vue") },
    {
      path: "/playlist/:id(\\d+)",
      name: "playlist",
      component: () => import("./views/PlaylistView.vue"),
      props: (route) => ({ id: Number(route.params.id) }),
    },
    { path: "/:pathMatch(.*)*", name: "not-found", component: () => import("./views/NotFoundView.vue") },
  ],
});
