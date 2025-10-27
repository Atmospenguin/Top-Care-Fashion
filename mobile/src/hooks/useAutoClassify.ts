// mobile/src/hooks/useAutoClassify.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { classifyImage, describeProduct, type ClassifyResponse } from "../services/aiService";

// If your aiService doesn't export DescribeResponse, keep this local type:
type DescribeResponse = {
  category: string;
  labels?: string[];
  blurb?: string;
  meta?: any;
};

export type AutoClassifyItem = {
  uri: string;
  status: "pending" | "classifying" | "describing" | "done" | "error";
  classification?: ClassifyResponse | null;
  description?: DescribeResponse | null;
  error?: string | null;
};

type Options = {
  autoDescribe?: boolean;     // default: true
  concurrency?: number;       // default: 2
  onUpdate?: (items: AutoClassifyItem[]) => void;
};

export function useAutoClassify(uris: string[], opts: Options = {}) {
  const { autoDescribe = true, concurrency = 2, onUpdate } = opts;

  const [items, setItems] = useState<AutoClassifyItem[]>(
    () => uris.map(uri => ({ uri, status: "pending" }))
  );
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);

  // Reset queue whenever the URI list changes
  useEffect(() => {
    setItems(uris.map(uri => ({ uri, status: "pending" })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uris.join("|")]); // good enough for small arrays

  // Notify parent on updates (optional)
  useEffect(() => {
    onUpdate?.(items);
  }, [items, onUpdate]);

  // Public controls
  const start = () => setRunning(true);
  const cancel = () => {
    cancelRef.current = true;
    setRunning(false);
  };

  // Re-queue helpers (to allow “Classify again”)
  const requeueAll = () =>
    setItems(prev => prev.map(x => ({ ...x, status: "pending", error: null })));

  const requeueOne = (uri: string) =>
    setItems(prev =>
      prev.map(x => (x.uri === uri ? { ...x, status: "pending", error: null } : x))
    );

  // Runner
  useEffect(() => {
    if (!running) return;
    cancelRef.current = false;

    let active = 0;
    let idx = 0;

    const localItems = items; // snapshot so indices don't shift mid-run

    const runNext = async () => {
      if (cancelRef.current) return;
      if (idx >= localItems.length && active === 0) {
        setRunning(false);
        return;
      }
      while (active < concurrency && idx < localItems.length) {
        const cur = idx++;
        active++;
        processItem(cur).finally(() => {
          active--;
          runNext();
        });
      }
    };

    const processItem = async (i: number) => {
      try {
        setItems(prev => {
          const c = [...prev];
          c[i] = { ...c[i], status: "classifying", error: null };
          return c;
        });

        const cls = await classifyImage(localItems[i].uri);
        if (cancelRef.current) return;

        let desc: DescribeResponse | undefined;
        if (autoDescribe) {
          setItems(prev => {
            const c = [...prev];
            c[i] = { ...c[i], status: "describing", classification: cls };
            return c;
          });
          desc = await describeProduct(cls.category, cls.labels ?? []);
          if (cancelRef.current) return;
        }

        setItems(prev => {
          const c = [...prev];
          c[i] = {
            ...c[i],
            status: "done",
            classification: cls,
            description: desc ?? c[i].description,
            error: null,
          };
          return c;
        });
      } catch (e: any) {
        if (cancelRef.current) return;
        setItems(prev => {
          const c = [...prev];
          c[i] = { ...c[i], status: "error", error: e?.message || "Failed" };
          return c;
        });
      }
    };

    runNext();
    return () => {
      cancelRef.current = true;
    };
  }, [running, concurrency, autoDescribe, items]);

  const progress = useMemo(() => {
    const total = items.length || 1;
    const done = items.filter(x => x.status === "done").length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }, [items]);

  return { items, running, start, cancel, progress, requeueAll, requeueOne };
}
