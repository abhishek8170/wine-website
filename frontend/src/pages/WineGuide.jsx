import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const API_URL = "/api/wine-guide";

function WineGuide() {
   const { settings } = useSiteSettings();

  const brandName =
    settings?.brand_name || "VINEORA";
    
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch wine guide articles");
        }

        const data = await response.json();

        setArticles(data.articles || []);
      } catch (err) {
        console.error("Wine Guide page error:", err);
        setError("Unable to load the VINEORA Journal.");
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
    <main className="min-h-screen overflow-hidden bg-[#f4ecdf] text-[#351716]">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative min-h-[720px] overflow-hidden bg-[#eee3d3]">

        {/* Background glow */}

        <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#8b1e2d]/10 blur-[120px]" />

        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#c9a45c]/15 blur-[120px]" />


        {/* Burgundy editorial shape */}

        <div
          className="pointer-events-none absolute right-[-12%] top-[-5%] hidden h-[760px] w-[48%] bg-[#7d1f2c] lg:block"
          style={{
            clipPath:
              "polygon(20% 0%, 100% 0%, 100% 100%, 62% 92%, 50% 76%, 32% 82%, 18% 65%, 27% 49%, 12% 35%, 24% 20%)",
          }}
        />


        {/* Hero content */}

        <div className="relative z-10 mx-auto max-w-[1500px] px-6 pb-20 pt-16 sm:px-10 lg:px-16 lg:pb-28">

          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="relative z-20 max-w-2xl">

              {/* Eyebrow */}

              <div className="mb-6 flex items-center gap-4">

                <span className="h-px w-10 bg-[#b18a48]" />

                <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#9b7537]">
                  The {brandName} Journal
                </p>

              </div>


              {/* Heading */}

              <h1 className="font-serif text-6xl leading-[0.88] tracking-[-0.04em] text-[#54151b] sm:text-7xl lg:text-[7rem]">

                Wine

                <br />

                <span className="italic">
                  Guide
                </span>

              </h1>


              {/* Description */}

              <p className="mt-8 max-w-xl text-base leading-8 text-[#66534a] sm:text-lg">
                Explore the world of wine through stories, tasting knowledge,
                pairing inspiration and the traditions behind every bottle.
              </p>


              {/* Topics */}

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-[#9b7537]/20 py-5">

                <GuideTopic
                  icon="🕮"
                  label="Tasting Tips"
                />

                <GuideTopic
                  icon="🍇︎"
                  label="Pairing Ideas"
                />

                <GuideTopic
                  icon="🍷︎"
                  label="Wine Basics"
                />

                <GuideTopic
                  icon="🍃︎⌁"
                  label="Storage Guide"
                />

              </div>


              {/* CTA */}

              <div className="mt-10">

                <a
                  href="#latest-articles"
                  className="group inline-flex items-center gap-4 border-b border-[#9b7537] pb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-[#54151b]"
                >
                  Discover the Journal

                  <span className="transition-transform duration-300 group-hover:translate-x-2">
                    →
                  </span>
                </a>

              </div>

            </div>


            {/* =================================================
                RIGHT SIDE
                EDITORIAL BOTTLE COMPOSITION
            ================================================= */}

            <div className="relative mx-auto h-[500px] w-full max-w-[700px] sm:h-[580px] lg:h-[620px]">

              {/* Vineyard / article image */}

              <div
                className="absolute right-[3%] top-[4%] h-[68%] w-[82%] overflow-hidden"
                style={{
                  clipPath:
                    "polygon(14% 5%, 32% 0%, 48% 7%, 68% 2%, 86% 12%, 96% 29%, 88% 43%, 96% 58%, 82% 72%, 72% 88%, 52% 82%, 39% 94%, 23% 81%, 7% 87%, 12% 67%, 2% 53%, 11% 38%, 4% 22%)",
                }}
              >

                <img
                  src={
                    articles[0]?.imageUrl ||
                    "/images/wine-guide-tasting.jpg"
                  }
                  alt="Wine Guide vineyard"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/images/wine.png";
                  }}
                />

                <div className="absolute inset-0 bg-[#7d1f2c]/10 mix-blend-multiply" />

              </div>


              {/* Soft paper shape */}

              <div
                className="absolute bottom-[3%] left-[5%] h-[310px] w-[260px] bg-[#efe2ce]/80 sm:h-[360px] sm:w-[310px]"
                style={{
                  clipPath:
                    "polygon(14% 0%, 80% 4%, 100% 22%, 91% 44%, 98% 67%, 77% 100%, 43% 91%, 17% 100%, 0% 77%, 8% 52%, 0% 24%)",
                }}
              />


              {/* Wine glass */}

              <div className="absolute bottom-[7%] left-[17%] hidden h-[300px] w-[150px] sm:block">

                {/* Glass bowl */}

                <div className="absolute left-[28px] top-0 h-[170px] w-[92px] rounded-b-[50%] rounded-t-[42%] border-[3px] border-white/60 bg-white/10" />

                {/* Wine */}

                <div className="absolute left-[35px] top-[105px] h-[58px] w-[78px] rounded-b-[45%] bg-[#6d1420]/75" />

                {/* Stem */}

                <div className="absolute left-[72px] top-[166px] h-[105px] w-px bg-white/60" />

                {/* Base */}

                <div className="absolute left-[42px] top-[270px] h-px w-[62px] bg-white/60" />

              </div>


              {/* =================================================
                  BOTTLE CUTOUT
              ================================================= */}

              <div className="absolute bottom-[-2%] right-[15%] z-30 h-[700px] w-[230px]">

                <img
                  src="/images/wine-guide-bottle.png"
                  alt="VINEORA premium wine bottle"
                  className="h-full w-full object-contain drop-shadow-[0_35px_35px_rgba(39,11,10,0.45)]"
                  onError={(event) => {
                    event.currentTarget.src = "/images/wine.png";
                  }}
                />

              </div>


              {/* Editorial quote */}

              <div className="absolute bottom-[7%] right-0 z-40 max-w-[180px] rotate-[-5deg] text-right sm:max-w-[220px]">

                <p className="font-serif text-xl italic leading-tight text-[#ff6850] sm:text-2xl">

                  More than wine.

                  <br />

                  <span className="text-[#feab04]">
                    It's a story.
                  </span>

                </p>

                <div className="ml-auto mt-4 h-px w-16 bg-[#c9a45c]" />

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          LATEST ARTICLES
      ===================================================== */}

      <section
        id="latest-articles"
        className="relative overflow-hidden bg-[#f4ecdf] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"
      >

        {/* Decorative burgundy corner */}

        <div
          className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[350px] w-[350px] bg-[#7d1f2c]"
          style={{
            clipPath:
              "polygon(30% 0%, 100% 20%, 100% 100%, 0% 100%, 12% 68%, 4% 43%)",
          }}
        />


        <div className="relative mx-auto max-w-[1400px]">

          <div className="grid gap-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">

            {/* =================================================
                SECTION INTRO
            ================================================= */}

            <div className="max-w-md">

              <div className="mb-5 flex items-center gap-4">

                <span className="h-px w-10 bg-[#b18a48]" />

                <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#9b7537]">
                  Latest Articles
                </p>

              </div>


              <h2 className="font-serif text-4xl leading-tight tracking-[-0.03em] text-[#54151b] sm:text-5xl">

                Featured in Our

                <br />

                <span className="italic">
                  Wine Guide
                </span>

              </h2>


              <p className="mt-7 text-sm leading-7 text-[#6b5950] sm:text-base">
                From the basics of wine tasting to perfect pairings and proper
                storage, discover expert insights and inspiration from the
                world of wine.
              </p>


              <a
                href="#all-articles"
                className="group mt-10 inline-flex items-center gap-4 border-b border-[#9b7537] pb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[#54151b]"
              >
                Explore All Articles

                <span className="transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>

              </a>

            </div>


            {/* =================================================
                ARTICLES
            ================================================= */}

            <div id="all-articles">

              {/* Loading */}

              {loading && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[520px] animate-pulse border border-[#9b7537]/20 bg-[#e9dece]"
                    />
                  ))}

                </div>
              )}


              {/* Error */}

              {!loading && error && (
                <div className="border border-[#8b1e2d]/20 bg-white/30 p-10 text-center">

                  <p className="font-serif text-2xl text-[#54151b]">
                    The Journal is temporarily unavailable.
                  </p>

                  <p className="mt-3 text-sm text-[#6b5950]">
                    Please refresh the page and try again.
                  </p>

                </div>
              )}


              {/* Articles */}

              {!loading && !error && articles.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                  {articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      getImage={getImage}
                      formatDate={formatDate}
                    />
                  ))}

                </div>
              )}


              {/* Empty */}

              {!loading && !error && articles.length === 0 && (
                <div className="border border-[#9b7537]/20 bg-white/30 p-12 text-center">

                  <p className="font-serif text-2xl text-[#54151b]">
                    The {brandName} Journal is coming soon.
                  </p>

                  <p className="mt-4 text-sm leading-7 text-[#6b5950]">
                    New wine stories and knowledge will appear here.
                  </p>

                </div>
              )}

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}


