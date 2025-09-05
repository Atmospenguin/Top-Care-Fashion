import { headers } from "next/headers";

async function fetchListings() {
  const headersList = headers();
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
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      <p className="text-sm text-black/70 dark:text:white/70 mt-1">Mocked listings from API.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {items.map((item) => (
          <article key={item.id} className="border border-black/10 dark:border-white/10 rounded-lg p-4">
            <div className="aspect-video rounded-md bg-black/5 dark:bg-white/10 mb-3" />
            <h3 className="font-medium">{item.title}</h3>
            <p className="text-sm text-black/70 dark:text-white/70">{item.category}</p>
            <p className="mt-2 font-semibold">${item.price.toFixed(2)}</p>
            <button className="mt-3 inline-flex items-center rounded-md border border-black/10 dark:border-white/20 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">
              View
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}



