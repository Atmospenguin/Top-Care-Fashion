import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    if (!url.includes("farfetch.com")) {
      return NextResponse.json({ error: "Invalid Farfetch URL" }, { status: 400 });
    }

    const baseHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.8,zh;q=0.6",
      Connection: "keep-alive",
    } as const;

    const warmup = await fetch("https://www.farfetch.com", {
      method: "GET",
      headers: baseHeaders,
      redirect: "manual",
    });

    const ffCookies = warmup.headers.get("set-cookie") || "";

    const productRes = await fetch(url, {
      method: "GET",
      headers: {
        ...baseHeaders,
        Cookie: ffCookies,
        Referer: "https://www.farfetch.com/",
      },
      redirect: "follow",
    });

    if (productRes.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          error: "Blocked by Farfetch",
          message: "Farfetch 阻止了请求，请稍后再试。",
        },
        { status: 403 }
      );
    }

    const html = await productRes.text();

    if (!html || html.length < 1000) {
      return NextResponse.json(
        { error: "Invalid HTML or blocked" },
        { status: 500 }
      );
    }

    const ldJsonRegex =
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let json: any = null;
    let match: RegExpExecArray | null;

    while ((match = ldJsonRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data["@type"] === "Product") {
          json = data;
          break;
        }
      } catch {
        /* ignore malformed ld+json blocks */
      }
    }

    if (!json) {
      return NextResponse.json(
        { error: "Unable to parse product data" },
        { status: 500 }
      );
    }

    const brand = json.brand?.name || "Unknown";
    const title = json.name || brand;
    const description = json.description || `${title} from Farfetch`;

    let price = 0;
    if (json.offers) {
      const offer = Array.isArray(json.offers) ? json.offers[0] : json.offers;
      price = parseFloat(offer.price) || 0;
    }

    const images = Array.isArray(json.image) ? json.image : [];

    let category = "Tops";
    const normalizedTitle = title.toLowerCase();

    if (/jacket|coat|blazer|parka|puffer/.test(normalizedTitle)) {
      category = "Outerwear";
    } else if (/dress|gown/.test(normalizedTitle)) {
      category = "Tops";
    } else if (/jeans|pants|trousers|shorts/.test(normalizedTitle)) {
      category = "Bottoms";
    } else if (/bag|scarf|cap|wallet/.test(normalizedTitle)) {
      category = "Accessories";
    }

    const payload = {
      title,
      description,
      price,
      brand,
      category,
      shippingOption: "Standard" as const,
      condition: "Like New" as const,
      gender: "Women" as const,
      images,
      quantity: 1,
      listed: true,
      sold: false,
    };

    return NextResponse.json({ ok: true, payload });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server Error" },
      { status: 500 }
    );
  }
}

