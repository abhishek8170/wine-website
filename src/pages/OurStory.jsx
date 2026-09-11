import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const processSteps = [
  {
    number: "01",
    title: "Harvest",
    text: "Carefully selected grapes begin their journey at the right moment of ripeness.",
  },
  {
    number: "02",
    title: "Selection",
    text: "Each harvest is thoughtfully assessed so only grapes with the desired character move forward.",
  },
  {
    number: "03",
    title: "Winemaking",
    text: "Traditional craft and considered techniques guide fermentation and development.",
  },
  {
    number: "04",
    title: "Maturation",
    text: "Time allows each wine to develop depth, balance, texture, and character.",
  },
  {
    number: "05",
    title: "Bottling",
    text: "Once the wine reaches its intended expression, it is carefully prepared for the bottle.",
  },
];

const qualityPoints = [
  {
    number: "01",
    title: "Careful Selection",
    text: "Every stage begins with attention to the quality and character of the grapes.",
  },
  {
    number: "02",
    title: "Thoughtful Craft",
    text: "Our approach balances time-honoured winemaking with modern precision.",
  },
  {
    number: "03",
    title: "Consistency",
    text: "From vineyard to bottle, every detail matters in creating wines of character.",
  },
];

const teamMembers = [
  {
    name: "Our Winemaking Team",
    role: "Craft & Cellar",
    description:
      "A dedicated team brings knowledge, patience, and attention to detail to every stage of the winemaking journey.",
  },
  {
    name: "Our Vineyard Team",
    role: "Vineyard & Harvest",
    description:
      "The people closest to the vines help guide each harvest with care and an understanding of the land.",
  },
  {
    name: "Our Cellar Team",
    role: "Maturation & Bottling",
    description:
      "From maturation to final preparation, our cellar team protects the character developed throughout the process.",
  },
];

const awards = [
  {
    number: "01",
    title: "Recognition",
    text: "A place for the wines and achievements that represent the VINEORA journey.",
  },
  {
    number: "02",
    title: "Craftsmanship",
    text: "Celebrating the care, patience, and precision behind every bottle.",
  },
  {
    number: "03",
    title: "Character",
    text: "Recognition that reflects our pursuit of expressive and memorable wines.",
  },
];

