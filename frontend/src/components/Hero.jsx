import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import "../styles/Hero.css";

/* ==========================================================
   CINEMATIC SCROLL-SCRUBBED HERO  (frame sequence on <canvas>)
   ----------------------------------------------------------
   How it works (same idea as the tea reference site):
     1. A short video is exported as many still frames.
     2. The hero is a very tall section (600vh) with a sticky
        stage that stays on screen while you scroll.
     3. Scroll position -> frame number -> drawn on a canvas.
        Scrolling down plays the video forward, scrolling up
        plays it backwards.
     4. Text captions fade in/out at chosen scroll positions.
     5. The LAST frame is also saved as /hero-frames/last.jpg
        and used as the still background for the rest of the
        homepage (see Home.jsx + HomeStill.css).

   TO SWAP THE VIDEO: replace the files in
   public/hero-frames/ and update the numbers below.
   ========================================================== */

/* ---------- SETTINGS YOU MAY EDIT ---------- */

const FRAME_COUNT = 132;                        // how many frame files you have

// How your frame files are named. Example: frame_0001.webp
//   FRAME_PREFIX = "frame_"   FRAME_DIGITS = 4   FRAME_START = 1   FRAME_EXT = "webp"
// If your files are named like ezgif-frame-001.png use:
//   FRAME_PREFIX = "ezgif-frame-"   FRAME_DIGITS = 3   FRAME_START = 1   FRAME_EXT = "png"
const FRAME_PREFIX = "frame_";
const FRAME_DIGITS = 3;                         // number of digits in the file number
const FRAME_START = 14;                          // number of the FIRST file (0 or 1)
const FRAME_EXT = "webp";                       // "webp", "jpg" or "png"

const frameSrc = (i) =>                         // i = 0 .. FRAME_COUNT-1
  `/hero-frames/${FRAME_PREFIX}${String(i + FRAME_START).padStart(FRAME_DIGITS, "0")}.${FRAME_EXT}`;
const LAST_STILL = "/hero-frames/last.jpg";     // final frame, also used as page background

// The video plays between 0 and VIDEO_END of the scroll;
// the last part of the scroll just holds the final frame.
const VIDEO_END = 0.94;

// How much of the picture you see.
//   1.00 = fill the whole screen (crops the top and bottom, zoomed in)
//   0.85 = zoomed out a little, thin dark bands appear left and right
//   0.70 = zoomed out a lot
const FRAME_ZOOM = 0.88;

// Captions. in/out are scroll progress values (0..1).
// side: "left" | "right" | "center"
const CAPTIONS = [
  {
    id: "journey",
    side: "right",
    eyebrow: "FROM VINE TO GLASS",
    lines: ["A journey", "worth savouring."],
    in: [0.17, 0.27],
    out: [0.4, 0.48],
  },
  {
    id: "vintage",
    side: "left",
    eyebrow: "",
    lines: ["Every vintage,", "a story told slowly."],
    in: [0.5, 0.58],
    out: [0.7, 0.77],
  },
  {
    id: "glass",
    side: "center",
    eyebrow: "",
    lines: ["Your glass", "is waiting."],
    in: [0.82, 0.9],
    out: [2, 3], // never leaves: it is the final scene (holds the button)
    button: true,
  },
];

