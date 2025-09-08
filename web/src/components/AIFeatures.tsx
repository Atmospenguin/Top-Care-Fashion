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

export default function AIFeatures() {
  const mix = [
    "/TOPApp/mixnmatch1/Mix & Match.png",
    "/TOPApp/mixnmatch1/Mix & Match-1.png",
    "/TOPApp/mixnmatch1/Mix & Match-2.png",
    "/TOPApp/mixnmatch1/Mix & Match-3.png",
  ];
  const listing = ["/TOPApp/AI-Listing.png"];
  const search = ["/TOPApp/Search Result.png"];

  const cards: Array<{ title: string; desc: string; images: string[] }> = [
    { title: "Mix & Match", desc: "AI outfit recommendations from your listed items.", images: mix },
    { title: "AI Listing", desc: "Auto-generate titles, tags and descriptions from photos.", images: listing },
    { title: "Search", desc: "Natural language and image-based search to find pieces fast.", images: search },
  ];

  return (
    <section>
      <h2 className="text-3xl font-semibold tracking-tight">AI Features</h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-black/10 p-6 bg-white">
            <div className="min-h-[72px]">
              <h3 className="font-medium">{c.title}</h3>
              <p className="text-sm text-black/70 mt-1">{c.desc}</p>
            </div>
            <PhoneCarousel images={c.images} className="mt-4" altPrefix={c.title} />
          </div>
        ))}
      </div>
    </section>
  );
}
