require("dotenv").config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

  // HEAD/GET to REST root; expect 200/204 if reachable & key accepted
  const resp = await fetch(`${url}/rest/v1/`, {
    method: "HEAD",
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  }).catch(() => null);

  if (!resp) throw new Error("Network error");
  console.log("Supabase REST status:", resp.status, resp.statusText);
  if (resp.status >= 200 && resp.status < 400) {
    console.log("Supabase connection looks OK ✅");
  } else {
    console.log("Supabase might be blocked/unauthorized. Check URL/key and RLS policies.");
  }
}
main().catch(e => { console.error("Supabase check FAILED:", e.message); process.exit(1); });
