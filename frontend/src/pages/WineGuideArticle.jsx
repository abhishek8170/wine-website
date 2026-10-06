import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";


const API_URL = "http://localhost:5000/api/wine-guide";

function WineGuideArticle() {
  const { settings } = useSiteSettings();

  const brandName =
    settings?.brand_name || "VINEORA";
  const { slug } = useParams();

  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError("");
        setArticle(null);

        const response = await fetch(`${API_URL}/${slug}`);

        if (!response.ok) {
          throw new Error("Article not found");
        }

        const data = await response.json();

        const fetchedArticle = data.article || data.data || data;

        setArticle(fetchedArticle);

        // Fetch other published articles for related articles
        try {
          const relatedResponse = await fetch(API_URL);

          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();

            const allArticles = relatedData.articles || [];

            const filteredArticles = allArticles
              .filter((item) => item.id !== fetchedArticle.id)
              .slice(0, 3);

            setRelatedArticles(filteredArticles);
          }
        } catch (relatedError) {
          console.error("Related articles error:", relatedError);
        }
      } catch (err) {
        console.error("Wine Guide Article error:", err);
        setError("We couldn't find this journal article.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const getImage = (item) => {
    return item?.imageUrl || "/images/wine.png";
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  /*
   * The article content is coming from the database.
   *
   * The database currently stores article content as text.
   * We split it into paragraphs so the article remains readable.
   */
  const renderContent = (content) => {
    if (!content) {
      return (
        <p className="text-[#6b5950]">
          This article does not have any content yet.
        </p>
      );
    }

    const paragraphs = content
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return paragraphs.map((paragraph, index) => (
      <p
        key={index}
        className="mb-7 text-base leading-8 text-[#554640] sm:text-lg sm:leading-9"
      >
        {paragraph}
      </p>
    ));
  };

  /*
   * Loading state
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4ecdf]">

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">

          <div className="mx-auto max-w-4xl animate-pulse">

            <div className="mx-auto h-4 w-32 bg-[#dfd0bd]" />

            <div className="mx-auto mt-8 h-20 max-w-3xl bg-[#dfd0bd]" />

            <div className="mx-auto mt-5 h-6 max-w-xl bg-[#dfd0bd]" />

            <div className="mt-12 h-[500px] bg-[#dfd0bd]" />

          </div>

        </div>

      </main>
    );
  }


  /*
   * Error state
   */

  if (error || !article) {
    return (
      <main className="min-h-screen bg-[#f4ecdf]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">

          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#9b7537]">
            {brandName} Journal
          </p>

          <h1 className="mt-6 font-serif text-4xl text-[#54151b] sm:text-5xl">
            Article Not Found
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#6b5950]">
            The journal article you're looking for may have been removed,
            unpublished or is no longer available.
          </p>

          <Link
            to="/wine-guide"
            className="group mt-10 inline-flex items-center gap-4 border-b border-[#9b7537] pb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[#54151b]"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-2">
              ←
            </span>

            Back to Wine Guide
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen overflow-hidden bg-[#f4ecdf] text-[#351716]">

      {/* =====================================================
          ARTICLE HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#eee3d3]">

        {/* Decorative burgundy shape */}

        <div
          className="pointer-events-none absolute right-[-12%] top-[-15%] hidden h-[600px] w-[45%] bg-[#7d1f2c] lg:block"
          style={{
            clipPath:
              "polygon(22% 0%, 100% 0%, 100% 100%, 72% 89%, 56% 96%, 43% 78%, 28% 84%, 8% 61%, 18% 42%, 4% 24%)",
          }}
        />

        <div className="relative mx-auto max-w-[1400px] px-6 pb-20 pt-16 sm:px-10 lg:px-16 lg:pb-24">

          {/* Breadcrumb */}

          <div className="relative z-10">

            <Link
              to="/wine-guide"
              className="group inline-flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[#6b5950] transition-colors hover:text-[#9b7537]"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">
                ←
              </span>

              Wine Guide
            </Link>

          </div>


          {/* Article heading */}

          <div className="relative z-10 mx-auto mt-16 max-w-5xl text-center">

            <div className="flex items-center justify-center gap-4">

              <span className="h-px w-10 bg-[#b18a48]" />

              <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#9b7537]">
                {article.category || "Wine Guide"}
              </p>

              <span className="h-px w-10 bg-[#b18a48]" />

            </div>


            <h1 className="mt-7 font-serif text-5xl leading-[0.98] tracking-[-0.035em] text-[#54151b] sm:text-6xl lg:text-7xl">
              {article.title}
            </h1>


            {article.excerpt && (
              <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#6b5950] sm:text-lg">
                {article.excerpt}
              </p>
            )}


            {/* Article metadata */}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[9px] uppercase tracking-[0.18em] text-[#8a7569]">

              <span>
                {article.author || "VINEORA Wine Guide"}
              </span>

              {article.publishedAt && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[#b18a48]" />

                  <span>
                    {formatDate(article.publishedAt)}
                  </span>
                </>
              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE IMAGE
      ===================================================== */}

      <section className="relative bg-[#f4ecdf] px-6 pb-16 sm:px-10 lg:px-16">

        <div className="relative mx-auto max-w-[1200px]">

          <div className="relative aspect-[16/9] max-h-[680px] overflow-hidden bg-[#e5d7c5]">

            <img
              src={getImage(article)}
              alt={
                article.imageAlt ||
                article.title ||
                "Wine Guide article"
              }
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = "/images/wine.png";
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#351716]/20 via-transparent to-transparent" />

          </div>

        </div>

      </section>


      {/* =====================================================
          ARTICLE CONTENT
      ===================================================== */}

      <section className="bg-[#f4ecdf] px-6 pb-24 sm:px-10 lg:px-16 lg:pb-32">

        <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-[1fr_280px]">

          {/* Main article */}

          <article className="mx-auto w-full max-w-[780px]">

            <div className="border-t border-[#9b7537]/25 pt-10">

              {renderContent(article.content)}

            </div>


            {/* Back link */}

            <div className="mt-14 border-t border-[#9b7537]/20 pt-8">

              <Link
                to="/wine-guide"
                className="group inline-flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.22em] text-[#54151b]"
              >

                <span className="transition-transform duration-300 group-hover:-translate-x-2">
                  ←
                </span>

                Back to Wine Guide

              </Link>

            </div>

          </article>


          {/* =================================================
              ARTICLE SIDEBAR
          ================================================= */}

          <aside className="lg:pt-2">

            <div className="border border-[#9b7537]/20 bg-[#eee3d3] p-7">

              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#9b7537]">
                {brandName} Journal
              </p>

              <h2 className="mt-4 font-serif text-2xl leading-tight text-[#54151b]">
                Discover the world of wine.
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#6b5950]">
                Explore tasting knowledge, pairing inspiration, wine basics
                and stories behind exceptional bottles.
              </p>

              <Link
                to="/wine-guide"
                className="group mt-7 inline-flex items-center gap-3 border-b border-[#9b7537] pb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#54151b]"
              >
                Explore Journal

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

            </div>

          </aside>

        </div>

      </section>


      {/* =====================================================
          RELATED ARTICLES
      ===================================================== */}

      {relatedArticles.length > 0 && (
        <section className="relative overflow-hidden bg-[#351716] px-6 py-24 sm:px-10 lg:px-16 lg:py-28">

          <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#8b1e2d]/20 blur-[100px]" />

          <div className="relative mx-auto max-w-[1200px]">

            {/* Heading */}

            <div className="mb-12">

              <div className="flex items-center gap-4">

                <span className="h-px w-10 bg-[#b18a48]" />

                <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#c9a45c]">
                  Continue Reading
                </p>

              </div>

              <h2 className="mt-5 font-serif text-4xl text-[#f3e8d7] sm:text-5xl">
                More from the
                <span className="ml-2 italic">
                  {brandName} Journal
                </span>
              </h2>

            </div>


            {/* Related cards */}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  to={`/wine-guide/${relatedArticle.slug}`}
                  className="group overflow-hidden border border-[#c9a45c]/15 bg-[#43201d]/60 transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a45c]/40"
                >

                  {/* Image */}

                  <div className="h-[230px] overflow-hidden">

                    <img
                      src={getImage(relatedArticle)}
                      alt={
                        relatedArticle.imageAlt ||
                        relatedArticle.title ||
                        "Related wine article"
                      }
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = "/images/wine.png";
                      }}
                    />

                  </div>


                  {/* Content */}

                  <div className="p-6">

                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#c9a45c]">
                      {relatedArticle.category || "Wine Guide"}
                    </p>

                    <h3 className="mt-3 font-serif text-2xl leading-tight text-[#f3e8d7] transition-colors group-hover:text-[#c9a45c]">
                      {relatedArticle.title}
                    </h3>

                    <div className="mt-5 flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-[#d4c1ae]">

                      Read Article

                      <span className="transition-transform duration-300 group-hover:translate-x-2">
                        →
                      </span>

                    </div>

                  </div>

                </Link>
              ))}

            </div>

          </div>

        </section>
      )}


      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="bg-[#f4ecdf] px-6 py-20 text-center sm:px-10 lg:px-16 lg:py-24">

        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#9b7537]">
          The {brandName} Journal
        </p>

        <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight text-[#54151b] sm:text-5xl">

          There is always more
          <span className="italic">
            {" "}to discover.
          </span>

        </h2>

        <Link
          to="/wine-guide"
          className="group mt-8 inline-flex items-center gap-4 border-b border-[#9b7537] pb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[#54151b]"
        >

          Explore All Articles

          <span className="transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>

        </Link>

      </section>

    </main>
  );
}

export default WineGuideArticle;