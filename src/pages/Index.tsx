import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { OnboardingProvider, useOnboardingContext } from "@/contexts/OnboardingContext";
import { RamiOnboarding } from "@/components/RamiOnboarding";

const IndexContent = () => {
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

const Index = () => {
  return (
    <OnboardingProvider>
      <IndexContent />
    </OnboardingProvider>
  );
};

export default Index;