/* ---------- helpers ---------- */

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// smoothstep: ease in AND out so nothing feels mechanical
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function Hero() {
  const { settings } = useSiteSettings();
  const brandName = settings?.brand_name || "VINEORA";

  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const introRef = useRef(null);
  const captionRefs = useRef([]);

  // Reduced motion: no scrubbing, just the final still + intro copy
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!hero || !stage || !canvas || reduceMotion) return undefined;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high"; // sharper scaling of the frames
    const images = new Array(FRAME_COUNT).fill(null);

    let headerH = 88;
    let stageH = 0;
    let heroH = 0;
    let target = 0;        // progress the scroll asks for
    let current = 0;       // progress we are actually showing (eased)
    let drawnIndex = -1;
    let rafId = null;
    let cancelled = false;

    /* ---------- frame loading ----------
       Load first + last frame at once, then every 8th frame,
       then the rest, so scrubbing works anywhere early on. */
    const loadFrame = (i) =>
      new Promise((resolve) => {
        if (images[i]) return resolve();
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          images[i] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frameSrc(i);
      });

    const loadOrder = () => {
      const seen = new Set();
      const order = [];
      const add = (i) => {
        if (i >= 0 && i < FRAME_COUNT && !seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      };
      add(0);
      add(FRAME_COUNT - 1);
      for (let i = 0; i < FRAME_COUNT; i += 8) add(i);
      for (let i = 0; i < FRAME_COUNT; i += 1) add(i);
      return order;
    };

    const startLoading = async () => {
      const order = loadOrder();
      let cursor = 0;
      const worker = async () => {
        while (!cancelled && cursor < order.length) {
          const i = order[cursor++];
          await loadFrame(i);
          // redraw if the frame we are waiting for just arrived
          if (!cancelled && Math.abs(i - frameIndexFor(current)) <= 4) {
            drawnIndex = -1;
            requestTick();
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
    };

    /* ---------- drawing ---------- */

    const frameIndexFor = (p) =>
      Math.round(clamp(p / VIDEO_END) * (FRAME_COUNT - 1));

    // closest frame that has already loaded
    const nearestLoaded = (idx) => {
      for (let d = 0; d < FRAME_COUNT; d += 1) {
        if (images[idx - d]) return idx - d;
        if (images[idx + d]) return idx + d;
      }
      return -1;
    };

    // "cover" fit scaled by FRAME_ZOOM, centred. Below 1 the picture
    // gets smaller than the screen, so we paint the page colour first
    // and feather the left/right edges of the picture into it.
    const drawFrame = (idx) => {
      const use = nearestLoaded(idx);
      if (use < 0) return;
      const img = images[use];
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * FRAME_ZOOM;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = (cw - w) / 2;
      const y = (ch - h) / 2;

      ctx.fillStyle = "#0a0506";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, x, y, w, h);

      if (FRAME_ZOOM < 1) {
        const feather = w * 0.1;
        if (x > 0) {
          const left = ctx.createLinearGradient(x, 0, x + feather, 0);
          left.addColorStop(0, "#0a0506");
          left.addColorStop(1, "rgba(10,5,6,0)");
          ctx.fillStyle = left;
          ctx.fillRect(x, 0, feather, ch);

          const right = ctx.createLinearGradient(x + w, 0, x + w - feather, 0);
          right.addColorStop(0, "#0a0506");
          right.addColorStop(1, "rgba(10,5,6,0)");
          ctx.fillStyle = right;
          ctx.fillRect(x + w - feather, 0, feather, ch);
        }
        if (y > 0) {
          const top = ctx.createLinearGradient(0, y, 0, y + feather);
          top.addColorStop(0, "#0a0506");
          top.addColorStop(1, "rgba(10,5,6,0)");
          ctx.fillStyle = top;
          ctx.fillRect(0, y, cw, feather);

          const bottom = ctx.createLinearGradient(0, y + h, 0, y + h - feather);
          bottom.addColorStop(0, "#0a0506");
          bottom.addColorStop(1, "rgba(10,5,6,0)");
          ctx.fillStyle = bottom;
          ctx.fillRect(0, y + h - feather, cw, feather);
        }
      }
      drawnIndex = idx;
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 769 ? 1.5 : 2);
      canvas.width = Math.round(stage.clientWidth * dpr);
      canvas.height = Math.round(stage.clientHeight * dpr);
      drawnIndex = -1;
    };

    /* ---------- layout + scroll ---------- */

    const measure = () => {
      const header = document.querySelector(".site-header");
      headerH = header ? header.offsetHeight : 88;
      // shared with HomeStill.css so the page background lines up exactly
      document.documentElement.style.setProperty("--hero-header-h", `${headerH}px`);
      stageH = stage.offsetHeight;
      heroH = hero.offsetHeight;
      sizeCanvas();
    };

    const readScroll = () => {
      const top = hero.getBoundingClientRect().top;
      const scrolled = headerH - top; // 0 when the hero sits under the header
      target = clamp(scrolled / Math.max(1, heroH - stageH));
    };

    /* ---------- apply progress to everything ---------- */

    const apply = (p) => {
      const idx = frameIndexFor(p);
      if (idx !== drawnIndex) drawFrame(idx);

      hero.style.setProperty("--p", p.toFixed(4));

      // intro copy leaves first
      const introOut = smooth(0.03, 0.14, p);
      if (introRef.current) {
        introRef.current.style.opacity = String(1 - introOut);
        introRef.current.style.transform =
          `translate3d(${(-introOut * 3).toFixed(2)}vw, ${(-introOut * 60).toFixed(1)}px, 0)`;
        introRef.current.style.visibility = introOut > 0.97 ? "hidden" : "visible";
      }

      // captions
      CAPTIONS.forEach((c, i) => {
        const el = captionRefs.current[i];
        if (!el) return;
        const enter = smooth(c.in[0], c.in[1], p);
        const leave = smooth(c.out[0], c.out[1], p);
        const o = enter * (1 - leave);
        el.style.opacity = o.toFixed(3);
        el.style.transform =
          `translate3d(0, ${((1 - enter) * 34 - leave * 34).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.style.pointerEvents = o > 0.6 ? "auto" : "none";
      });
    };

    // ease current -> target each frame: this is the "camera" feel
    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.0003) {
        current = target;
        apply(current);
        rafId = null;
        return;
      }
      current += diff * 0.12;
      apply(current);
      rafId = requestAnimationFrame(tick);
    };

    function requestTick() {
      if (rafId === null && !cancelled) rafId = requestAnimationFrame(tick);
    }

    const onScroll = () => {
      readScroll();
      requestTick();
    };

    const onResize = () => {
      measure();
      readScroll();
      requestTick();
    };

    measure();
    readScroll();
    current = target;
    apply(current);
    startLoading();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);

  return (
    <section
      ref={heroRef}
      className={`hero ${reduceMotion ? "hero--static" : ""}`}
    >
      <div ref={stageRef} className="hero-stage">
        {/* The video, drawn frame by frame */}
        {reduceMotion ? (
          <img className="hero-canvas" src={LAST_STILL} alt="" />
        ) : (
          <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        )}

        {/* Dark gradients so text stays readable over the footage */}
        <div className="hero-scrim" aria-hidden="true" />

        {/* ORIGINAL HERO COPY (unchanged content) */}
        <div ref={introRef} className="hero-intro">
          <div className="hero-content">
            <p className="hero-label">{brandName} WINES</p>

            <h1>
              DISCOVER THE
              <br />
              ART OF WINE
            </h1>

            <p className="hero-subtitle">Exceptional wines. Beautifully crafted.</p>

            <Link to="/shop" className="hero-button">
              EXPLORE WINES
            </Link>
          </div>
        </div>

        {/* SCROLL CAPTIONS */}
        {!reduceMotion &&
          CAPTIONS.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => (captionRefs.current[i] = el)}
              className={`hero-caption hero-caption--${c.side}`}
              style={{ opacity: 0, visibility: "hidden" }}
            >
              {c.eyebrow && <p className="hero-caption-eyebrow">{c.eyebrow}</p>}
              <p className="hero-caption-text">
                {c.lines.map((line, k) => (
                  <span key={k}>{line}</span>
                ))}
              </p>
              {c.button && (
                <Link to="/shop" className="hero-button hero-caption-button">
                  EXPLORE WINES
                </Link>
              )}
            </div>
          ))}

        {!reduceMotion && (
          <>
            <div className="hero-scroll-cue" aria-hidden="true">
              <span>SCROLL</span>
              <i />
            </div>
            <div className="hero-progress" aria-hidden="true" />
          </>
        )}
      </div>
    </section>
  );
}

export default Hero;
