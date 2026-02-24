import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import logo24 from "@/assets/Logo-24.png";
import iconFlower from "@/assets/Iconos-14.png";
import iconCloud from "@/assets/Iconos-15.png";
import iconStar from "@/assets/Iconos-17.png";
import iconSpiral from "@/assets/Iconos-13.png";
import iconSun from "@/assets/Iconos-19.png";
import iconWave from "@/assets/Iconos-20.png";

const Hero = () => {
  const { openOnboarding } = useOnboarding();
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Floating decorative elements */}
      <img src={iconFlower} alt="" className="absolute top-20 right-[10%] w-16 h-16 opacity-60 animate-float pointer-events-none" aria-hidden="true" />
      <img src={iconCloud} alt="" className="absolute top-32 left-[8%] w-20 h-20 opacity-50 animate-float-slow pointer-events-none" aria-hidden="true" />
      <img src={iconStar} alt="" className="absolute bottom-32 right-[15%] w-14 h-14 opacity-40 animate-float pointer-events-none" aria-hidden="true" />
      <img src={iconSpiral} alt="" className="absolute top-[40%] left-[5%] w-12 h-12 opacity-30 animate-float-slow pointer-events-none" aria-hidden="true" />
      <img src={iconSun} alt="" className="absolute bottom-20 left-[12%] w-16 h-16 opacity-40 animate-float pointer-events-none" aria-hidden="true" />
      <img src={iconWave} alt="" className="absolute top-[60%] right-[5%] w-14 h-14 opacity-30 animate-float-slow pointer-events-none" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={logo24} 
              alt="Japitown" 
              className="h-40 sm:h-52 lg:h-64 w-auto"
            />
          </div>

          {/* Tagline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Experiencias únicas donde los niños viven la aventura de ser{" "}
            <span className="text-foreground font-bold">adultos por un día</span>.
            Chef, constructor, artista... ¡Que elijan su profesión favorita!
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-10 justify-center pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold font-display text-foreground">200+</div>
              <div className="text-sm text-muted-foreground font-medium">Fiestas Realizadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold font-display text-foreground">15+</div>
              <div className="text-sm text-muted-foreground font-medium">Estaciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold font-display text-foreground">100%</div>
              <div className="text-sm text-muted-foreground font-medium">Diversión</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-base"
              onClick={openOnboarding}
            >
              Cotizar Mi Fiesta
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base"
              onClick={() => {
                const el = document.getElementById('servicios');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Ver Servicios
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Hero;
