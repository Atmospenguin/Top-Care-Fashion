"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

function PhoneCarousel({ images, className = "", altPrefix = "Feature" }: { images: string[]; className?: string; altPrefix?: string }) {
  const [i, setI] = useState(0);
  const slides = useMemo(() => images.map((s) => s.replace(/ /g, "%20")), [images]);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides.length]);
  return (
    <div className={`relative aspect-[1608/3496] w-full max-w-[320px] md:max-w-[380px] mx-auto ${className}`}>
      <div className="absolute inset-0 rounded-[24px] border border-black/10 shadow-xl overflow-hidden bg-white">
        {slides.map((src, idx) => (
          <Image key={src} src={src} alt={`${altPrefix} ${idx + 1}`} fill priority={idx === i} className={`object-contain bg-white transition-opacity duration-500 ${idx === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
        {slides.map((_, idx) => (
          <span key={idx} className={`h-1.5 rounded-full ${idx === i ? "w-5 bg-[var(--brand-color)]" : "w-2.5 bg-black/20"}`} />
        ))}
      </div>
    </div>
  );
}

type AIFeaturesConfig = {
  mixmatch?: { title?: string; desc?: string; girlImages?: string[] | null; boyImages?: string[] | null };
  ailisting?: { title?: string; desc?: string; images?: string[] | null };
  search?: { title?: string; desc?: string; images?: string[] | null };
};

export default function AIFeatures({ config }: { config?: AIFeaturesConfig }) {
  const [mixSet, setMixSet] = useState<'girl' | 'boy'>(() => 'girl');
  const defaultMixGirl = [
    "/TOPApp/mixnmatch1/Mix & Match.png",
    "/TOPApp/mixnmatch1/Mix & Match-1.png",
    "/TOPApp/mixnmatch1/Mix & Match-2.png",
    "/TOPApp/mixnmatch1/Mix & Match-3.png",
  ];
  const defaultMixBoy = [
    "/TOPApp/mixnmatch2/Mix & Match.png",
    "/TOPApp/mixnmatch2/Mix & Match-1.png",
    "/TOPApp/mixnmatch2/Mix & Match-2.png",
    "/TOPApp/mixnmatch2/Mix & Match-3.png",
  ];
  const defaultListing = ["/TOPApp/AI-Listing.png"];
  const defaultSearch = ["/TOPApp/Search Result.png"];

  const mixGirl = (config?.mixmatch?.girlImages && config.mixmatch.girlImages.length > 0) ? config.mixmatch.girlImages : defaultMixGirl;
  const mixBoy = (config?.mixmatch?.boyImages && config.mixmatch.boyImages.length > 0) ? config.mixmatch.boyImages : defaultMixBoy;
  const listing = (config?.ailisting?.images && config.ailisting.images.length > 0) ? config.ailisting.images : defaultListing;
  const search = (config?.search?.images && config.search.images.length > 0) ? config.search.images : defaultSearch;

  const cards: Array<{ title: string; desc: string; images: string[] }> = [
    {
      title: config?.mixmatch?.title || "Mix & Match",
      desc: config?.mixmatch?.desc || "AI outfit recommendations from your listed items.",
      images: mixSet === 'girl' ? mixGirl : mixBoy,
    },
    {
      title: config?.ailisting?.title || "AI Listing",
      desc: config?.ailisting?.desc || "Auto-generate titles, tags and descriptions from photos.",
      images: listing,
    },
    {
      title: config?.search?.title || "Search",
      desc: config?.search?.desc || "Natural language and image-based search to find pieces fast.",
      images: search,
    },
  ];

  return (
    <section>
      <h2 className="text-3xl font-semibold tracking-tight">AI Features</h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-black/10 p-6 bg-white flex flex-col relative">
            <div className="min-h-[72px]">
              <h3 className="font-medium">{c.title}</h3>
              <p className="text-sm text-black/70 mt-1">{c.desc}</p>
              {/* toggles moved to overlay above phone status bar */}
            </div>
            <div className="relative mt-4 mt-auto">
              {c.title === 'Mix & Match' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 inline-flex rounded-md overflow-hidden border border-black/10 shadow-sm">
                  <button
                    className={`px-2.5 py-1 text-xs ${mixSet === 'girl' ? 'bg-[var(--brand-color)] text-white' : 'bg-white text-black hover:bg-black/5'}`}
                    onClick={() => setMixSet('girl')}
                    type="button"
                  >
                    Girl
                  </button>
                  <button
                    className={`px-2.5 py-1 text-xs ${mixSet === 'boy' ? 'bg-[var(--brand-color)] text-white' : 'bg-white text-black hover:bg-black/5'}`}
                    onClick={() => setMixSet('boy')}
                    type="button"
                  >
                    Boy
                  </button>
                </div>
              )}
              <PhoneCarousel images={c.images} className="pt-2" altPrefix={c.title} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
