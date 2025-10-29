// web/src/app/api/ai/classify/route.ts
import { NextResponse, NextRequest } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export const runtime = "nodejs";         // Vision requires Node on Vercel
export const dynamic = "force-dynamic";

// ---------- Google Vision client ----------
const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
const fixedKey = privateKey.includes("\\n") ? privateKey.replace(/\\n/g, "\n") : privateKey;

const vision = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "topcarefashion-ai",
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: fixedKey,
  },
});

// ---------- Categories (normalized to 7 canonical names) ----------
const CATEGORY_KEYS: Record<string, string[]> = {
  Top: [
    "shirt","t-shirt","tee","blouse","sweater","hoodie","cardigan",
    "pullover","top","tank","camisole","polo","jersey","jumper",
    "knitwear","crewneck","long sleeve","sweatshirt","uniform shirt",
    "denim shirt","sleeve","neck","collar","wool","woolen","fur"
  ],
  Bottom: [
    "pants","trousers","jeans","shorts",
    "skirt","skirts","midi skirt","maxi skirt","mini skirt",
    "pleated skirt","a-line skirt","a line skirt","wrap skirt",
    "tiered skirt","balloon skirt","long skirt","denim skirt",
    "tulle skirt","circle skirt","a-line","a line","waist"
  ],
  Footwear: [
    "shoe","sneaker","boot","heels","sandals","flip-flops","loafers","footwear",
    "oxford","running shoe","slippers","trainer","cleats","platform shoe"
  ],
  Accessories: [
    "watch","hat","cap","beanie","belt","scarf","sunglasses","glasses","tie",
    "wallet","earrings","necklace","ring","bracelet","jewelry","umbrella","hairband"
  ],
  Bags: [
    "bag","handbag","purse","tote","backpack","clutch","crossbody","satchel",
    "shoulder bag","duffel","sling bag","briefcase","shopping bag","fanny pack"
  ],
  Dresses: [
    "dress","gown","sundress","maxi dress","mini dress","cocktail dress","shirt dress",
    "evening gown","wedding dress","romper"
  ],
  Outerwear: [
    "coat","jacket","blazer","trench","windbreaker","parka","overcoat",
    "bomber jacket","raincoat","puffer","vest"
  ],
};

const GENERIC = new Set([
  "clothing","clothes","fashion","apparel","garment","textile","retail",
  "style","haute couture","model","photo shoot","pattern","design","fabric"
]);

const DEBUG = process.env.DEBUG_CLS === "1";

const sanitize = (s = "") =>
  s.toLowerCase()
    .replace(/#[a-z0-9_-]+/g, "")
    .replace(/\b[a-z0-9]{2,}-\d{2,}\b/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))];

function kwHits(text: string, keyword: string) {
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hyphenFlex = esc.replace(/\s|-/g, "[\\s-]");
  // Use unicode-safe boundaries around the pattern
  const re = new RegExp(`(?:^|\\b)${hyphenFlex}(?:\\b|$)`, "iu");
  return re.test(text);
}

