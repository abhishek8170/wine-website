import "../styles/Hero.css";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <p className="hero-label">
          VINEORA WINES
        </p>

        <h1>
          DISCOVER THE
          <br />
          ART OF WINE
        </h1>

        <p className="hero-subtitle">
          Exceptional wines. Beautifully crafted.
        </p>

        <Link to="/shop" className="hero-button">
          EXPLORE WINES
        </Link>
      </div>
    </section>
  );
}

export default Hero;