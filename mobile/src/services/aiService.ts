// mobile/src/services/aiService.ts
import { API_CONFIG, buildUrl, ApiError } from "../config/api";

/** Toggle verbose logging in dev without spamming prod */
const DEBUG_AI = __DEV__ || process.env.EXPO_PUBLIC_DEBUG_AI === "1";

export const CATEGORY_DISPLAY: Record<string, string> = {
  Top: "Tops",
  Bottom: "Bottoms",
  Footwear: "Footwear",
  Accessories: "Accessories",
  Bags: "Bags",
  Dresses: "Dresses",
  Outerwear: "Outerwear",
};

type TopK = { label: string; score: number };

export type ClassifyResponse = {
  category: string;
  confidence: number;
  labels?: string[];
  topK?: TopK[];
  meta?: any;
};

export type DescribeResponse = {
  category: string;
  labels: string[];
  blurb: string;
  meta: {
    source: "gemini" | "fallback";
    model: string;
    attempts: number;
    latency_ms: number;
  };
};

/** Guess mime from filename; default to jpeg for RN camera roll uris */
function guessMime(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    if (DEBUG_AI) console.warn("[AI] Non-JSON response:", text.slice(0, 200));
    return text;
  }
}

function shouldRetry(status: number) {
  return status === 429 || status === 503;
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/** Upload image and classify */
export async function classifyImage(uri: string): Promise<ClassifyResponse> {
  const filename = uri.split("/").pop() ?? "photo.jpg";
  const type = guessMime(filename);

  const formData = new FormData();
  formData.append("image", { uri, name: filename, type } as any);

  const url = buildUrl(API_CONFIG.ENDPOINTS.AI.CLASSIFY);

  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      if (DEBUG_AI) console.log("[AI] POST", url, { filename, type, attempt });

      const res = await fetchWithTimeout(
        url,
        {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" }, // don't set Content-Type manually
        },
        API_CONFIG.TIMEOUT
      );

      const payload = await safeJson(res);

      if (!res.ok) {
        if (shouldRetry(res.status) && attempt < API_CONFIG.RETRY_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 250 * attempt));
          continue;
        }
        if (res.status === 405) {
          throw new ApiError(
            "HTTP 405 from /api/ai/classify — ensure server exports POST (and OPTIONS) and client uses multipart/form-data.",
            405,
            payload
          );
        }
        throw new ApiError(
          `HTTP ${res.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`,
          res.status,
          payload
        );
      }

      if (!payload) throw new ApiError("Empty response from classify API", res.status);

      if (DEBUG_AI) console.log("[AI] OK", payload);
      return payload as ClassifyResponse;
    } catch (e: any) {
      if (e?.name === "AbortError") {
        if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 200 * attempt));
          continue;
        }
        throw new ApiError("Request timed out", 408);
      }
      if (e instanceof ApiError) throw e;
      // network-level retry
      if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 200 * attempt));
        continue;
      }
      throw new ApiError(e?.message || "Network error", 0);
    }
  }

  // should not reach here
  throw new ApiError("classify failed after retries", 0);
}

/** Generate product description */
export async function describeProduct(category: string, labels: string[]): Promise<DescribeResponse> {
  const url = buildUrl(API_CONFIG.ENDPOINTS.AI.DESCRIBE);

  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      if (DEBUG_AI) console.log("[AI] POST", url, { category, labels, attempt });

      const res = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ category, labels }),
        },
        API_CONFIG.TIMEOUT
      );

      const payload = await safeJson(res);

      if (!res.ok) {
        if (shouldRetry(res.status) && attempt < API_CONFIG.RETRY_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 250 * attempt));
          continue;
        }
        throw new ApiError(
          `Describe API error: HTTP ${res.status} ${
            typeof payload === "string" ? payload : JSON.stringify(payload)
          }`,
          res.status,
          payload
        );
      }

      if (!payload) throw new ApiError("Empty response from describe API", res.status);
      if (DEBUG_AI) console.log("[AI] Describe OK", payload);
      return payload as DescribeResponse;
    } catch (e: any) {
      if (e?.name === "AbortError") {
        if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 200 * attempt));
          continue;
        }
        throw new ApiError("Request timed out", 408);
      }
      if (e instanceof ApiError) throw e;
      if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 200 * attempt));
        continue;
      }
      throw new ApiError(e?.message || "Network error", 0);
    }
  }

  throw new ApiError("describe failed after retries", 0);
}

/** Optional: tiny helper to render a friendly blurb on the client */
export function formatBlurb(category?: string, confidence?: number) {
  if (!category) return "";
  if (typeof confidence !== "number") return `Looks like ${category}`;
  return `Looks like ${category} (${(confidence * 100).toFixed(1)}%)`;
}
