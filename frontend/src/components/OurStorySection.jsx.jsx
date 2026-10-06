import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const OurStory = () => {
  const [ourStory, setOurStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { settings } = useSiteSettings();
  const brandName =
    settings?.brand_name || "VINEORA";
  const replaceBrandName = (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return value.replace(/VINEORA/gi, brandName);
  };

  useEffect(() => {
    const fetchOurStory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/our-story");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load Our Story");
        }

        setOurStory(data.ourStory);
      } catch (error) {
        console.error("Our Story API error:", error);
        setError("Unable to load our story.");
      } finally {
        setLoading(false);
      }
    };

    fetchOurStory();
  }, []);

  // LOADING STATE
  if (loading) {
    return (
      <section className="relative overflow-hidden bg-[#241311] py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="h-4 w-40 animate-pulse rounded bg-[#c5a96b]/20" />

          <div className="mt-6 h-16 max-w-2xl animate-pulse rounded bg-[#c5a96b]/10" />

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="aspect-[4/5] animate-pulse rounded-[1.5rem] bg-white/[0.04]" />

            <div className="space-y-6">
              <div className="h-5 w-40 animate-pulse rounded bg-[#c5a96b]/15" />
              <div className="h-20 animate-pulse rounded bg-white/[0.04]" />
              <div className="h-32 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ERROR STATE
  if (error || !ourStory) {
    return (
      <section className="bg-[#241311] px-5 py-20 text-center text-[#f3e9d8]">
        <p className="text-sm uppercase tracking-[0.2em] text-[#c5a96b]">
          {error || "Our Story is currently unavailable."}
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#241311] py-20 sm:py-24 lg:py-32">
      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#6f1d2b]/20 blur-3xl" />

        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#b89b5e]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">

        {/* SECTION INTRO */}
        <div className="mb-14 max-w-3xl sm:mb-16 lg:mb-20">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-[#c5a96b] sm:text-xs">
            {replaceBrandName(ourStory.sectionLabel)}
          </p>

          <h2 className="font-serif text-4xl font-medium leading-[1.08] text-[#f3e9d8] sm:text-5xl lg:text-6xl">
            {replaceBrandName(ourStory.heading)}

            <span className="block text-[#c5a96b]">
              {replaceBrandName(ourStory.highlightedHeading)}
            </span>
          </h2>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">

          {/* IMAGE */}
          <div className="group relative overflow-hidden">

            <div className="absolute -inset-3 rounded-[2rem] border border-[#c5a96b]/10 bg-white/[0.02] backdrop-blur-sm" />

            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] sm:aspect-[5/6]">

              <img
                src={ourStory.imageUrl}
                alt={
                  replaceBrandName(
                    ourStory.imageAlt ||
                    `${brandName} vineyard and winery`
                  )
                }
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.style.display = "none";

                  event.currentTarget.parentElement.classList.add(
                    "bg-gradient-to-br",
                    "from-[#5a1824]",
                    "via-[#321714]",
                    "to-[#18100e]"
                  );
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#160b09]/70 via-transparent to-[#241311]/10" />

              {ourStory.imageCaption && (
                <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
                  <div className="inline-flex rounded-full border border-white/15 bg-[#241311]/45 px-4 py-2 backdrop-blur-md">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#f3e9d8]/90">
                      {ourStory.imageCaption}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STORY CONTENT */}
          <div>

            <p className="mb-7 text-sm font-medium uppercase tracking-[0.22em] text-[#c5a96b]">
             {replaceBrandName(ourStory.philosophyTitle)}
            </p>

            <h3 className="font-serif text-3xl leading-tight text-[#f3e9d8] sm:text-4xl">
              {replaceBrandName(ourStory.philosophyHeading)}

              <span className="block text-[#cdbb9d]">
                It is a story waiting to be tasted.
              </span>
            </h3>

            {/* PARAGRAPHS */}
            <div className="mt-7 space-y-5 text-[15px] leading-7 text-[#d8c9b5] sm:text-base">

              {ourStory.storyParagraph1 && (
                <p>{replaceBrandName(ourStory.storyParagraph1)}</p>
              )}

              {ourStory.storyParagraph2 && (
                <p>{replaceBrandName(ourStory.storyParagraph2)}</p>
              )}

              {ourStory.storyParagraph3 && (
                <p>{replaceBrandName(ourStory.storyParagraph3)}</p>
              )}
            </div>

            <div className="my-9 h-px w-full bg-[#c5a96b]/20" />

            {/* STATS */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">

              {ourStory.stats?.map((stat, index) => (
                <div key={index}>
                  <p className="font-serif text-3xl text-[#c5a96b]">
                    {replaceBrandName(stat.number)}
                  </p>

                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#b9aa97]">
                    {replaceBrandName(stat.label)}
                  </p>
                </div>
              ))}

            </div>

            {/* CTA */}
            {ourStory.ctaText && ourStory.ctaUrl && (
              <div className="mt-10">
                <Link
                  to={ourStory.ctaUrl}
                  className="group inline-flex items-center gap-4 border-b border-[#c5a96b]/60 pb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#f3e9d8] transition hover:border-[#c5a96b] hover:text-[#c5a96b]"
                >
                  {ourStory.ctaText}

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM QUOTE */}
        <div className="mt-20 border-t border-[#c5a96b]/15 pt-10 sm:mt-24 lg:mt-28">

          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">

            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c5a96b]">
              {ourStory.bottomLabel}
            </p>

            <p className="max-w-4xl font-serif text-2xl leading-tight text-[#e9dcc9] sm:text-3xl lg:text-4xl">
              “{ourStory.bottomQuote}”
            </p>

          </div>
        </div>

      </div>
    </section>
  );
};

export default OurStory;