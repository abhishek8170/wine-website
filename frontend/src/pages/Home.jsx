import Hero from "../components/Hero";
import WineTypes from "../components/WineTypes";
import BestSellers from "../components/BestSellers";
import ExploreCollections from "../components/ExploreCollections";
import OurStory from "../components/OurStorySection.jsx";
import WinePairing from "../components/WinePairing";
import FeaturedWines from "../components/FeaturedWines";
import CustomerReviews from "../components/CustomerReviews";
import WineGuide from "../components/WineGuideSection.jsx";
import Newsletter from "../components/Newsletter";
import "../styles/HomeStill.css";

function Home() {
  return (
    <main>
      {/* Scroll-scrubbed video hero */}
      <Hero />

      {/* Everything after the hero sits on the still (last video frame) */}
      <div className="home-still-bg">
        <WineTypes />

        <BestSellers />

        <ExploreCollections />

        <OurStory />

        <WinePairing />

        <FeaturedWines />

        <CustomerReviews />

        <WineGuide />

        <Newsletter />
      </div>
    </main>
  );
}

export default Home;
