import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { motion } from "framer-motion";

const Contact = () => {
  const { openOnboarding } = useOnboarding();

  const cards = [
    {
      icon: Phone,
      title: "Teléfono",
      content: (
        <>
          <p className="text-muted-foreground">+52 951 123 4567</p>
          <p className="text-sm text-muted-foreground/70 mt-1">9:00 AM - 7:00 PM</p>
        </>
      ),
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      content: (
        <>
          <p className="text-muted-foreground">+52 951 123 4567</p>
          <Button variant="outline" size="sm" className="mt-2">
            Enviar Mensaje
          </Button>
        </>
      ),
    },
    {
      icon: Mail,
      title: "Email",
      content: (
        <>
          <p className="text-muted-foreground">hola@japitown.com</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Respuesta en 24 horas</p>
        </>
      ),
    },
    {
      icon: MapPin,
      title: "Ubicación",
      content: (
        <>
          <p className="text-muted-foreground">Oaxaca de Juárez, Oaxaca</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Servicio a domicilio</p>
        </>
      ),
    },
    {
      icon: Clock,
      title: "Horarios",
      content: (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lun - Vie:</span>
            <span className="text-foreground">9:00 - 19:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sáb:</span>
            <span className="text-foreground">9:00 - 18:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dom:</span>
            <span className="text-foreground">10:00 - 16:00</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="contacto" className="py-16 sm:py-24 bg-accent/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">
            Contacto
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Estamos aquí para resolver todas tus dudas y ayudarte a crear la fiesta perfecta.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto" stagger={0.08}>
          {cards.map((card) => (
            <StaggerItem key={card.title}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="border-0 bg-card shadow-soft rounded-2xl h-full hover:shadow-hover transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display text-base">
                      <card.icon className="h-5 w-5 text-muted-foreground" />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{card.content}</CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}

          {/* CTA Card */}
          <StaggerItem>
            <Card className="border-0 bg-card shadow-soft rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="font-display text-base">¿Listo para cotizar?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Usa nuestro asistente o selecciona servicios específicos
                </p>
                <div className="space-y-2">
                  <Button variant="hero" size="sm" className="w-full" onClick={openOnboarding}>
                    Cotizar Mi Fiesta
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    const el = document.getElementById('servicios');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Ver Servicios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
};

export default Contact;
