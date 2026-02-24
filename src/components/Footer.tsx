import { Button } from "@/components/ui/button";
import { Heart, Phone, Mail, MapPin, Instagram, MessageCircle } from "lucide-react";
import logo22 from "@/assets/Logo-22.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <img src={logo22} alt="Japitown" className="h-10 w-auto brightness-200" />
            <p className="text-background/60 text-sm leading-relaxed">
              Fiestas infantiles temáticas donde los niños 
              viven la experiencia única de ser adultos por un día.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="text-background/60 hover:text-background h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/60 hover:text-background h-8 w-8">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background/40">Enlaces</h4>
            <nav className="flex flex-col space-y-2">
              <a href="#inicio" className="text-background/60 hover:text-background transition-smooth text-sm">
                Inicio
              </a>
              <a href="#servicios" className="text-background/60 hover:text-background transition-smooth text-sm">
                Servicios
              </a>
              <a href="#fiestas" className="text-background/60 hover:text-background transition-smooth text-sm">
                Nuestras Fiestas
              </a>
              <a href="#contacto" className="text-background/60 hover:text-background transition-smooth text-sm">
                Contacto
              </a>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background/40">Servicios</h4>
            <nav className="flex flex-col space-y-2">
              <span className="text-background/60 text-sm">Estación Chef</span>
              <span className="text-background/60 text-sm">Taller de Construcción</span>
              <span className="text-background/60 text-sm">Estudio de Arte</span>
              <span className="text-background/60 text-sm">Salón de Belleza</span>
              <span className="text-background/60 text-sm">Hospital Veterinario</span>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background/40">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-background/40" />
                <span className="text-background/60 text-sm">+52 951 123 4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-background/40" />
                <span className="text-background/60 text-sm">hola@japitown.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-background/40" />
                <span className="text-background/60 text-sm">Oaxaca de Juárez, Oaxaca</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-background/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-1.5 text-background/40 text-sm">
              <span>© {currentYear} Japitown. Hecho con</span>
              <Heart className="h-3 w-3 fill-current" />
              <span>en Oaxaca.</span>
            </div>
            <div className="flex space-x-6 text-xs text-background/40">
              <a href="#" className="hover:text-background/60 transition-smooth">
                Términos
              </a>
              <a href="#" className="hover:text-background/60 transition-smooth">
                Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
