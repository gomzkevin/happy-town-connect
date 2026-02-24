import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/Logo-25.png";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { RamiOnboarding } from "./RamiOnboarding";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { showOnboarding, openOnboarding, closeOnboarding } = useOnboarding();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { name: "Inicio", href: "#inicio" },
    { name: "Servicios", href: "#servicios" },
    { name: "Nuestras Fiestas", href: "#fiestas" },
    { name: "Contacto", href: "#contacto" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-background/90 backdrop-blur-lg z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <img src={logo} alt="Japitown - Eventos Infantiles" className="h-8 sm:h-10 w-auto" />
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground/70 hover:text-foreground transition-smooth font-medium text-sm tracking-wide"
              >
                {item.name}
              </a>
            ))}
            <Button variant="hero" size="sm" onClick={openOnboarding}>
              Cotizar Fiesta
            </Button>
            {user ? (
              <Link to="/admin">
                <Button variant="ghost" size="sm"><Shield className="h-4 w-4" /></Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm"><Shield className="h-4 w-4" /></Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="px-2 pt-2 pb-4 space-y-1 border-t border-border/50">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2.5 text-foreground/70 hover:text-foreground transition-smooth font-medium rounded-xl hover:bg-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-2 space-y-2 px-1">
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full"
                    onClick={() => { openOnboarding(); setIsOpen(false); }}
                  >
                    Cotizar Fiesta
                  </Button>
                  {user ? (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="w-full">
                        <Shield className="h-4 w-4 mr-2" />Panel
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm" className="w-full">
                        <Shield className="h-4 w-4 mr-2" />Admin
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <RamiOnboarding isOpen={showOnboarding} onClose={closeOnboarding} />
    </nav>
  );
};

export default Navigation;
