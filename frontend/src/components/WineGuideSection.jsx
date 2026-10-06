import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const API_URL = "/api/wine-guide/featured";

function WineGuide() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings();

  const brandName =
    settings?.brand_name || "VINEORA";


  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch wine guide articles");
        }

        const data = await response.json();

        setArticles(data.articles || []);
      } catch (error) {
        console.error("Wine Guide error:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getImage = (article) => {
    return article.imageUrl || "/images/wine.png";
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <section className="relative overflow-hidden bg-[#241311] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">

      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#8b1e2d]/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#c9a45c]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Section Header */}
        <div className="mb-12 flex flex-col gap-6 border-b border-[#c9a45c]/25 pb-8 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a45c]">
              The {brandName} Journal
            </p>

            <h2 className="font-serif text-4xl leading-tight text-[#f3e8d7] sm:text-5xl lg:text-6xl">
              Wine Guide
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#d8c8b6] sm:text-base">
              Explore the world of wine through stories, tasting knowledge,
              pairing inspiration and the traditions behind every bottle.
            </p>
          </div>

          <Link
            to="/wine-guide"
            className="group inline-flex w-fit items-center gap-3 border-b border-[#c9a45c] pb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#f3e8d7] transition hover:text-[#c9a45c]"
          >
            Explore Wine Guide

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[500px] animate-pulse border border-[#c9a45c]/10 bg-[#321b18]"
              />
            ))}

          </div>
        )}

        {/* Articles */}
        {!loading && articles.length > 0 && (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">

            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/wine-guide/${article.slug}`}
                className="group relative overflow-hidden border border-[#c9a45c]/15 bg-[#321b18]/50 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a45c]/45"
              >

                {/* Image */}
                <div className="relative h-[330px] overflow-hidden bg-[#3a201c]">

                  <img
                    src={getImage(article)}
                    alt={
                      article.imageAlt ||
                      article.title ||
                      "Wine Guide article"
                    }
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = "/images/wine.png";
                    }}
                  />

                  {/* Image overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#241311]/80 via-transparent to-transparent" />

                  {/* Category */}
                  <div className="absolute left-5 top-5 border border-[#f3e8d7]/30 bg-[#241311]/65 px-3 py-2 backdrop-blur-md">

                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#f3e8d7]">
                      {article.category}
                    </span>

                  </div>

                </div>

                {/* Content */}
                <div className="p-6">

                  <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.16em] text-[#a88342]">

                    <span>
                      {article.author || "{brandName} Wine Guide"}
                    </span>

                    {article.publishedAt && (
                      <span>
                        {formatDate(article.publishedAt)}
                      </span>
                    )}

                  </div>

                  <h3 className="mt-4 font-serif text-2xl leading-tight text-[#f3e8d7] transition-colors duration-300 group-hover:text-[#c9a45c]">
                    {article.title}
                  </h3>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#cbbcad]">
                    {article.excerpt}
                  </p>

                  <div className="mt-6 flex items-center gap-3 border-t border-[#c9a45c]/15 pt-5">

                    <span className="text-xs uppercase tracking-[0.2em] text-[#f3e8d7]">
                      Read Article
                    </span>

                    <span className="text-[#c9a45c] transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>

                  </div>

                </div>

                {/* Bottom gold accent */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a45c] transition-all duration-500 group-hover:w-full" />

              </Link>
            ))}

          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="border border-[#c9a45c]/20 bg-[#321b18]/50 px-6 py-12 text-center backdrop-blur-sm">

            <p className="font-serif text-2xl text-[#f3e8d7]">
              The VINEORA Journal is coming soon.
            </p>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#cbbcad]">
              Discover stories, wine knowledge and inspiration from the world
              of {brandName}.
            </p>

          </div>
        )}

      </div>
    </section>
  );
}

export default WineGuide;