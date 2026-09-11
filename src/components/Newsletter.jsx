import { useState } from "react";

const API_URL = "http://localhost:5000/api/newsletter/subscribe";

function Newsletter() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to subscribe.");
      }

      setStatus("success");
      setMessage(
        data.message ||
          "Thank you for subscribing to the VINEORA Journal."
      );

      setFirstName("");
      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);

      setStatus("error");
      setMessage(
        error.message || "Unable to subscribe. Please try again."
      );
    }
  };

  return (
    /*
    ============================================================
    NEWSLETTER OUTER SECTION

    IMPORTANT:
    The outer background is cream so the dark newsletter panel
    has a clean ending before the curved footer begins.
    ============================================================
    */
    <section
      id="newsletter"
      className="
        relative
        overflow-hidden
        bg-[#f3e8d7]
        px-6
        py-16
        sm:px-10
        sm:py-20
        lg:px-16
        lg:py-24
      "
    >
      {/* ========================================================
          SUBTLE DECORATIVE DETAILS

          These stay very subtle because the curve between
          Newsletter and Footer is the main visual treatment.
      ======================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-[-120px]
          h-[360px]
          w-[360px]
          rounded-full
          bg-[#8b1e2d]/5
          blur-[100px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-32
          bottom-[-160px]
          h-[420px]
          w-[420px]
          rounded-full
          bg-[#c9a45c]/5
          blur-[110px]
        "
      />

      <div className="relative mx-auto max-w-[1250px]">

        {/* ======================================================
            MAIN NEWSLETTER PANEL

            Dark premium panel remains intact.
        ====================================================== */}

        <div
          className="
            relative
            overflow-hidden
            border
            border-[#c9a45c]/30
            bg-[#241311]
            shadow-[0_20px_60px_rgba(36,19,17,0.16)]
          "
        >

          {/* Gold top line */}

          <div
            className="
              absolute
              left-0
              right-0
              top-0
              h-px
              bg-[#c9a45c]/70
            "
          />

          <div
            className="
              grid
              lg:grid-cols-[1.05fr_0.95fr]
            "
          >

            {/* ==================================================
                LEFT CONTENT
            ================================================== */}

            <div
              className="
                relative
                px-7
                py-12
                sm:px-10
                sm:py-16
                lg:px-16
                lg:py-20
              "
            >

              {/* Label */}

              <div className="flex items-center gap-4">

                <span
                  className="
                    h-px
                    w-10
                    bg-[#c9a45c]
                  "
                />

                <p
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.4em]
                    text-[#c9a45c]
                  "
                >
                  Stay Connected
                </p>

              </div>

              {/* Heading */}

              <h2
                className="
                  mt-6
                  max-w-xl
                  font-serif
                  text-4xl
                  leading-[1.05]
                  tracking-[-0.03em]
                  text-[#f3e8d7]
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Discover the world

                <br />

                <span
                  className="
                    italic
                    text-[#d9bc7a]
                  "
                >
                  of VINEORA.
                </span>
              </h2>

              {/* Description */}

              <p
                className="
                  mt-7
                  max-w-xl
                  text-sm
                  leading-7
                  text-[#d5c3b2]
                  sm:text-base
                "
              >
                Discover new wines, tasting notes & exclusive
                offers. Join the VINEORA Journal and receive
                inspiration from the world of exceptional wine.
              </p>

              {/* ==================================================
                  BENEFITS
              ================================================== */}

              <div
                className="
                  mt-9
                  grid
                  max-w-lg
                  grid-cols-1
                  gap-4
                  border-y
                  border-[#c9a45c]/15
                  py-5
                  sm:grid-cols-3
                "
              >

                <NewsletterBenefit
                  number="01"
                  text="Wine Stories"
                />

                <NewsletterBenefit
                  number="02"
                  text="Tasting Notes"
                />

                <NewsletterBenefit
                  number="03"
                  text="Exclusive Offers"
                />

              </div>

            </div>

            {/* ==================================================
                RIGHT FORM
            ================================================== */}

            <div
              className="
                relative
                flex
                items-center
                border-t
                border-[#c9a45c]/15
                bg-[#f1e7d8]
                px-7
                py-12
                sm:px-10
                sm:py-16
                lg:border-l
                lg:border-t-0
                lg:px-14
                lg:py-20
              "
            >

              <div className="w-full">

                {/* Form label */}

                <p
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.3em]
                    text-[#9b7537]
                  "
                >
                  The VINEORA Journal
                </p>

                {/* Form heading */}

                <h3
                  className="
                    mt-3
                    font-serif
                    text-3xl
                    leading-tight
                    text-[#54151b]
                  "
                >
                  Enter your details
                </h3>

                {/* Form description */}

                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    text-[#6b5950]
                  "
                >
                  Be the first to discover new releases, wine
                  knowledge and special VINEORA experiences.
                </p>

                {/* ==================================================
                    FORM
                ================================================== */}

                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-5"
                >

                  {/* First Name */}

                  <div>

                    <label
                      htmlFor="newsletter-first-name"
                      className="
                        mb-2
                        block
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.2em]
                        text-[#6b5950]
                      "
                    >
                      First Name
                    </label>

                    <input
                      id="newsletter-first-name"
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      placeholder="Your first name"
                      className="
                        w-full
                        border-b
                        border-[#9b7537]/35
                        bg-transparent
                        px-0
                        py-3
                        text-sm
                        text-[#54151b]
                        outline-none
                        placeholder:text-[#9b8b80]
                        transition-colors
                        focus:border-[#54151b]
                      "
                    />

                  </div>

                  {/* Email */}

                  <div>

                    <label
                      htmlFor="newsletter-email"
                      className="
                        mb-2
                        block
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.2em]
                        text-[#6b5950]
                      "
                    >
                      Email Address
                    </label>

                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      className="
                        w-full
                        border-b
                        border-[#9b7537]/35
                        bg-transparent
                        px-0
                        py-3
                        text-sm
                        text-[#54151b]
                        outline-none
                        placeholder:text-[#9b8b80]
                        transition-colors
                        focus:border-[#54151b]
                      "
                    />

                  </div>

                  {/* Subscribe button */}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="
                      group
                      mt-2
                      inline-flex
                      w-full
                      items-center
                      justify-center
                      gap-4
                      bg-[#54151b]
                      px-6
                      py-4
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-[0.25em]
                      text-[#f3e8d7]
                      transition-all
                      duration-300
                      hover:bg-[#7d1f2c]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {status === "loading"
                      ? "Subscribing..."
                      : "Subscribe to the Journal"}

                    {status !== "loading" && (
                      <span
                        className="
                          transition-transform
                          duration-300
                          group-hover:translate-x-2
                        "
                      >
                        →
                      </span>
                    )}
                  </button>

                </form>

                {/* ==================================================
                    SUCCESS MESSAGE
                ================================================== */}

                {status === "success" && (
                  <div
                    className="
                      mt-5
                      border
                      border-[#6c8055]/30
                      bg-[#e7eadf]
                      px-4
                      py-3
                    "
                  >
                    <p
                      className="
                        text-sm
                        leading-6
                        text-[#526342]
                      "
                    >
                      {message}
                    </p>
                  </div>
                )}

                {/* ==================================================
                    ERROR MESSAGE
                ================================================== */}

                {status === "error" && (
                  <div
                    className="
                      mt-5
                      border
                      border-[#8b1e2d]/25
                      bg-[#f4e1df]
                      px-4
                      py-3
                    "
                  >
                    <p
                      className="
                        text-sm
                        leading-6
                        text-[#7d1f2c]
                      "
                    >
                      {message}
                    </p>
                  </div>
                )}

                {/* Legal text */}

                <p
                  className="
                    mt-5
                    text-[9px]
                    leading-5
                    text-[#8a7569]
                  "
                >
                  By subscribing, you agree to receive VINEORA
                  news, tasting inspiration and selected offers.
                  You can unsubscribe at any time.
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

/* ================================================================
   NEWSLETTER BENEFIT
================================================================ */

function NewsletterBenefit({ number, text }) {
  return (
    <div className="flex items-center gap-3">

      <span
        className="
          font-serif
          text-lg
          text-[#c9a45c]
        "
      >
        {number}
      </span>

      <span
        className="
          text-[9px]
          uppercase
          tracking-[0.14em]
          text-[#cbbcad]
        "
      >
        {text}
      </span>

    </div>
  );
}

export default Newsletter;