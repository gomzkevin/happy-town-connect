import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEvents } from "@/hooks/useEvents";
import { useNavigate } from "react-router-dom";

const Portfolio = () => {
  const { openOnboarding } = useOnboarding();
  const { events, loading } = useEvents();
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha por confirmar';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getServiceColor = (service: string) => {
    const colors: { [key: string]: string } = {
      "Chef": "bg-orange-100 text-orange-800",
      "Arte": "bg-purple-100 text-purple-800",
      "Belleza": "bg-pink-100 text-pink-800",
      "Construcción": "bg-yellow-100 text-yellow-800",
      "Música": "bg-blue-100 text-blue-800",
      "Fotografía": "bg-green-100 text-green-800",
      "Veterinario": "bg-emerald-100 text-emerald-800",
      "Supermercado": "bg-indigo-100 text-indigo-800"
    };
    return colors[service] || "bg-gray-100 text-gray-800";
  };

  return (
    <section id="fiestas" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Nuestras <span className="text-gradient">Fiestas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Descubre la magia que hemos creado en cada celebración. Cada fiesta es única 
            y diseñada especialmente para hacer realidad los sueños de cada niño.
          </p>
        </div>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="text-center py-8">Cargando eventos...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="group hover:shadow-hover transition-smooth cursor-pointer overflow-hidden bg-gradient-card border-0"
                onClick={() => navigate(`/evento/${event.id}`)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={event.featured_image_url || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&h=300&fit=crop'}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-spring"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-background/90 text-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {event.guest_count || 0} niños
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-smooth">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.location || 'Ubicación por confirmar'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(event.services || []).map((service, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`text-xs ${getServiceColor(service)}`}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-card p-8 rounded-2xl shadow-soft max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">¿Quieres ver más fiestas increíbles?</h3>
            <p className="text-muted-foreground mb-6">
              Tenemos muchas más celebraciones que mostrar. Cada una con su propia magia y momentos especiales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero">
                Ver Todas las Fiestas
              </Button>
              <Button variant="outline" onClick={openOnboarding}>
                Planear Mi Fiesta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;