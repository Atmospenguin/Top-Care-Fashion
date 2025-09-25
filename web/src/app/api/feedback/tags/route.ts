import { NextResponse } from "next/server";
import { getConnection, parseJson } from "@/lib/db";

export async function GET() {
  try {
    const conn = await getConnection();
    const [rows]: any = await conn.execute(
      "SELECT tags FROM feedback WHERE tags IS NOT NULL AND jsonb_typeof(tags) = 'array' AND jsonb_array_length(tags) > 0"
    );
    await conn.end();

    const set = new Set<string>();
    for (const r of rows) {
      const arr = Array.isArray(r.tags) ? r.tags : parseJson<string[]>(r.tags);
      if (Array.isArray(arr)) {
        arr.forEach((t) => {
          if (typeof t === "string") set.add(t);
        });
      }
    }

    ["mixmatch", "ailisting", "premium", "buyer", "seller"].forEach((t) => set.add(t));

    return NextResponse.json({ tags: Array.from(set).sort() });
  } catch (error) {
    console.error("Error fetching feedback tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
