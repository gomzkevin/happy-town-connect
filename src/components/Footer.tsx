import { Button } from "@/components/ui/button";
import { Heart, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">Japi Town</h3>
            <p className="text-background/80">
              Convirtiendo fiestas infantiles en ciudades de diversión donde los niños 
              viven la experiencia única de ser adultos por un día.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-background hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background hover:text-secondary">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
            <nav className="flex flex-col space-y-2">
              <a href="#inicio" className="text-background/80 hover:text-primary transition-smooth">
                Inicio
              </a>
              <a href="#servicios" className="text-background/80 hover:text-primary transition-smooth">
                Servicios
              </a>
              <a href="#fiestas" className="text-background/80 hover:text-primary transition-smooth">
                Nuestras Fiestas
              </a>
              <a href="#contacto" className="text-background/80 hover:text-primary transition-smooth">
                Contacto
              </a>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Servicios Populares</h4>
            <nav className="flex flex-col space-y-2">
              <span className="text-background/80">Estación Chef</span>
              <span className="text-background/80">Taller de Construcción</span>
              <span className="text-background/80">Estudio de Arte</span>
              <span className="text-background/80">Salón de Belleza</span>
              <span className="text-background/80">Hospital Veterinario</span>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-background/80">+52 951 123 4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-background/80">hola@japitown.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-background/80">Oaxaca de Juárez, Oaxaca</span>
              </div>
            </div>
            <Button variant="hero" size="sm" className="mt-4">
              Cotizar Ahora
            </Button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-2 text-background/80">
              <span>© {currentYear} Japi Town. Hecho con</span>
              <Heart className="h-4 w-4 text-primary fill-current" />
              <span>en Oaxaca, México.</span>
            </div>
            <div className="flex space-x-6 text-sm text-background/80">
              <a href="#" className="hover:text-primary transition-smooth">
                Términos de Servicio
              </a>
              <a href="#" className="hover:text-primary transition-smooth">
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;