/* ============================================================
   GUIDE TOPIC
============================================================ */

function GuideTopic({ icon, label }) {
  return (
    <div className="flex items-center gap-2">

      <span className="text-lg text-[#b18a48]">
        {icon}
      </span>

      <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#6b5950]">
        {label}
      </span>

    </div>
  );
}


/* ============================================================
   ARTICLE CARD
============================================================ */

function ArticleCard({
  article,
  getImage,
  formatDate,
}) {
  return (
    <Link
      to={`/wine-guide/${article.slug}`}
      className="group relative block overflow-hidden border border-[#9b7537]/25 bg-[#f8f1e6] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(64,27,20,0.12)]"
    >

      {/* Image */}

      <div className="relative h-[285px] overflow-hidden">

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


        {/* Gradient */}

        <div className="absolute inset-0 bg-gradient-to-t from-[#351716]/60 via-transparent to-transparent" />


        {/* Category */}

        <div className="absolute left-5 top-5 border border-[#f3e8d7]/40 bg-[#351716]/75 px-3 py-2 backdrop-blur-sm">

          <span className="text-[9px] uppercase tracking-[0.2em] text-[#f7ecdd]">
            {article.category}
          </span>

        </div>

      </div>


      {/* Content */}

      <div className="p-6">

        {/* Author + Date */}

        <div className="flex items-center justify-between gap-3">

          <span className="text-[9px] uppercase tracking-[0.16em] text-[#9b7537]">
            {article.brandName || "{brandName} Wine Guide"}
          </span>

          {article.publishedAt && (
            <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.12em] text-[#8a7569]">
              {formatDate(article.publishedAt)}
            </span>
          )}

        </div>


        {/* Title */}

        <h3 className="mt-4 font-serif text-2xl leading-[1.05] text-[#54151b] transition-colors duration-300 group-hover:text-[#9b7537]">
          {article.title}
        </h3>


        {/* Excerpt */}

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#6b5950]">
          {article.excerpt}
        </p>


        {/* Read article */}

        <div className="mt-7 flex items-center gap-3 border-t border-[#9b7537]/20 pt-5">

          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#54151b]">
            Read Article
          </span>

          <span className="text-[#b18a48] transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>

        </div>

      </div>


      {/* Bottom gold line */}

      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#b18a48] transition-all duration-500 group-hover:w-full" />

    </Link>
  );
}


export default WineGuide;