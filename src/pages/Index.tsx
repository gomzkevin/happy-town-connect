import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useOnboardingContext } from "@/contexts/OnboardingContext";
import { RamiOnboarding } from "@/components/RamiOnboarding";

const Index = () => {
  const { showOnboarding, closeOnboarding } = useOnboardingContext();
  
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <HowItWorks />
      <Services />
      <Portfolio />
      <Contact />
      <Footer />
      <RamiOnboarding 
        isOpen={showOnboarding} 
        onClose={closeOnboarding} 
      />
    </div>
  );
};

export default Index;
