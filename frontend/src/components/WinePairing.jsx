import React from "react";
import { Link } from "react-router-dom";

const pairingItems = [
  {
    number: "01",
    wine: "Red Wine",
    description:
      "Bold, structured reds bring depth and richness to hearty dishes and mature flavours.",
    foods: ["Steak", "Grilled Meat", "Pasta", "Cheese"],
    link: "/shop?category=red",

    // Red wine accent
    accent: "#8b1e2d",
    accentLight: "rgba(139, 30, 45, 0.10)",
    accentBorder: "rgba(139, 30, 45, 0.28)",
  },
  {
    number: "02",
    wine: "White Wine",
    description:
      "Fresh and elegant whites complement delicate flavours, seafood, and lighter dishes.",
    foods: ["Seafood", "Chicken", "Salads", "Light Dishes"],
    link: "/shop?category=white",

    // White wine / champagne accent
    accent: "#b18a48",
    accentLight: "rgba(177, 138, 72, 0.10)",
    accentBorder: "rgba(177, 138, 72, 0.30)",
  },
  {
    number: "03",
    wine: "Rosé",
    description:
      "Bright and refreshing rosé is a versatile choice for vibrant, relaxed, and spicy dishes.",
    foods: ["Appetizers", "Spicy Food", "Salads"],
    link: "/shop?category=rose",

    // Rosé accent
    accent: "#b66f78",
    accentLight: "rgba(182, 111, 120, 0.11)",
    accentBorder: "rgba(182, 111, 120, 0.30)",
  },
];

const WinePairing = () => {
  return (
    <section className="relative overflow-hidden bg-[#f3e8d7] text-[#351716]">
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-[#c5a96b]/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#8b1e2d]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
        {/* =========================================================
            SECTION INTRO
        ========================================================= */}
        <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
          {/* Label */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342] sm:text-sm">
              The Art of Pairing
            </p>

            <div className="mt-7 h-px w-20 bg-[#a88342]/60" />

            <p className="mt-6 max-w-xs text-sm leading-7 text-[#6b514b]">
              Discover how the right wine can bring out the best in every
              dish.
            </p>
          </div>

          {/* Heading */}
          <div>
            <h2 className="max-w-5xl font-serif text-4xl font-medium leading-[1.05] tracking-[-0.025em] sm:text-5xl lg:text-7xl">
              Wine &amp; Food
              <span className="block text-[#8b1e2d]">Pairing.</span>
            </h2>

            <p className="mt-7 max-w-2xl text-sm leading-7 text-[#684f49] sm:text-base">
              From rich reds with grilled meats to crisp whites with seafood,
              find a wine that completes the moment and elevates every bite.
            </p>
          </div>
        </div>

        {/* =========================================================
            PAIRING CARDS
        ========================================================= */}
        <div className="mt-16 grid gap-5 lg:mt-24 lg:grid-cols-3">
          {pairingItems.map((item) => (
            <article
              key={item.number}
              className="
                group
                relative
                overflow-hidden
                border
                border-[#8b1e2d]/15
                bg-[#eadbc5]/35
                px-7
                py-9
                transition-all
                duration-500
                hover:-translate-y-1
                sm:px-9
                sm:py-11
              "
              style={{
                "--accent": item.accent,
                "--accent-light": item.accentLight,
                "--accent-border": item.accentBorder,
              }}
            >
              {/* =====================================================
                  COLOR ACCENT
              ===================================================== */}

              {/* Top colored line */}
              <div
                className="
                  absolute
                  left-0
                  top-0
                  h-[3px]
                  w-full
                  opacity-70
                  transition-all
                  duration-500
                  group-hover:h-[4px]
                  group-hover:opacity-100
                "
                style={{ backgroundColor: "var(--accent)" }}
              />

              {/* Subtle colored glow */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-16
                  -top-16
                  h-40
                  w-40
                  rounded-full
                  opacity-0
                  blur-3xl
                  transition-opacity
                  duration-700
                  group-hover:opacity-100
                "
                style={{ backgroundColor: "var(--accent-light)" }}
              />

              {/* Top row */}
              <div className="relative flex items-center justify-between">
                <span
                  className="font-serif text-3xl transition-colors duration-300"
                  style={{ color: "var(--accent)" }}
                >
                  {item.number}
                </span>

                <span
                  className="
                    h-px
                    w-12
                    transition-all
                    duration-500
                    group-hover:w-20
                  "
                  style={{ backgroundColor: "var(--accent)" }}
                />
              </div>

              {/* Wine category */}
              <p
                className="
                  relative
                  mt-10
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.28em]
                  sm:text-[11px]
                "
                style={{ color: "var(--accent)" }}
              >
                {item.wine}
              </p>

              {/* Pairing heading */}
              <h3 className="relative mt-3 font-serif text-3xl leading-tight text-[#351716] sm:text-[2.1rem]">
                Pairs beautifully with
              </h3>

              {/* Description */}
              <p className="relative mt-5 text-sm leading-7 text-[#684f49]">
                {item.description}
              </p>

              {/* Food list */}
              <div
                className="relative mt-8 border-t pt-6"
                style={{ borderColor: "var(--accent-border)" }}
              >
                <p
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.22em]
                  "
                  style={{ color: "var(--accent)" }}
                >
                  Pairs with
                </p>

                <ul className="mt-5 space-y-3">
                  {item.foods.map((food) => (
                    <li
                      key={food}
                      className="
                        flex
                        items-center
                        gap-3
                        text-sm
                        text-[#351716]
                      "
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "var(--accent)" }}
                      />

                      <span>{food}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div
                className="relative mt-9 border-t pt-6"
                style={{ borderColor: "var(--accent-border)" }}
              >
                <Link
                  to={item.link}
                  className="
                    group/link
                    inline-flex
                    items-center
                    gap-3
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.22em]
                    text-[#351716]
                    transition-colors
                    duration-300
                  "
                  style={{ "--link-accent": item.accent }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = item.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#351716";
                  }}
                >
                  Explore {item.wine.replace(" Wine", "")} Wines

                  <span className="transition-transform duration-300 group-hover/link:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              {/* Bottom colored accent */}
              <div
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  transition-all
                  duration-500
                  group-hover:w-full
                "
                style={{ backgroundColor: "var(--accent)" }}
              />
            </article>
          ))}
        </div>

        {/* =========================================================
            BOTTOM MESSAGE
        ========================================================= */}
        <div className="mt-16 border-t border-[#8b1e2d]/15 pt-10 sm:mt-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#a88342]">
                Taste with intention
              </p>

              <h3 className="mt-3 max-w-3xl font-serif text-2xl leading-tight text-[#351716] sm:text-3xl lg:text-4xl">
                Every bottle has a dish waiting to meet it.
              </h3>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#684f49]">
                Explore our wines and discover the perfect bottle for your
                next meal, gathering, or celebration.
              </p>
            </div>

            <Link
              to="/shop"
              className="
                group
                inline-flex
                w-fit
                shrink-0
                items-center
                gap-4
                border-b
                border-[#351716]/50
                pb-2
                text-xs
                font-medium
                uppercase
                tracking-[0.2em]
                text-[#351716]
                transition-all
                duration-300
                hover:border-[#8b1e2d]
                hover:text-[#8b1e2d]
              "
            >
              Explore All Wines

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WinePairing;