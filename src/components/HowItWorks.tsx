import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, PartyPopper } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: MessageCircle,
      title: "1. Cuéntanos tu Visión",
      description: "Comparte con nosotros los sueños y preferencias de tu pequeño. ¿Quiere ser chef, constructor, artista? ¡Lo hacemos realidad!",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Calendar,
      title: "2. Planificamos Juntos",
      description: "Nuestro equipo diseña la experiencia perfecta, seleccionando servicios y creando un plan personalizado para la fecha especial.",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: PartyPopper,
      title: "3. ¡A Disfrutar!",
      description: "El día de la fiesta, transformamos tu espacio en japitown. Los niños vivirán aventuras increíbles que recordarán para siempre.",
      color: "bg-accent/10 text-accent"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            ¿Cómo <span className="text-gradient">Funciona</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            En tres simples pasos, convertimos la fiesta de tu pequeño en una experiencia 
            mágica que superará todas las expectativas.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card 
                key={index}
                className="relative group hover:shadow-hover transition-smooth bg-gradient-card border-0 text-center"
              >
                {/* Connection Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-primary transform -translate-y-1/2 z-10">
                    <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}

                <CardContent className="p-8 space-y-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${step.color} group-hover:scale-110 transition-spring`}>
                    <IconComponent className="h-10 w-10" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-smooth">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-card p-8 rounded-2xl shadow-soft max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">¿Listos para comenzar la aventura?</h3>
            <p className="text-muted-foreground mb-6">
              Cada fiesta es única y diseñada especialmente para hacer realidad los sueños de tu pequeño. 
              ¡Comencemos a planificar juntos!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg">
                Iniciar Planificación
              </Button>
              <Button variant="outline" size="lg">
                Ver Ejemplos de Fiestas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;