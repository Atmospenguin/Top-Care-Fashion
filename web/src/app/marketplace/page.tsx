import { headers } from "next/headers";

async function fetchListings() {
  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const host = headersList.get("host");
  const base = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : "http://localhost:3000");
  const res = await fetch(`${base}/api/listings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load listings");
  return res.json();
}

export default async function MarketplacePage() {
  const data = await fetchListings();
  const items: Array<{ id: string; title: string; price: number; category: string }> = data?.items || [];

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
      <p className="text-sm text-black/70 mt-1">Mocked listings from API.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-8">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-black/10 p-5 shadow-sm bg-white hover:shadow transition-shadow">
            <div className="aspect-[4/3] rounded-md bg-black/5 mb-3" />
            <h3 className="font-medium">{item.title}</h3>
            <p className="text-sm text-black/70">{item.category}</p>
            <p className="mt-2 font-semibold">${item.price.toFixed(2)}</p>
            <div className="mt-4">
              <button className="inline-flex items-center rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5">
                View
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}



