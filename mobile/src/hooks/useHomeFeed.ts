// File: mobile/src/hooks/useHomeFeed.ts
// Simple data hook for Home feed (pull-to-refresh + load more + dev toggles)

import { useCallback, useMemo, useRef, useState } from "react";
import { API_CONFIG, apiGet, HomeFeedItem, HomeFeedResponse } from "../config/api";

export type FeedOptions = {
  limit?: number; // default 20
  seedId?: number; // for reproducibility during testing
  tag?: string; // filter (optional)
  preferImagesFirst?: boolean; // client-side preference
  hideUnknownBrand?: boolean; // client-side preference
};

export function useHomeFeed(initial: FeedOptions = {}) {
  const [items, setItems] = useState<HomeFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const optsRef = useRef<FeedOptions>({ limit: 20, ...initial });

  const buildParams = useCallback(
    (overrides?: Partial<FeedOptions> & { page?: number }) => {
      const o = { ...optsRef.current, ...(overrides ?? {}) };
      const params: Record<string, any> = { limit: o.limit ?? 20 };
      if (o.seedId !== undefined) params.seedId = o.seedId;
      if (o.tag) params.tag = o.tag;
      // If your API supports cursor/offset, map it here. We'll send "page" as a hint.
      if (overrides?.page) params.page = overrides.page; // harmless if ignored by backend
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
        return b.fair_score - a.fair_score; // then score
      });
    }

    if (hideUnknownBrand) {
      result = result.filter((x) => x.brand && x.brand.toLowerCase() !== "n/a" && x.brand.trim() !== "");
    }

    // Deduplicate by id (useful if backend ignores page param)
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

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<HomeFeedResponse>(API_CONFIG.ENDPOINTS.FEED.HOME, buildParams({ page: 1 }));
      const next = applyClientPrefs(data.items ?? []);
      setItems(next);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [applyClientPrefs, buildParams]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await apiGet<HomeFeedResponse>(API_CONFIG.ENDPOINTS.FEED.HOME, buildParams({ page: 1 }));
      const next = applyClientPrefs(data.items ?? []);
      setItems(next);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setRefreshing(false);
    }
  }, [applyClientPrefs, buildParams]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing) return;
    setLoading(true);
    setError(null);
    try {
      const pageNext = page + 1;
      const data = await apiGet<HomeFeedResponse>(API_CONFIG.ENDPOINTS.FEED.HOME, buildParams({ page: pageNext }));
      const merged = applyClientPrefs([...items, ...(data.items ?? [])]);
      setItems(merged);
      setPage(pageNext);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [applyClientPrefs, buildParams, items, loading, page, refreshing]);

  const setOptions = useCallback((next: Partial<FeedOptions>) => {
    optsRef.current = { ...optsRef.current, ...next };
  }, []);

  const state = useMemo(
    () => ({ items, loading, refreshing, error, page }),
    [error, items, loading, page, refreshing]
  );

  return { ...state, loadInitial, refresh, loadMore, setOptions };
}