const OurStory = () => {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/our-story");

        if (!response.ok) {
          throw new Error("Failed to fetch Our Story");
        }

        const data = await response.json();

        setStory(data.data || data);
      } catch (error) {
        console.error("Our Story API error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, []);

  /*
   * Fallback values make sure the page still looks complete
   * if the API does not return a particular field.
   */
  const imageUrl = story?.image_url || "/images/ourstory.png";

  const heroLabel = story?.section_label || "The VINEORA Story";

  const heroHeading = story?.heading || "Crafted with patience.";

  const heroHighlight =
    story?.highlighted_heading || "Defined by character.";

  const philosophyTitle =
    story?.philosophy_title || "Our Philosophy";

  const philosophyHeading =
    story?.philosophy_heading ||
    "Great wine begins with patience, respect for the land, and a belief in thoughtful craftsmanship.";

  return (
    <main className="overflow-hidden bg-[#f3e8d7] text-[#351716]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-[#241311] text-[#f3e8d7]">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={story?.image_alt || "VINEORA winery"}
            className="h-full w-full object-cover opacity-70"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#1c0e0d]/95 via-[#1c0e0d]/65 to-[#1c0e0d]/25" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#1c0e0d] via-transparent to-[#1c0e0d]/20" />
        </div>

        {/* Hero content */}
        <div className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-end px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-12 lg:pb-24 lg:pt-28">
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a45c] sm:text-sm">
              {heroLabel}
            </p>

            <div className="mt-7 h-px w-20 bg-[#c9a45c]/70" />

            <h1 className="mt-7 font-serif text-5xl font-medium leading-[0.95] tracking-[-0.025em] sm:text-6xl lg:text-8xl">
              {heroHeading}
              <span className="block text-[#c9a45c]">
                {heroHighlight}
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-sm leading-7 text-[#e4d5c3] sm:text-base">
              A story shaped by the vineyard, guided by craftsmanship, and
              expressed through every bottle.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-6 hidden items-center gap-4 text-[9px] uppercase tracking-[0.25em] text-[#c9a45c]/80 sm:flex lg:right-12">
          <span>Discover our story</span>
          <span className="h-px w-10 bg-[#c9a45c]/50" />
        </div>
      </section>

      {/* =========================================================
          OUR STORY
      ========================================================= */}
      <section className="bg-[#f3e8d7]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-24">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
                01 — Our Story
              </p>

              <div className="mt-7 h-px w-20 bg-[#a88342]/60" />

              <p className="mt-6 max-w-xs text-sm leading-7 text-[#6b514b]">
                Every bottle begins with a story — from the vineyard to the
                table.
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl font-serif text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-7xl">
                Wine is more than what is in the bottle.
                <span className="block text-[#8b1e2d]">
                  It is where the story begins.
                </span>
              </h2>

              <div className="mt-10 grid gap-7 text-sm leading-8 text-[#684f49] sm:grid-cols-2">
                <p>
                  {story?.story_paragraph_1 ||
                    "VINEORA is built around a simple belief: exceptional wine is created through patience, thoughtful craftsmanship, and respect for the character of every harvest."}
                </p>

                <p>
                  {story?.story_paragraph_2 ||
                    "From the vineyard to the cellar, every decision contributes to the final expression. We take the time to allow each wine to develop its own identity."}
                </p>

                <p className="sm:col-span-2">
                  {story?.story_paragraph_3 ||
                    "Our wines are created for moments of connection — shared around a table, opened for a celebration, or enjoyed quietly when the moment calls for something special."}
                </p>
              </div>
            </div>
          </div>

          {/* Story image */}
          <div className="mt-20 overflow-hidden sm:mt-24">
            <img
              src={imageUrl}
              alt={story?.image_alt || "VINEORA winery and vineyard"}
              className="h-[420px] w-full object-cover transition-transform duration-700 hover:scale-[1.02] sm:h-[560px] lg:h-[680px]"
            />

            {story?.image_caption && (
              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#8a7069]">
                {story.image_caption}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          WINERY HISTORY
      ========================================================= */}
      <section className="bg-[#351716] text-[#f3e8d7]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[0.6fr_1.4fr] lg:gap-24">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
                02 — Winery History
              </p>

              <div className="mt-7 h-px w-20 bg-[#c9a45c]/60" />

              <p className="mt-6 max-w-xs text-sm leading-7 text-[#cbb7a7]">
                A journey shaped by place, people, patience, and a passion for
                wine.
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
                A tradition in the making.
              </h2>

              <p className="mt-8 max-w-2xl text-sm leading-8 text-[#cbb7a7] sm:text-base">
                Our winery story continues to evolve with every harvest. The
                foundation remains simple: respect the vineyard, care for the
                craft, and give every wine the time it deserves.
              </p>

              <div className="mt-14 border-t border-[#c9a45c]/20">
                <div className="grid divide-y divide-[#c9a45c]/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="py-7 sm:px-7 sm:py-9">
                    <p className="font-serif text-4xl text-[#c9a45c]">
                      01
                    </p>

                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#e4d5c3]">
                      The Beginning
                    </p>
                  </div>

                  <div className="py-7 sm:px-7 sm:py-9">
                    <p className="font-serif text-4xl text-[#c9a45c]">
                      02
                    </p>

                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#e4d5c3]">
                      The Vineyard
                    </p>
                  </div>

                  <div className="py-7 sm:px-7 sm:py-9">
                    <p className="font-serif text-4xl text-[#c9a45c]">
                      03
                    </p>

                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#e4d5c3]">
                      The Craft
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          VINEYARD
      ========================================================= */}
      <section className="bg-[#eadbc5]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
            {/* Image placeholder area */}
            <div className="relative overflow-hidden bg-[#d8c5aa]">
              <div className="flex aspect-[4/5] items-center justify-center">
                <div className="px-10 text-center">
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#8b1e2d]">
                    Vineyard Photography
                  </p>

                  <p className="mt-4 font-serif text-3xl text-[#351716]">
                    The land behind the wine.
                  </p>

                  <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-[#684f49]">
                    Replace this visual with a high-quality VINEORA vineyard
                    photograph when the final brand photography is available.
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
                03 — The Vineyard
              </p>

              <div className="mt-7 h-px w-20 bg-[#a88342]/60" />

              <h2 className="mt-7 max-w-2xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Where every bottle begins.
              </h2>

              <p className="mt-8 text-sm leading-8 text-[#684f49]">
                Great wine begins long before the cellar. It begins among the
                vines, where soil, climate, season, and careful attention come
                together.
              </p>

              <p className="mt-5 text-sm leading-8 text-[#684f49]">
                Our approach respects the natural character of the vineyard
                while giving each harvest the care required to express its
                potential.
              </p>

              <div className="mt-10 border-t border-[#8b1e2d]/15 pt-7">
                <p className="font-serif text-2xl text-[#8b1e2d]">
                  From vine to bottle,
                </p>

                <p className="mt-2 text-sm text-[#684f49]">
                  every detail contributes to the final character.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          WINEMAKING PROCESS
      ========================================================= */}
      <section className="bg-[#f3e8d7]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
                04 — Winemaking Process
              </p>

              <div className="mt-7 h-px w-20 bg-[#a88342]/60" />
            </div>

            <div>
              <h2 className="max-w-5xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
                Patience is part of
                <span className="block text-[#8b1e2d]">
                  the process.
                </span>
              </h2>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#684f49] sm:text-base">
                Every stage has a purpose. Our winemaking process allows the
                character of each harvest to develop with care and precision.
              </p>
            </div>
          </div>

          <div className="mt-16 grid border border-[#8b1e2d]/15 sm:grid-cols-2 lg:mt-24 lg:grid-cols-5">
            {processSteps.map((step, index) => (
              <article
                key={step.number}
                className={`group px-6 py-9 ${
                  index !== processSteps.length - 1
                    ? "border-b border-[#8b1e2d]/15 lg:border-b-0 lg:border-r"
                    : ""
                }`}
              >
                <p className="font-serif text-3xl text-[#a88342]">
                  {step.number}
                </p>

                <h3 className="mt-8 font-serif text-2xl text-[#351716]">
                  {step.title}
                </h3>

                <p className="mt-5 text-sm leading-7 text-[#684f49]">
                  {step.text}
                </p>

                <div className="mt-8 h-[2px] w-8 bg-[#8b1e2d] transition-all duration-500 group-hover:w-full" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PHILOSOPHY
      ========================================================= */}
      <section className="bg-[#8b1e2d] text-[#f3e8d7]">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-28 lg:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#e3c78b]">
            05 — {philosophyTitle}
          </p>

          <div className="mx-auto mt-7 h-px w-20 bg-[#e3c78b]/70" />

          <h2 className="mx-auto mt-8 max-w-5xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
            {philosophyHeading}
          </h2>

          <p className="mx-auto mt-9 max-w-2xl text-sm leading-8 text-[#eadbc9] sm:text-base">
            We believe the best wines are not rushed. They are given attention,
            time, and space to become what they are meant to be.
          </p>

          <div className="mt-14 font-serif text-5xl text-[#e3c78b]">
            “
          </div>

          <p className="mx-auto max-w-3xl font-serif text-2xl leading-relaxed text-[#f3e8d7] sm:text-3xl">
            {story?.bottom_quote ||
              "Crafted with patience. Defined by character."}
          </p>
        </div>
      </section>

      {/* =========================================================
          QUALITY STANDARDS
      ========================================================= */}
      <section className="bg-[#351716] text-[#f3e8d7]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
                06 — Quality Standards
              </p>

              <div className="mt-7 h-px w-20 bg-[#c9a45c]/60" />

              <p className="mt-6 max-w-xs text-sm leading-7 text-[#cbb7a7]">
                Quality is not one step. It is a standard carried through every
                stage.
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
                Attention to every
                <span className="block text-[#c9a45c]">
                  detail.
                </span>
              </h2>

              <div className="mt-14 grid gap-px border border-[#c9a45c]/20 bg-[#c9a45c]/20 sm:grid-cols-3">
                {qualityPoints.map((point) => (
                  <article
                    key={point.number}
                    className="bg-[#351716] px-7 py-9 sm:px-8 sm:py-11"
                  >
                    <p className="font-serif text-3xl text-[#c9a45c]">
                      {point.number}
                    </p>

                    <h3 className="mt-8 font-serif text-2xl">
                      {point.title}
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[#cbb7a7]">
                      {point.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OUR TEAM
      ========================================================= */}
      <section className="bg-[#f3e8d7]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
              07 — Our Team
            </p>

            <div className="mx-auto mt-7 h-px w-20 bg-[#a88342]/60" />

            <h2 className="mx-auto mt-8 max-w-4xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
              The people behind
              <span className="block text-[#8b1e2d]">
                every bottle.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#684f49] sm:text-base">
              Wine is a craft made by people. Our team brings knowledge,
              patience, and care to every part of the journey.
            </p>
          </div>

          <div className="mt-16 grid gap-5 lg:mt-24 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <article
                key={member.name}
                className="border border-[#8b1e2d]/15 bg-[#eadbc5]/35 p-7 sm:p-9"
              >
                {/* Photography area */}
                <div className="flex aspect-[4/3] items-center justify-center bg-[#dcc9ad]">
                  <div className="px-8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#a88342]">
                      Team Photography
                    </p>

                    <p className="mt-3 font-serif text-xl text-[#351716]">
                      VINEORA
                    </p>
                  </div>
                </div>

                <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.24em] text-[#a88342]">
                  {member.role}
                </p>

                <h3 className="mt-3 font-serif text-2xl text-[#351716]">
                  {member.name}
                </h3>

                <p className="mt-5 text-sm leading-7 text-[#684f49]">
                  {member.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          AWARDS
      ========================================================= */}
      <section className="bg-[#eadbc5]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
                08 — Awards &amp; Recognition
              </p>

              <div className="mt-7 h-px w-20 bg-[#a88342]/60" />

              <p className="mt-6 max-w-xs text-sm leading-7 text-[#684f49]">
                Recognition is a reflection of the craft, dedication, and
                character behind the wine.
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
                Recognition for the
                <span className="block text-[#8b1e2d]">
                  journey.
                </span>
              </h2>

              <div className="mt-14 border-t border-[#8b1e2d]/15">
                {awards.map((award) => (
                  <div
                    key={award.number}
                    className="grid gap-5 border-b border-[#8b1e2d]/15 py-8 sm:grid-cols-[80px_1fr_1.5fr] sm:items-center sm:gap-8"
                  >
                    <span className="font-serif text-3xl text-[#a88342]">
                      {award.number}
                    </span>

                    <h3 className="font-serif text-2xl text-[#351716]">
                      {award.title}
                    </h3>

                    <p className="text-sm leading-7 text-[#684f49]">
                      {award.text}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-7 text-xs uppercase tracking-[0.18em] text-[#8a7069]">
                Actual awards and certifications can be added here when
                supplied by the winery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SUSTAINABILITY
      ========================================================= */}
      <section className="bg-[#f3e8d7]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-24">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a88342]">
                09 — Sustainability
              </p>

              <div className="mt-7 h-px w-20 bg-[#a88342]/60" />

              <h2 className="mt-8 max-w-3xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Respect the land.
                <span className="block text-[#8b1e2d]">
                  Protect the future.
                </span>
              </h2>

              <p className="mt-8 max-w-2xl text-sm leading-8 text-[#684f49]">
                Sustainability is an important conversation for every modern
                winery. This section can communicate VINEORA's actual
                environmental practices once the winery's verified
                sustainability commitments are supplied.
              </p>

              <div className="mt-10 border-t border-[#8b1e2d]/15 pt-7">
                <p className="font-serif text-2xl text-[#351716]">
                  Thoughtful today.
                </p>

                <p className="mt-2 text-sm text-[#684f49]">
                  Responsible for tomorrow.
                </p>
              </div>
            </div>

            <div className="border border-[#8b1e2d]/15 bg-[#eadbc5]/45 p-8 sm:p-10">
              <div className="space-y-7">
                {[
                  "Respect for the vineyard",
                  "Responsible resource use",
                  "Thoughtful production",
                  "Long-term care for the land",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-5 border-b border-[#8b1e2d]/10 pb-7 last:border-b-0 last:pb-0"
                  >
                    <span className="font-serif text-2xl text-[#a88342]">
                      0{index + 1}
                    </span>

                    <span className="text-sm text-[#351716]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="bg-[#241311] text-[#f3e8d7]">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-28 lg:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
            Continue the journey
          </p>

          <div className="mx-auto mt-7 h-px w-20 bg-[#c9a45c]/60" />

          <h2 className="mx-auto mt-8 max-w-4xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
            Discover the wines
            <span className="block text-[#c9a45c]">
              behind the story.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#cbb7a7] sm:text-base">
            Explore the collection and discover wines crafted with patience
            and defined by character.
          </p>

          <Link
            to="/shop"
            className="group mt-10 inline-flex items-center gap-5 border-b border-[#c9a45c]/60 pb-3 text-xs font-medium uppercase tracking-[0.22em] text-[#f3e8d7] transition-colors duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
          >
            Explore Our Wines

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default OurStory;