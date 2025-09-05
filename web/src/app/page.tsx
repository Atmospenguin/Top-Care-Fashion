import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-col gap-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-semibold">Discover, Mix & Match Fashion</h1>
        <p className="text-sm text-black/70 dark:text-white/70 mt-2 max-w-xl">
          Welcome to Top Care Fashion. Create an account to start exploring our marketplace and
          get AI-powered outfit recommendations in the next phase.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/register"
            className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm hover:bg-black/85"
          >
            Get Started
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/20 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <h3 className="font-medium">Curated Listings</h3>
          <p className="text-sm text-black/70 dark:text-white/70 mt-1">Explore trending items.</p>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <h3 className="font-medium">Secure Accounts</h3>
          <p className="text-sm text-black/70 dark:text-white/70 mt-1">Powered by Firebase Auth.</p>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <h3 className="font-medium">Coming Soon: AI</h3>
          <p className="text-sm text-black/70 dark:text-white/70 mt-1">Outfit recommender service.</p>
        </div>
      </div>
    </section>
  );
}