function scoreCategoriesWeighted(
  labelAnnotations: { description?: string | null; score?: number | null }[]
) {
  const scores: Record<string, number> =
    Object.fromEntries(Object.keys(CATEGORY_KEYS).map((k) => [k, 0]));

  for (const { description, score } of labelAnnotations) {
    const dRaw = description || "";
    const d = dRaw.toLowerCase();
    if (!d || GENERIC.has(d)) continue;

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYS)) {
      if (!keywords.some((k) => kwHits(d, k))) continue;

      let w = score ?? 0;
      if (["clothing", "apparel", "fashion", "style"].includes(d)) continue;

      // Focused boosts per category
      if (cat === "Dresses"  && (kwHits(d, "dress") || kwHits(d, "gown"))) w *= 2.0;
      if (cat === "Footwear" && (kwHits(d, "shoe") || kwHits(d, "sneaker") || kwHits(d, "boot") || kwHits(d, "heel"))) w *= 1.6;
      if (cat === "Bags"     && (kwHits(d, "bag")  || kwHits(d, "backpack") || kwHits(d, "purse"))) w *= 1.4;

      if (cat === "Top"      && (kwHits(d, "sweater") || kwHits(d, "hoodie") || kwHits(d, "shirt") || kwHits(d, "blouse") || kwHits(d, "t-shirt") || kwHits(d, "top"))) w *= 2.0;
      if (cat === "Outerwear"&& (kwHits(d, "coat") || kwHits(d, "jacket") || kwHits(d, "blazer"))) w *= 1.4;

      if (cat === "Bottom" && (
        kwHits(d, "skirt") || kwHits(d, "skirts") ||
        kwHits(d, "midi skirt") || kwHits(d, "maxi skirt") || kwHits(d, "mini skirt") ||
        kwHits(d, "pleated skirt") || kwHits(d, "wrap skirt") || kwHits(d, "tiered skirt") ||
        kwHits(d, "balloon skirt") || kwHits(d, "a-line") || kwHits(d, "a line")
      )) w *= 2.0;

      if (cat === "Top" && /sleeve|neck|collar/.test(d)) w *= 1.3;
      if (cat === "Bottom" && d === "waist") w *= 1.15;
      if ((score ?? 0) > 0.85) w *= 1.2;

      scores[cat] += w;
    }
  }

  if (DEBUG) {
    console.log("[classify] labels:", labelAnnotations.map(l => `${l.description}:${(l.score || 0).toFixed(2)}`));
    console.log("[classify] scores:", scores);
  }

  const arr = Object.entries(scores);
  arr.sort((a, b) => b[1] - a[1]);
  const [bestCat, bestScore] = arr[0] ?? ["Unknown", 0];
  const secondScore = arr[1]?.[1] ?? 0;

  if (bestScore <= 0) {
    return { category: "Unknown", confidence: 0, scores };
  }

  let confidence = bestScore / (bestScore + secondScore || bestScore);
  confidence = Math.max(0.4, Math.min(0.99, confidence));
  if ((bestScore - secondScore) > 0.6) confidence = Math.max(confidence, 0.85);

  return { category: bestCat, confidence: Number(confidence.toFixed(2)), scores };
}

async function classifyImage(imageBuffer: Buffer) {
  const [result] = await vision.labelDetection({ image: { content: imageBuffer } });
  const anns = result?.labelAnnotations ?? [];

  const topK = (anns || [])
    .map(a => ({ label: sanitize(a.description || ""), score: a.score ?? 0 }))
    .filter(x => x.label)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const labels = uniq(topK.map(x => x.label));
  const { category, confidence } = scoreCategoriesWeighted(anns);

  return {
    category,
    confidence,
    topK,
    labels,
    raw: { count: anns.length },
  };
}

// ---------- Route handlers ----------
export async function GET() {
  return NextResponse.json({
    ok: true,
    accepts: ["POST multipart/form-data"],
    route: "/api/ai/classify",
  });
}

export async function OPTIONS() {
  // Simple CORS preflight (useful for web clients)
  const res = NextResponse.json({ ok: true });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
  return res;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    if (DEBUG) console.log("[classify] method=POST content-type=", req.headers.get("content-type"));

    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing file field 'image'" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    const { category, confidence, topK, labels, raw } = await classifyImage(bytes);

    const res = NextResponse.json({
      category,
      confidence,
      labels,
      topK,
      meta: {
        source: "vision",
        labelCount: raw.count,
        latency_ms: Date.now() - t0,
      },
    });

    // Open CORS for web/demo clients
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  } catch (err: any) {
    if (DEBUG) console.error("[classify] error:", err);
    const res = NextResponse.json(
      {
        error: err?.message ?? "Unknown error",
        meta: { source: "vision", latency_ms: Date.now() - t0 },
      },
      { status: 500 }
    );
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  }
}
