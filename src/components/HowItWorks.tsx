import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, PartyPopper } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import iconFlowerOrange from "@/assets/Iconos-16.png";

const HowItWorks = () => {
  const { openOnboarding } = useOnboarding();
  const steps = [
    {
      icon: MessageCircle,
      number: "01",
      title: "Cuéntanos tu visión",
      description: "Comparte con nosotros los sueños y preferencias de tu pequeño. ¿Quiere ser chef, constructor, artista? ¡Lo hacemos realidad!",
    },
    {
      icon: Calendar,
      number: "02",
      title: "Planificamos juntos",
      description: "Nuestro equipo diseña la experiencia perfecta, seleccionando servicios y creando un plan personalizado para la fecha especial.",
    },
    {
      icon: PartyPopper,
      number: "03",
      title: "¡A disfrutar!",
      description: "El día de la fiesta, transformamos tu espacio en Japitown. Los niños vivirán aventuras increíbles que recordarán para siempre.",
    }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative accent */}
      <img src={iconFlowerOrange} alt="" className="absolute -top-8 -right-8 w-32 h-32 opacity-10 pointer-events-none" aria-hidden="true" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
            ¿Cómo funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En tres simples pasos, convertimos la fiesta de tu pequeño en una experiencia 
            mágica que superará todas las expectativas.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-hover transition-smooth border-0 bg-card text-center rounded-2xl"
              >
                <CardContent className="p-8 space-y-5">
                  <div className="text-5xl font-display font-bold text-border group-hover:text-primary transition-smooth">
                    {step.number}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto group-hover:scale-110 transition-spring">
                    <IconComponent className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-card p-8 sm:p-10 rounded-3xl shadow-soft max-w-2xl mx-auto">
            <h3 className="text-2xl font-display font-bold mb-3 text-foreground">¿Listos para la aventura?</h3>
            <p className="text-muted-foreground mb-6">
              Cada fiesta es única y diseñada especialmente para hacer realidad los sueños de tu pequeño.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" onClick={openOnboarding}>
                Iniciar Planificación
              </Button>
              <Button variant="outline" size="lg" onClick={() => {
                const el = document.getElementById('fiestas');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Ver Ejemplos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
