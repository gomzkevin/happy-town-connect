import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useServices as useServicesContext } from "@/contexts/ServicesContext";
import { useServices } from "@/hooks/useServices";
import { useOnboarding } from "@/hooks/useOnboarding";
import * as LucideIcons from "lucide-react";

const Services = () => {
  const navigate = useNavigate();
  const { addService } = useServicesContext();
  const { services, loading } = useServices();
  const { openOnboarding } = useOnboarding();

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
    <section id="services" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Nuestros <span className="text-gradient">Servicios</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Cada estación requiere un espacio mínimo de 2x2 metros. Combina diferentes servicios 
            para crear la experiencia perfecta para tu pequeño y sus invitados.
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-8">Cargando servicios...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {services.map((service, index) => {
              const IconComponent = (LucideIcons as any)[service.icon] || LucideIcons.Star;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-hover transition-smooth cursor-pointer bg-gradient-card border-0"
                onClick={() => navigate(`/servicio/${service.id}`)}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-spring">
                    <IconComponent className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                    <CardTitle className="text-lg group-hover:text-primary transition-smooth">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {service.description}
                  </CardDescription>
                  <div className="pt-2 space-y-3">
                    <div>
                      <span className="text-lg font-bold text-primary">{service.price}</span>
                      <p className="text-xs text-muted-foreground">MXN por fiesta</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        addService(service);
                      }}
                    >
                      Agregar a Cotización
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-card p-8 rounded-2xl shadow-soft max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">¿Listo para crear la fiesta perfecta?</h3>
            <p className="text-muted-foreground mb-6">
              Combina los servicios que más le gusten a tu pequeño y recibe una cotización personalizada.
            </p>
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