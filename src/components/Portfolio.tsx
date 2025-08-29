import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

const Portfolio = () => {
  const { openOnboarding } = useOnboarding();
  // Mock data for portfolio - in real app this would come from API
  const events = [
    {
      id: 1,
      title: "Fiesta de Sofía - Ciudad de Profesiones",
      date: "15 de Octubre, 2024",
      location: "Jardín Las Flores, Oaxaca",
      guests: 25,
      services: ["Chef", "Arte", "Belleza", "Construcción"],
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&h=300&fit=crop",
      description: "Una fiesta increíble donde los niños exploraron diferentes profesiones en un ambiente lleno de diversión y aprendizaje."
    },
    {
      id: 2,
      title: "Cumpleaños de Diego - Aventura Creativa",
      date: "8 de Octubre, 2024",
      location: "Casa Familiar, Centro Histórico",
      guests: 18,
      services: ["Música", "Arte", "Fotografía"],
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=300&fit=crop",
      description: "Diego y sus amigos vivieron una experiencia única creando música, arte y capturando recuerdos especiales."
    },
    {
      id: 3,
      title: "Fiesta Temática de Emma - Mini Veterinarios",
      date: "2 de Octubre, 2024",
      location: "Parque Central, Oaxaca",
      guests: 22,
      services: ["Veterinario", "Chef", "Supermercado"],
      image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=500&h=300&fit=crop",
      description: "Emma cumplió su sueño de ser veterinaria por un día, junto con sus amigos en una experiencia educativa increíble."
    },
    {
      id: 4,
      title: "Celebración de Mateo - Constructor por un Día",
      date: "25 de Septiembre, 2024",
      location: "Salón de Eventos Villa Real",
      guests: 30,
      services: ["Construcción", "Chef", "Música", "Fotografía"],
      image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=300&fit=crop",
      description: "Mateo y sus invitados construyeron proyectos increíbles mientras disfrutaban de una fiesta llena de creatividad."
    },
    {
      id: 5,
      title: "Fiesta Artística de Luna - Pequeños Artistas",
      date: "18 de Septiembre, 2024",
      location: "Casa de la Cultura, Oaxaca",
      guests: 20,
      services: ["Arte", "Música", "Belleza"],
      image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500&h=300&fit=crop",
      description: "Luna exploró su lado artístico junto con sus amigos en una celebración llena de color y creatividad."
    },
    {
      id: 6,
      title: "Fiesta de Alejandro - Mini Chefs",
      date: "12 de Septiembre, 2024",
      location: "Jardín Privado, Col. Reforma",
      guests: 16,
      services: ["Chef", "Supermercado", "Fotografía"],
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop",
      description: "Alejandro y sus amigos cocinaron deliciosas recetas y aprendieron sobre alimentación saludable."
    }
  ];

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="group hover:shadow-hover transition-smooth cursor-pointer overflow-hidden bg-gradient-card border-0"
            >
              <div className="relative overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-spring"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90 text-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    {event.guests} niños
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
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.services.map((service, index) => (
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