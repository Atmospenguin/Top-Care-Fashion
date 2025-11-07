// mobile/src/hooks/useHomeFeed.ts
// Simple data hook for Home feed (pull-to-refresh + load more + dev toggles)

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  API_BASE_URL,
  API_CONFIG,
  apiGet,
  type HomeFeedItem,
  type HomeFeedResponse,
} from "../config/api";

export type FeedOptions = {
  limit?: number;            // default 20
  seedId?: number;           // for reproducibility during testing
  tag?: string;              // optional filter
  preferImagesFirst?: boolean;
  hideUnknownBrand?: boolean;
};

export function useHomeFeed(initial: FeedOptions = {}) {
  const [items, setItems] = useState<HomeFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const optsRef = useRef<FeedOptions>({ limit: 20, ...initial });

  // Ensure we start with a seed if none was provided
  useEffect(() => {
    if (optsRef.current.seedId === undefined) {
      const INT32_MAX = 2_147_483_647;
      const s = (Date.now() % INT32_MAX) | 0;
      optsRef.current.seedId = s;
      if (__DEV__) console.info("[feed] init seedId", s);
    }
  }, []);

  const buildParams = useCallback(
    (
      overrides?: Partial<FeedOptions> & {
        page?: number;
        cacheBust?: number;
        noStore?: 0 | 1;
      }
    ) => {
      const o = { ...optsRef.current, ...(overrides ?? {}) };
      const params: Record<string, any> = { limit: o.limit ?? 20 };
      if (o.seedId !== undefined) params.seedId = o.seedId;
      if (o.tag) params.tag = o.tag;
      if (overrides?.page) params.page = overrides.page; // harmless if backend ignores
      if (overrides?.cacheBust) params.cacheBust = overrides.cacheBust; // server cache bypass
      if (overrides?.noStore) params.noStore = overrides.noStore;       // server cache bypass
      return params;
    },
    []
  );

  const applyClientPrefs = useCallback((list: HomeFeedItem[]) => {
    const { preferImagesFirst, hideUnknownBrand } = optsRef.current;
    let result = list;

    if (preferImagesFirst) {
      result = [...result].sort((a, b) => {
        const ai = a.image_url ? 1 : 0;
        const bi = b.image_url ? 1 : 0;
        if (bi !== ai) return bi - ai; // images first
        return (b.fair_score ?? 0) - (a.fair_score ?? 0); // then score
      });
    }

    if (hideUnknownBrand) {
      result = result.filter(
        (x) => x.brand && x.brand.trim() !== "" && x.brand.toLowerCase() !== "n/a"
      );
    }

    // Deduplicate by id
    const seen = new Set<number>();
    const deduped: HomeFeedItem[] = [];
    for (const it of result) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        deduped.push(it);
      }
    }

    return deduped;
  }, []);

  const fetchPage = useCallback(
    async (pageNum: number, extra?: { cacheBust?: number; noStore?: 0 | 1 }) => {
      const params = buildParams({ page: pageNum, ...extra });
      const fullUrl =
        `${API_BASE_URL.replace(/\/+$/, "")}` +
        `${API_CONFIG.ENDPOINTS.FEED.HOME}` +
        `${params ? `?${new URLSearchParams(params as any).toString()}` : ""}`;

      console.info("[feed] GET", fullUrl);
      const data = await apiGet<HomeFeedResponse>(API_CONFIG.ENDPOINTS.FEED.HOME, params);

      // Debug IDs safely inside scope
      if (process.env.NODE_ENV !== "production") {
        const ids = (data.items ?? []).map((x: HomeFeedItem) => x.id);
        console.info(
          `[feed] page=${params.page ?? 1} seed=${params.seedId} ids:`,
          ids
        );
      }

      return data;
    },
    [buildParams]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Bypass server cache for faster iteration at startup
      const data = await fetchPage(1, { cacheBust: Date.now(), noStore: 1 });
      const next = applyClientPrefs(data.items ?? []);
      setItems(next);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [applyClientPrefs, fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      // Randomize seed to reshuffle on refresh
      const nowMs = Date.now();
      const INT32_MAX = 2_147_483_647;
      optsRef.current.seedId = (nowMs % INT32_MAX) | 0; // clamp to signed 32-bit

      // Bypass 20s server cache and force new seed to take effect
      const data = await fetchPage(1, { cacheBust: nowMs, noStore: 1 });
      const next = applyClientPrefs(data.items ?? []);
      setItems(next);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setRefreshing(false);
    }
  }, [applyClientPrefs, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing) return;
    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const data = await fetchPage(nextPage); // keep normal caching for pagination
      const merged = applyClientPrefs([...items, ...(data.items ?? [])]);
      setItems(merged);
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [applyClientPrefs, fetchPage, items, loading, page, refreshing]);

  const setOptions = useCallback((next: Partial<FeedOptions>) => {
    optsRef.current = { ...optsRef.current, ...next };
  }, []);

  const state = useMemo(
    () => ({ items, loading, refreshing, error, page }),
    [items, loading, refreshing, error, page]
  );

  return { ...state, loadInitial, refresh, loadMore, setOptions };
}
