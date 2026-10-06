import { useEffect, useRef, useState } from "react";
import "../styles/WineTypes.css";

function WineTypes() {
  const sectionRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [wineTypes, setWineTypes] = useState([]);

  useEffect(() => {
    const section = sectionRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(section);
        }
      },
      {
        rootMargin: "0px 0px 500px 0px",  // start the animation before it is on screen
        threshold: 0,
      }
    );

    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "/api/categories"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();

        if (data.success) {
          setWineTypes(data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching wine categories:", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`wine-types ${visible ? "wine-types-visible" : ""}`}
    >
      <div className="wine-types-container">

        {/* =========================
            SECTION HEADING
        ========================== */}
        <div className="wine-types-heading">
          <p className="wine-types-label">
            EXPLORE OUR SELECTION
          </p>

          <h2>Shop by Wine Type</h2>

          <p className="wine-types-intro">
            Discover exceptional wines crafted for every taste and occasion.
          </p>

          <svg
            className="wine-divider-ornament"
            viewBox="0 0 120 40"
            aria-hidden="true"
          >
            <path
              d="M60 20
                 C48 5, 35 8, 25 20
                 C35 32, 48 35, 60 20
                 C72 5, 85 8, 95 20
                 C85 32, 72 35, 60 20
                 M60 7
                 L63 17
                 L73 20
                 L63 23
                 L60 33
                 L57 23
                 L47 20
                 L57 17 Z"
            />
          </svg>

          <span className="wine-divider-line"></span>
        </div>

        {/* =========================
            WINE TYPES
        ========================== */}
        <div className="wine-types-grid">
          {wineTypes.slice(0, 4).map((wine, index) => (
            <a
              href={`/shop?category=${wine.slug}`}
              className="wine-type-card"
              style={{ "--card-index": index }}
              key={wine.id}
            >
              <img
                src={wine.image_url}
                alt={wine.name}
              />

              <div className="wine-type-overlay"></div>

              <div className="wine-type-content">
                <p>{wine.description}</p>

                <h3>{wine.name}</h3>

                <span>Explore →</span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}

export default WineTypes;