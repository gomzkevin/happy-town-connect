import { Button } from "@/components/ui/button";
import { ArrowDown, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useOnboarding } from "@/hooks/useOnboarding";

const Hero = () => {
  const { openOnboarding } = useOnboarding();
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Niños disfrutando en una fiesta temática de japitown"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-soft">
              <Star className="h-4 w-4 fill-current" />
              #1 en Fiestas Temáticas en Oaxaca
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Convierte tu fiesta en una{" "}
              <span className="text-gradient">ciudad de diversión</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              En japitown, los niños viven la experiencia única de ser adultos por un día. 
              Chef, constructor, artista... ¡Que elijan su aventura profesional favorita!
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">200+</div>
                <div className="text-sm text-muted-foreground">Fiestas Realizadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">15+</div>
                <div className="text-sm text-muted-foreground">Profesiones Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Diversión Garantizada</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg"
                onClick={openOnboarding}
              >
                Cotizar Mi Fiesta
              </Button>
              <Button 
                variant="purple" 
                size="lg" 
                className="text-lg"
                onClick={() => {
                  const servicesSection = document.getElementById('services');
                  if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Ver Nuestras Fiestas
              </Button>
            </div>
          </div>

          {/* Right side - could be testimonial or another element */}
          <div className="hidden lg:block">
            <div className="bg-gradient-card p-8 rounded-2xl shadow-soft">
              <blockquote className="text-lg italic text-foreground mb-4">
                "La fiesta de mi hija fue increíble. Los niños no querían irse y 
                siguen hablando de cuando fueron chefs por un día. ¡Definitivamente 
                volveremos a contratar japitown!"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full"></div>
                <div>
                  <div className="font-semibold">María González</div>
                  <div className="text-sm text-muted-foreground">Mamá de Sofía (6 años)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-6 w-6 text-primary" />
      </div>
    </section>
  );
};

export default Hero;