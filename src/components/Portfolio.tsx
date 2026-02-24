import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEvents } from "@/hooks/useEvents";
import { useNavigate } from "react-router-dom";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { motion } from "framer-motion";

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

  return (
    <section id="fiestas" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
            Nuestras Fiestas
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre la magia que hemos creado en cada celebración. Cada fiesta es única 
            y diseñada especialmente para cada niño.
          </p>
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando eventos...</div>
        ) : (
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12" stagger={0.12}>
            {events.map((event) => (
              <StaggerItem key={event.id}>
                <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card 
                  className="group cursor-pointer overflow-hidden border-0 bg-card rounded-2xl h-full hover:shadow-hover transition-shadow duration-300"
                  onClick={() => navigate(`/evento/${event.id}`)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={event.featured_image_url || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&h=300&fit=crop'}
                      alt={event.title}
                      className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-spring"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-sm rounded-full">
                        <Users className="h-3 w-3 mr-1" />
                        {event.guest_count || 0} niños
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-base sm:text-lg mb-1.5 sm:mb-2 group-hover:text-secondary transition-smooth">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        {formatDate(event.event_date)}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        {event.location || 'Ubicación por confirmar'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(event.services || []).slice(0, 3).map((service, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-[10px] sm:text-xs rounded-full"
                        >
                          {service}
                        </Badge>
                      ))}
                      {(event.services || []).length > 3 && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs rounded-full">
                          +{(event.services || []).length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <ScrollReveal delay={0.1}>
          <div className="text-center">
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-soft max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-display font-bold mb-3 text-foreground">¿Quieres ver más?</h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                Tenemos muchas más celebraciones que mostrar. Cada una con su propia magia y momentos especiales.
              </p>
              <Button variant="hero" onClick={openOnboarding}>
                Planear Mi Fiesta
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Portfolio;
