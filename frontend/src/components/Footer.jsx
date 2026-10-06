import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

function Footer() {
  const currentYear = new Date().getFullYear();

  const { settings } = useSiteSettings();

  const brandName =
    settings?.brand_name || "VINEORA";

  const contactEmail =
    settings?.contact_email || "";

  const contactPhone =
    settings?.contact_phone || "";

  return (
    /*
    ============================================================
    PREMIUM FOOTER
    ============================================================
    */

    <div className="bg-[#f3e8d7] pt-8 sm:pt-10 lg:pt-12">

      <footer
        className="
          relative
          overflow-hidden
          rounded-t-[42px]
          bg-[#180c0b]
          text-[#f3e8d7]
          shadow-[0_-10px_35px_rgba(0,0,0,0.12)]
          sm:rounded-t-[65px]
          lg:rounded-t-[85px]
        "
      >

        {/* =====================================================
            SUBTLE BURGUNDY ATMOSPHERE
        ===================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_82%_18%,rgba(125,31,44,0.18),transparent_34%),radial-gradient(circle_at_15%_100%,rgba(90,20,28,0.10),transparent_35%)]
          "
        />

        {/* =====================================================
            TOP GOLD DETAIL
        ===================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-[8%]
            right-[8%]
            top-0
            h-px
            bg-[#c9a45c]/45
          "
        />

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <div
          className="
            relative
            mx-auto
            max-w-[1400px]
            px-6
            sm:px-10
            lg:px-16
          "
        >

          {/* ===================================================
              BRAND + NAVIGATION
          =================================================== */}

          <div
            className="
              border-b
              border-[#c9a45c]/20
              py-12
              sm:py-14
              lg:py-16
            "
          >

            <div
              className="
                grid
                gap-10
                sm:grid-cols-2
                lg:grid-cols-[1.35fr_1fr_1fr_1fr]
                lg:gap-8
              "
            >

              {/* =================================================
                  BRAND
              ================================================= */}

              <div className="max-w-sm">

                <Link
                  to="/"
                  className="group inline-block"
                >

                  <h2
                    className="
                      font-serif
                      text-[2.65rem]
                      leading-none
                      tracking-[0.1em]
                      text-[#f3e8d7]
                      transition-colors
                      duration-300
                      group-hover:text-[#d9bc7a]
                      sm:text-5xl
                    "
                  >
                    {brandName}
                  </h2>

                </Link>


                {/* Brand divider */}

                <div className="mt-4 flex items-center gap-3">

                  <span className="h-px w-9 bg-[#c9a45c]" />

                  <span
                    className="
                      text-[8px]
                      font-medium
                      uppercase
                      tracking-[0.32em]
                      text-[#c9a45c]
                    "
                  >
                    Discover Exceptional Wines
                  </span>

                </div>


                {/* Description */}

                <p
                  className="
                    mt-5
                    max-w-sm
                    text-[13px]
                    leading-6
                    text-[#c8b6a8]
                    sm:text-sm
                  "
                >
                  Discover exceptional wines, crafted with patience,
                  character and a deep respect for the art of
                  winemaking.
                </p>


                {/* Tagline */}

                <p
                  className="
                    mt-3
                    font-serif
                    text-base
                    italic
                    text-[#d9bc7a]
                    sm:text-lg
                  "
                >
                  Taste the story.
                </p>


                {/* =================================================
                    SOCIAL LINKS
                ================================================= */}

                <div className="mt-6 flex items-center gap-2.5">

                  <SocialLink
                    label="Instagram"
                    href="#"
                  />

                  <SocialLink
                    label="Facebook"
                    href="#"
                  />

                  <SocialLink
                    label="Pinterest"
                    href="#"
                  />

                </div>

              </div>


              {/* =================================================
                  SHOP
              ================================================= */}

              <FooterColumn title="Shop">

                <FooterLink to="/shop">
                  All Wines
                </FooterLink>

                <FooterLink to="/shop?category=red">
                  Red Wine
                </FooterLink>

                <FooterLink to="/shop?category=white">
                  White Wine
                </FooterLink>

                <FooterLink to="/shop?category=rose">
                  Rosé
                </FooterLink>

                <FooterLink to="/shop?category=sparkling">
                  Sparkling
                </FooterLink>

              </FooterColumn>


              {/* =================================================
                  EXPLORE
              ================================================= */}

              <FooterColumn title="Explore">

                <FooterLink to="/collections">
                  Collections
                </FooterLink>

                <FooterLink to="/our-story">
                  Our Story
                </FooterLink>

                <FooterLink to="/wine-guide">
                  Wine Guide
                </FooterLink>

                <FooterLink to="/shop">
                  Featured Wines
                </FooterLink>

                <FooterLink to="/shop">
                  Wine Pairing
                </FooterLink>

              </FooterColumn>


              {/* =================================================
                  CUSTOMER
              ================================================= */}

              <FooterColumn title="Customer">

                <FooterLink to="/account">
                  My Account
                </FooterLink>

                <FooterLink to="/wishlist">
                  Wishlist
                </FooterLink>

                <FooterLink to="/cart">
                  Shopping Cart
                </FooterLink>

                <FooterLink to="/orders">
                  My Orders
                </FooterLink>

                <FooterLink to="/checkout">
                  Checkout
                </FooterLink>

              </FooterColumn>

            </div>

          </div>


          {/* ===================================================
              CONTACT / JOURNAL / NEWSLETTER
          =================================================== */}

          <div
            className="
              grid
              gap-8
              border-b
              border-[#c9a45c]/20
              py-9
              sm:grid-cols-2
              sm:gap-10
              sm:py-10
              lg:grid-cols-3
              lg:gap-12
            "
          >

            {/* =================================================
                CONTACT
            ================================================= */}

            <div>

              <p
                className="
                  text-[8px]
                  font-medium
                  uppercase
                  tracking-[0.3em]
                  text-[#c9a45c]
                "
              >
                Contact
              </p>

              <div className="mt-4 space-y-2.5">

                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="
                      block
                      text-sm
                      text-[#d7c5b7]
                      transition-colors
                      duration-300
                      hover:text-[#f3e8d7]
                    "
                  >
                    {contactEmail}
                  </a>
                )}

                {contactPhone && (
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                    className="
                      block
                      text-sm
                      text-[#d7c5b7]
                      transition-colors
                      duration-300
                      hover:text-[#f3e8d7]
                    "
                  >
                    {contactPhone}
                  </a>
                )}

              </div>

            </div>


            {/* =================================================
                JOURNAL
            ================================================= */}

            <div>

              <p
                className="
                  text-[8px]
                  font-medium
                  uppercase
                  tracking-[0.3em]
                  text-[#c9a45c]
                "
              >
                The Journal
              </p>

              <p
                className="
                  mt-4
                  max-w-sm
                  text-sm
                  leading-6
                  text-[#c8b6a8]
                "
              >
                Stories, tasting notes, pairing inspiration and
                insights from the world of wine.
              </p>

              <Link
                to="/wine-guide"
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-3
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.2em]
                  text-[#d9bc7a]
                  transition-colors
                  duration-300
                  hover:text-[#f3e8d7]
                "
              >
                Explore the Journal

                <span>→</span>

              </Link>

            </div>


            {/* =================================================
                STAY CONNECTED
            ================================================= */}

            <div>

              <p
                className="
                  text-[8px]
                  font-medium
                  uppercase
                  tracking-[0.3em]
                  text-[#c9a45c]
                "
              >
                Stay Connected
              </p>

              <p
                className="
                  mt-4
                  max-w-sm
                  text-sm
                  leading-6
                  text-[#c8b6a8]
                "
              >
                Discover new wines, tasting notes & exclusive
                offers.
              </p>

              <a
                href="/#newsletter"
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-3
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.2em]
                  text-[#d9bc7a]
                  transition-colors
                  duration-300
                  hover:text-[#f3e8d7]
                "
              >
                Join the Journal

                <span>→</span>

              </a>

            </div>

          </div>


          {/* ===================================================
              BOTTOM BAR
          =================================================== */}

          <div
            className="
              flex
              flex-col
              gap-4
              py-5
              text-[8px]
              uppercase
              tracking-[0.14em]
              text-[#9d8980]
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:py-6
            "
          >

            <p>
              © {currentYear} {brandName}. All rights reserved.
            </p>


            <div
              className="
                flex
                flex-wrap
                gap-x-5
                gap-y-2
              "
            >

              <a
                href="/"
                className="
                  transition-colors
                  duration-300
                  hover:text-[#d9bc7a]
                "
              >
                Privacy Policy
              </a>

              <a
                href="/"
                className="
                  transition-colors
                  duration-300
                  hover:text-[#d9bc7a]
                "
              >
                Terms & Conditions
              </a>

              <a
                href="/"
                className="
                  transition-colors
                  duration-300
                  hover:text-[#d9bc7a]
                "
              >
                Shipping Policy
              </a>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}


/* ================================================================
   FOOTER COLUMN
================================================================ */

function FooterColumn({ title, children }) {

  return (
    <div>

      <p
        className="
          text-[8px]
          font-medium
          uppercase
          tracking-[0.3em]
          text-[#c9a45c]
        "
      >
        {title}
      </p>

      <div className="mt-5 space-y-3">

        {children}

      </div>

    </div>
  );

}


/* ================================================================
   FOOTER LINK
================================================================ */

function FooterLink({ to, children }) {

  return (
    <Link
      to={to}
      className="
        group
        flex
        items-center
        gap-2
        text-[13px]
        text-[#c8b6a8]
        transition-colors
        duration-300
        hover:text-[#f3e8d7]
        sm:text-sm
      "
    >

      <span
        className="
          h-px
          w-0
          bg-[#c9a45c]
          transition-all
          duration-300
          group-hover:w-3
        "
      />

      <span>
        {children}
      </span>

    </Link>
  );

}


/* ================================================================
   SOCIAL LINK
================================================================ */

function SocialLink({ label, href }) {

  return (
    <a
      href={href}
      aria-label={label}
      className="
        flex
        h-8
        w-8
        items-center
        justify-center
        border
        border-[#c9a45c]/25
        text-[7px]
        uppercase
        tracking-[0.08em]
        text-[#c8b6a8]
        transition-all
        duration-300
        hover:border-[#c9a45c]
        hover:bg-[#c9a45c]/5
        hover:text-[#d9bc7a]
      "
    >
      {label.charAt(0)}
    </a>
  );

}


export default Footer;