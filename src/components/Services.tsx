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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Estaciones de Juego":
        return "bg-primary/10 text-primary";
      case "Talleres Creativos":
        return "bg-secondary/10 text-secondary";
      case "Gastronomía":
        return "bg-accent/10 text-accent";
      case "Servicios Profesionales":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Card 
      className="group hover:shadow-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
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
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <IconComponent className="w-16 h-16 text-primary/60" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge 
            variant="secondary" 
            className={`${getCategoryColor(service.category)} text-xs font-medium`}
          >
            {service.category}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight">{service.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="mb-4 text-sm leading-relaxed line-clamp-3">
          {service.description}
        </CardDescription>
        
        <div className="space-y-3">
          <div className="text-2xl font-bold text-primary">
            {service.price}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
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
  const { addService } = useServicesContext();
  const { services, loading } = useServices();
  const { openOnboarding } = useOnboarding();


  const handleServiceClick = (serviceId: string) => {
    navigate(`/servicio/${serviceId}`);
  };

  return (
    <section id="servicios" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestras increíbles estaciones temáticas diseñadas para crear momentos mágicos
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-8">Cargando servicios...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {services.map((service, index) => {
              return <ServiceCard key={service.id} service={service} onAddToCart={addService} onViewDetails={handleServiceClick} />;
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">
            ¿Listo para crear una fiesta inolvidable?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nuestro equipo te ayudará a diseñar la experiencia perfecta combinando los servicios ideales para tu evento especial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" onClick={openOnboarding}>
              Solicitar Cotización
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;