import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
  try {
    const conn = await getConnection();
    const [rows]: any = await conn.execute("SELECT tags FROM feedback WHERE tags IS NOT NULL AND JSON_LENGTH(tags) > 0");
    await conn.end();

    const set = new Set<string>();
    for (const r of rows) {
      try {
        const arr = typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags;
        if (Array.isArray(arr)) arr.forEach((t) => typeof t === 'string' && set.add(t));
      } catch {}
    }
    // Ensure common tags exist
    ['mixmatch','ailisting','premium','buyer','seller'].forEach((t) => set.add(t));

    return NextResponse.json({ tags: Array.from(set).sort() });
  } catch (error) {
    console.error('Error fetching feedback tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

