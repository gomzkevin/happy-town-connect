import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { servicesData } from "@/data/services";
import { useServices } from "@/contexts/ServicesContext";

const Services = () => {
  const navigate = useNavigate();
  const { addService } = useServices();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Estación":
        return "bg-primary/10 text-primary";
      case "Taller":
        return "bg-secondary/10 text-secondary";
      case "Spa":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <section id="servicios" className="py-20 bg-muted/30">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {servicesData.map((service, index) => {
            const IconComponent = service.icon;
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

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-card p-8 rounded-2xl shadow-soft max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">¿Listo para crear la fiesta perfecta?</h3>
            <p className="text-muted-foreground mb-6">
              Combina los servicios que más le gusten a tu pequeño y recibe una cotización personalizada.
            </p>
            <Button variant="hero" size="lg">
              Solicitar Cotización
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;