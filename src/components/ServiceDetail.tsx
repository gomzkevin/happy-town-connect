import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Check, Clock, Users, MapPin, Calendar } from "lucide-react";
import { servicesData } from "@/data/services";
import { useServices } from "@/contexts/ServicesContext";
import { useState } from "react";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addService, selectedServices } = useServices();
  const [isAdded, setIsAdded] = useState(false);

  const service = servicesData.find(s => s.id === id);
  
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Servicio no encontrado</h1>
          <Button onClick={() => navigate('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const isSelected = selectedServices.some(item => item.service.id === service.id);
  const IconComponent = service.icon;

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

  const handleAddService = () => {
    addService(service);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{service.title}</h1>
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <IconComponent className="h-24 w-24 text-primary/50" />
              </div>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {service.detailedDescription}
                </p>
                <h4 className="font-semibold mb-4">¿Qué incluye?</h4>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{service.price}</CardTitle>
                  <span className="text-sm text-muted-foreground">MXN por fiesta</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleAddService}
                  className="w-full gap-2"
                  variant={isSelected ? "secondary" : "default"}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      ¡Agregado!
                    </>
                  ) : isSelected ? (
                    <>
                      <Plus className="h-4 w-4" />
                      Agregar Otro
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Agregar a Cotización
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/#servicios')}
                    className="w-full"
                  >
                    Ver Todos los Servicios
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles del Servicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Duración</div>
                    <div className="text-sm text-muted-foreground">{service.duration}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Participantes</div>
                    <div className="text-sm text-muted-foreground">
                      Hasta {service.maxParticipants} niños
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Edad</div>
                    <div className="text-sm text-muted-foreground">{service.ageRange}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Espacio Requerido</div>
                    <div className="text-sm text-muted-foreground">{service.spaceRequirement}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;