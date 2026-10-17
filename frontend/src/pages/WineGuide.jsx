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


              {/* Premium studio lighting behind the composition */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[12%] top-[12%] h-[420px] w-[420px] rounded-full blur-[90px]"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.48) 0%, rgba(201,164,92,0.16) 38%, transparent 72%)",
                }}
              />

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



              <div className="absolute bottom-[7%] left-[17%] z-20 hidden h-[320px] w-[150px] sm:block">

                <svg
                  viewBox="0 0 150 320"
                  className="h-full w-full overflow-visible"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="A crystal wine glass filled with red wine"
                  role="img"
                >
                  <defs>
                    {/* Crystal glass transparency */}

                    {/* Crystal glass transparency */}
                    <linearGradient
                      id="crystalGlass"
                      x1="30"
                      y1="20"
                      x2="120"
                      y2="145"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.58" />
                      <stop offset="0.08" stopColor="#FFFFFF" stopOpacity="0.20" />
                      <stop offset="0.22" stopColor="#FFFFFF" stopOpacity="0.035" />
                      <stop offset="0.50" stopColor="#FFFFFF" stopOpacity="0.01" />
                      <stop offset="0.76" stopColor="#FFFFFF" stopOpacity="0.045" />
                      <stop offset="0.92" stopColor="#FFFFFF" stopOpacity="0.24" />
                      <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.52" />
                    </linearGradient>


                    {/* Rich wine colour */}
                    <linearGradient
                      id="redWine"
                      x1="35"
                      y1="80"
                      x2="115"
                      y2="145"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#54101C" />
                      <stop offset="0.38" stopColor="#852738" />
                      <stop offset="0.72" stopColor="#681321" />
                      <stop offset="1" stopColor="#3C0914" />
                    </linearGradient>

                    {/* Wine surface */}
                    <linearGradient id="wineSurface" x1="45" y1="0" x2="105" y2="0">
                      <stop offset="0" stopColor="#A84B59" stopOpacity="0.8" />
                      <stop offset="0.5" stopColor="#6D1422" stopOpacity="0.95" />
                      <stop offset="1" stopColor="#4B0B18" stopOpacity="0.9" />
                    </linearGradient>

                    {/* Glass silhouette clipping */}
                    <clipPath id="crystalBowlClip">
                      <path d="M35 27 C35 8 115 8 115 27 C115 68 103 108 88 134 C82 145 76 150 75 150 C74 150 68 145 62 134 C47 108 35 68 35 27 Z" />
                    </clipPath>
                  </defs>

                  {/* Bowl reflections and transparent body */}
                  <g clipPath="url(#crystalBowlClip)">
                    <rect
                      x="25"
                      y="10"
                      width="100"
                      height="145"
                      fill="url(#crystalGlass)"
                    />

                    {/* Wine inside the bowl */}
                    <path
                      d="M37 87 Q75 92 113 87 C109 110 100 128 88 143 C82 149 77 152 75 152 C73 152 68 149 62 143 C50 128 41 110 37 87 Z"
                      fill="url(#redWine)"
                      opacity="0.94"
                    />

                    {/* Gentle highlight across the wine surface */}
                    <path
                      d="M38 87 Q75 91 112 87"
                      stroke="#DCA0A3"
                      strokeWidth="1.5"
                      strokeOpacity="0.7"
                    />

                    {/* Reflected light on crystal */}
                    <path
                      d="M43 35 C44 65 51 99 63 122"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeOpacity="0.48"
                    />

                    <path
                      d="M108 43 C105 77 96 108 86 126"
                      stroke="#FFFFFF"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeOpacity="0.36"
                    />

                    <path
                      d="M51 31 C51 47 54 59 57 68"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeOpacity="0.65"
                    />
                  </g>

                  {/* Fine crystal bowl outline */}
                  <path
                    d="M35 27 C35 8 115 8 115 27 C115 68 103 108 88 134 C82 145 76 150 75 150 C74 150 68 145 62 134 C47 108 35 68 35 27 Z"
                    stroke="#FFFFFF"
                    strokeWidth="2.1"
                    strokeOpacity="0.83"
                    strokeLinejoin="round"
                  />

                  {/* Delicate oval rim */}
                  <ellipse
                    cx="75"
                    cy="27"
                    rx="40"
                    ry="12"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeOpacity="0.82"
                  />

                  <ellipse
                    cx="75"
                    cy="27"
                    rx="36"
                    ry="8"
                    stroke="#FFFFFF"
                    strokeWidth="0.7"
                    strokeOpacity="0.35"
                  />

                  {/* Stem */}
                  <path
                    d="M75 150 C75 190 75 225 75 270"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeOpacity="0.65"
                  />

                  <path
                    d="M79 160 C79 195 79 230 79 264"
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                    strokeOpacity="0.25"
                  />

                  {/* Stem-to-base transition */}
                  <path
                    d="M68 272 Q75 267 82 272"
                    stroke="#FFFFFF"
                    strokeWidth="1.3"
                    strokeOpacity="0.65"
                  />

                  {/* Elliptical crystal base */}
                  <path
                    d="M39 280 Q75 272 111 280 Q75 289 39 280 Z"
                    fill="url(#crystalGlass)"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeOpacity="0.75"
                  />

                  <path
                    d="M49 280 Q75 275 101 280"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeOpacity="0.55"
                  />

                  {/* Small luxury light reflections */}
                  <circle cx="43" cy="47" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
                  <circle cx="105" cy="59" r="1" fill="#FFFFFF" fillOpacity="0.65" />
                </svg>

              </div>



              {/* =================================================
                  BOTTLE CUTOUT
              ================================================= */}


              <div className="absolute bottom-[-2%] right-[15%] z-30 h-[700px] w-[230px]">

                {/* Soft ambient shadow behind the bottle */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-[4%] left-[15%] h-[65%] w-[70%] rounded-full bg-[#351016]/35 blur-[38px]"
                />

                {/* Bottle image with refined lighting */}
                <img
                  src="/images/wine-guide-bottle.png"
                  alt="VINEORA premium wine bottle"
                  className="relative z-10 h-full w-full object-contain drop-shadow-[12px_24px_22px_rgba(39,11,10,0.38)]"
                  onError={(event) => {
                    event.currentTarget.src = "/images/wine.png";
                  }}
                />

              </div>



              {/* Editorial quote

              <div className="absolute bottom-[7%] right-0 z-40 max-w-[180px] rotate-[-5deg] text-right sm:max-w-[220px]">

                <p className="font-serif text-xl italic leading-tight text-[#ff6850] sm:text-2xl">

                  More than wine.

                  <br />

                  <span className="text-[#feab04]">
                    It's a story.
                  </span>

                </p>

                <div className="ml-auto mt-4 h-px w-16 bg-[#c9a45c]" />

              </div> */}

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