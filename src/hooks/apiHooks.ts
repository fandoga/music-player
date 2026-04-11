import { useQuery } from "@tanstack/vue-query";
import { fetchCharts, fetchSearch, fetchTrack } from "../queries/tracks";
import { computed, type Ref } from "vue";

export const TRACKS_FEED_QUERY_KEY = ["tracks", "feed"] as const;

export const useChartsQuery = (country: string) =>
  useQuery({
    queryKey: TRACKS_FEED_QUERY_KEY,
    queryFn: () => fetchCharts(country),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

export const useSearchQuery = (q: Ref<string>) =>
  useQuery({
    queryKey: ["tracks", "search", q.value.trim()],
    queryFn: () => fetchSearch(q.value),
    enabled: false,
    retry: 1,
  });

export const useGetTrack = (id: Ref<string | undefined>) =>
  useQuery({
    queryKey: computed(() => ["track", id.value] as const),
    queryFn: () => fetchTrack(id.value!),
    enabled: computed(() => Boolean(id.value)),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
