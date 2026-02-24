import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useServices as useServicesContext } from "@/contexts/ServicesContext";
import { useServices } from "@/hooks/useServices";
import { useOnboarding } from "@/hooks/useOnboarding";

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

const ServiceCard = ({ service, onAddToCart, onViewDetails }: { 
  service: any; 
  onAddToCart: (service: any) => void; 
  onViewDetails: (serviceId: string) => void; 
}) => {
  const iconSrc = serviceIconMap[service.id];

  const isCreativeWorkshop = service.category === "Talleres Creativos";
  const badgeClasses = isCreativeWorkshop
    ? "bg-secondary/20 text-secondary-foreground border-secondary/30 backdrop-blur-sm rounded-full"
    : "bg-japitown-orange/20 text-foreground border-japitown-orange/30 backdrop-blur-sm rounded-full";

  return (
    <Card 
      className="group hover:shadow-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden border-0 bg-card rounded-2xl"
      onClick={() => onViewDetails(service.id)}
    >
      {/* Icon Section */}
      <div className="relative h-48 overflow-hidden bg-accent/50 flex items-center justify-center">
        <img 
          src={iconSrc} 
          alt={service.title} 
          className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300" 
        />
        <div className="absolute top-3 left-3">
          <Badge 
            variant="outline" 
            className={badgeClasses}
          >
            {service.category}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight font-display">{service.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="mb-4 text-sm leading-relaxed line-clamp-3">
          {service.description}
        </CardDescription>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full hover:bg-foreground hover:text-background transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(service);
          }}
        >
          Agregar a Cotización
        </Button>
      </CardContent>
    </Card>
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
    <section id="servicios" className="py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
            Nuestros Servicios
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestras increíbles estaciones temáticas diseñadas para crear momentos mágicos
          </p>
          
          {/* Services Counter */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {selectedServices.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-foreground/10 text-foreground px-4 py-2 rounded-full text-sm font-medium">
                <span>{selectedServices.length} servicios seleccionados</span>
                {getRemainingToMinimum() > 0 && (
                  <span className="text-japitown-orange">• Faltan {getRemainingToMinimum()}</span>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              <strong>Mínimo: 3 servicios</strong> para solicitar cotización
            </p>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando servicios...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} onAddToCart={addService} onViewDetails={handleServiceClick} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center bg-card rounded-3xl p-8 sm:p-10 shadow-soft max-w-3xl mx-auto">
          <h3 className="text-2xl font-display font-bold mb-3 text-foreground">
            ¿Listo para una fiesta inolvidable?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Nuestro equipo te ayudará a diseñar la experiencia perfecta para tu evento especial.
          </p>
          <Button variant="hero" size="lg" onClick={openOnboarding}>
            Solicitar Cotización
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
