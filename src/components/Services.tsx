import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useServices as useServicesContext } from "@/contexts/ServicesContext";
import { useServices } from "@/hooks/useServices";
import { useServiceImages } from "@/hooks/useServiceImages";
import { useOnboarding } from "@/hooks/useOnboarding";
import * as LucideIcons from "lucide-react";

const ServiceCard = ({ service, onAddToCart, onViewDetails }: { 
  service: any; 
  onAddToCart: (service: any) => void; 
  onViewDetails: (serviceId: string) => void; 
}) => {
  const { images } = useServiceImages(service.id);
  const IconComponent = (LucideIcons as any)[service.icon] || LucideIcons.Star;
  
  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <Card 
      className="group hover:shadow-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden border-0 bg-card rounded-2xl"
      onClick={() => onViewDetails(service.id)}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <img 
            src={primaryImage.image_url} 
            alt={primaryImage.alt_text || service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-accent flex items-center justify-center">
            <IconComponent className="w-14 h-14 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge 
            variant="secondary" 
            className="bg-background/90 text-foreground text-xs font-medium backdrop-blur-sm rounded-full"
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
        
        <div className="space-y-3">
          <div className="text-xl font-bold font-display text-foreground">
            {service.price}
          </div>
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
        </div>
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
