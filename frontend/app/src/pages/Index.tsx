import Navbar from "../components/ui/Navbar";
import HeroSection from "../components/ui/HeroSection";
import ServicesSection from "../components/ui/ServicesSection";
import DestinationsSection from "../components/ui/DestinationsSection";
import AboutSection from "../components/ui/AboutSection";
import TestimonialsSection from "../components/ui/TestimonialsSection";
import ContactSection from "../components/ui/ContactSection";
import Footer from "../components/ui/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <DestinationsSection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </main>
  );
};

export default Index;