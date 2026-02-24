import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useServices as useServicesContext } from "@/contexts/ServicesContext";
import { useServices } from "@/hooks/useServices";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { motion } from "framer-motion";

import icono01 from "@/assets/Iconos-01.png";
import icono02 from "@/assets/Iconos-02.png";
import icono03 from "@/assets/Iconos-03.png";
import icono04 from "@/assets/Iconos-04.png";
import icono05 from "@/assets/Iconos-05.png";
import icono06 from "@/assets/Iconos-06.png";
import icono07 from "@/assets/Iconos-07.png";
import icono08 from "@/assets/Iconos-08.png";
import icono09 from "@/assets/Iconos-09.png";
import icono10 from "@/assets/Iconos-10.png";
import icono11 from "@/assets/Iconos-11.png";
import icono12 from "@/assets/Iconos-12.png";

const serviceIconMap: Record<string, string> = {
  pesca: icono01,
  caballetes: icono02,
  hamburgueseria: icono03,
  boliche: icono04,
  supermercado: icono05,
  spa: icono06,
  veterinaria: icono07,
  "decora-cupcake": icono08,
  "haz-pulsera": icono09,
  yesitos: icono10,
  construccion: icono11,
  guarderia: icono12,
};

const ServiceCard = ({ service, onAddToCart, onViewDetails, isInCart }: { 
  service: any; 
  onAddToCart: (service: any) => void; 
  onViewDetails: (serviceId: string) => void;
  isInCart: boolean;
}) => {
  const iconSrc = serviceIconMap[service.id];

  const isCreativeWorkshop = service.category === "Talleres Creativos";
  const badgeClasses = isCreativeWorkshop
    ? "bg-japitown-green-tag/20 text-foreground border-japitown-green-tag/40 backdrop-blur-sm rounded-full"
    : "bg-japitown-blue/20 text-foreground border-japitown-blue/40 backdrop-blur-sm rounded-full";

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className="group cursor-pointer overflow-hidden border-0 bg-card rounded-2xl hover:shadow-hover transition-shadow duration-300 h-full"
        onClick={() => onViewDetails(service.id)}
      >
        <div className="relative h-40 sm:h-48 overflow-hidden bg-accent/50 flex items-center justify-center">
          <motion.img 
            src={iconSrc} 
            alt={service.title} 
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            loading="lazy"
            whileHover={{ scale: 1.15, rotate: 3 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          />
          <div className="absolute top-3 left-3">
            <Badge variant="outline" className={badgeClasses}>
              {service.category}
            </Badge>
          </div>
          {isInCart && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-secondary flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg leading-tight font-display">{service.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="mb-4 text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
            {service.description}
          </CardDescription>
          
          <Button 
            variant={isInCart ? "secondary" : "outline"}
            size="sm" 
            className={`w-full transition-all duration-300 ${
              isInCart 
                ? '' 
                : 'hover:bg-foreground hover:text-background'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(service);
            }}
          >
            {isInCart ? '✓ Agregado' : 'Agregar a Cotización'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Services = () => {
  const navigate = useNavigate();
  const { addService, selectedServices, getRemainingToMinimum } = useServicesContext();
  const { services, loading } = useServices();
  const { openOnboarding } = useOnboarding();

  const handleServiceClick = (serviceId: string) => {
    navigate(`/servicio/${serviceId}`);
  };

  return (
    <section id="servicios" className="py-16 sm:py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
            Nuestros Servicios
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestras increíbles estaciones temáticas diseñadas para crear momentos mágicos
          </p>
          
          <div className="mt-6 flex flex-col items-center gap-3">
            {selectedServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-foreground/10 text-foreground px-4 py-2 rounded-full text-sm font-medium"
              >
                <span>{selectedServices.length} servicios seleccionados</span>
                {getRemainingToMinimum() > 0 && (
                  <span className="text-japitown-orange">• Faltan {getRemainingToMinimum()}</span>
                )}
              </motion.div>
            )}
            <p className="text-sm text-muted-foreground">
              <strong>Mínimo: 2 servicios</strong> para solicitar cotización
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando servicios...</div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-12" stagger={0.08}>
            {services.map((service) => (
              <StaggerItem key={service.id}>
                <ServiceCard 
                  service={service} 
                  onAddToCart={addService} 
                  onViewDetails={handleServiceClick}
                  isInCart={selectedServices.some(s => s.service.id === service.id)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <ScrollReveal delay={0.1}>
          <div className="text-center bg-card rounded-3xl p-6 sm:p-10 shadow-soft max-w-3xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-display font-bold mb-3 text-foreground">
              ¿Listo para una fiesta inolvidable?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-sm sm:text-base">
              Nuestro equipo te ayudará a diseñar la experiencia perfecta para tu evento especial.
            </p>
            <Button variant="hero" size="lg" onClick={openOnboarding}>
              Solicitar Cotización
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Services;
