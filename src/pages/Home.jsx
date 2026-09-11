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

function Home() {
  return (
    <main>
      <Hero />

      <WineTypes />

      <BestSellers />

      <ExploreCollections />

      <OurStory />

      <WinePairing />

      <FeaturedWines />

      <CustomerReviews />

      <WineGuide />

      <Newsletter />
    </main>
  );
}

export default Home;