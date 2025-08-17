import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const Contact = () => {
  return (
    <section id="contacto" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            ¿Necesitas <span className="text-gradient">contactarnos</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Estamos aquí para resolver todas tus dudas y ayudarte a crear la fiesta perfecta.
            Contáctanos por el medio que prefieras.
          </p>
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Teléfono
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">+52 951 123 4567</p>
              <p className="text-sm text-muted-foreground mt-1">Disponible de 9:00 AM a 7:00 PM</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-secondary" />
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">+52 951 123 4567</p>
              <Button variant="outline" size="sm" className="mt-2">
                Enviar Mensaje
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">hola@japitown.com</p>
              <p className="text-sm text-muted-foreground mt-1">Respuesta en 24 horas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Oaxaca de Juárez, Oaxaca</p>
              <p className="text-sm text-muted-foreground mt-1">Servicio a domicilio en toda la ciudad</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lun - Vie:</span>
                  <span>9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sábados:</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domingos:</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">¿Listo para cotizar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Usa nuestro asistente Rami o selecciona servicios específicos
              </p>
              <div className="space-y-2">
                <Button variant="default" size="sm" className="w-full" onClick={() => {
                  const heroSection = document.querySelector('section');
                  heroSection?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Cotizar Mi Fiesta
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  const servicesSection = document.getElementById('servicios');
                  servicesSection?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Ver Servicios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;