import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { motion } from "framer-motion";
import logo24 from "@/assets/Logo-24.png";
import iconFlower from "@/assets/Iconos-14.png";
import iconCloud from "@/assets/Iconos-15.png";
import iconStar from "@/assets/Iconos-17.png";
import iconSpiral from "@/assets/Iconos-13.png";
import iconSun from "@/assets/Iconos-19.png";
import iconWave from "@/assets/Iconos-20.png";

const floatingIcons = [
  { src: iconFlower, className: "top-20 right-[10%] w-12 h-12 sm:w-16 sm:h-16", delay: 0 },
  { src: iconCloud, className: "top-32 left-[8%] w-14 h-14 sm:w-20 sm:h-20", delay: 0.2 },
  { src: iconStar, className: "bottom-32 right-[15%] w-10 h-10 sm:w-14 sm:h-14", delay: 0.4 },
  { src: iconSpiral, className: "top-[40%] left-[5%] w-10 h-10 sm:w-12 sm:h-12", delay: 0.3 },
  { src: iconSun, className: "bottom-20 left-[12%] w-12 h-12 sm:w-16 sm:h-16", delay: 0.5 },
  { src: iconWave, className: "top-[60%] right-[5%] w-10 h-10 sm:w-14 sm:h-14", delay: 0.1 },
];

const Hero = () => {
  const { openOnboarding } = useOnboarding();

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Floating decorative elements */}
      {floatingIcons.map((icon, i) => (
        <motion.img
          key={i}
          src={icon.src}
          alt=""
          className={`absolute opacity-40 pointer-events-none ${icon.className}`}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.4, scale: 1, y: [0, -12, 0] }}
          transition={{
            opacity: { duration: 0.8, delay: icon.delay + 0.5 },
            scale: { duration: 0.8, delay: icon.delay + 0.5 },
            y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <div className="space-y-6 sm:space-y-8">
          {/* Logo */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <img
              src={logo24}
              alt="Japitown"
              className="h-32 sm:h-44 lg:h-56 w-auto"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Estaciones temáticas donde viven la aventura de ser{" "}
            <span className="text-foreground font-bold">adultos por un día</span>,
            y talleres creativos donde pintan, moldean y crean con sus manos.
          </motion.p>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-8 sm:gap-10 justify-center pt-2 sm:pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {[
              { value: "✨", label: "Eventos Únicos" },
              { value: "15+", label: "Estaciones" },
              { value: "100%", label: "Diversión" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold font-display text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
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
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 0.5, delay: 1.2 },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </motion.div>
    </section>
  );
};

export default Hero;
