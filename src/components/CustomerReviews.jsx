import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api/reviews";

function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();

        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Customer reviews error:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={
          index < rating
            ? "text-[#c9a45c]"
            : "text-[#6d514a]"
        }
      >
        ★
      </span>
    ));
  };

  return (
    <section className="relative overflow-hidden bg-[#f3e8d7] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      
      {/* Decorative Elements */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#8b1e2d]/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-[#c9a45c]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-[#a88342]">
            The VINEORA Experience
          </p>

          <h2 className="font-serif text-4xl leading-tight text-[#351716] sm:text-5xl lg:text-6xl">
            What Our Guests Say
          </h2>

          <div className="mx-auto mt-6 h-px w-20 bg-[#c9a45c]" />

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#674f49] sm:text-base">
            Every bottle carries a story. Every experience creates a memory.
            Discover what wine lovers have to say about their VINEORA journey.
          </p>

        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse border border-[#c9a45c]/20 bg-white/30"
              />
            ))}

          </div>
        )}

        {/* Reviews */}
        {!loading && reviews.length > 0 && (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {reviews.slice(0, 6).map((review) => (
              <article
                key={review.id}
                className="group relative border border-[#c9a45c]/25 bg-white/30 p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a45c]/60"
              >

                {/* Stars */}
                <div className="flex gap-1 text-sm">
                  {renderStars(review.rating)}
                </div>

                {/* Quote */}
                <div className="mt-6">
                  <span className="font-serif text-4xl leading-none text-[#c9a45c]">
                    “
                  </span>

                  <p className="mt-2 text-sm leading-7 text-[#4f3935]">
                    {review.reviewText}
                  </p>
                </div>

                {/* Title */}
                {review.reviewTitle && (
                  <h3 className="mt-5 font-serif text-xl text-[#351716]">
                    {review.reviewTitle}
                  </h3>
                )}

                {/* Customer */}
                <div className="mt-7 border-t border-[#c9a45c]/20 pt-5">

                  <p className="text-sm font-medium text-[#351716]">
                    {review.customerName || "VINEORA Guest"}
                  </p>

                  {review.productName && (
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#a88342]">
                      {review.productName}
                    </p>
                  )}

                  {review.isVerifiedPurchase && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-[#674f49]">
                      ✓ Verified Purchase
                    </p>
                  )}

                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a45c] transition-all duration-500 group-hover:w-full" />

              </article>
            ))}

          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="mx-auto mt-14 max-w-2xl border border-[#c9a45c]/30 bg-white/30 px-6 py-12 text-center backdrop-blur-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a45c]/40">
              <span className="font-serif text-2xl text-[#c9a45c]">
                “
              </span>
            </div>

            <h3 className="mt-6 font-serif text-2xl text-[#351716]">
              Your Experience Matters
            </h3>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#674f49]">
              Our wine community is just beginning to share their stories.
              Customer reviews will appear here as our guests share their
              VINEORA experiences.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-3 border-b border-[#c9a45c] pb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#351716] transition-colors hover:text-[#a88342]"
            >
              Discover Our Wines
              <span>→</span>
            </Link>

          </div>
        )}

      </div>
    </section>
  );
}

export default CustomerReviews;