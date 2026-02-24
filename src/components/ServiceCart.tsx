import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { useServices } from "@/contexts/ServicesContext";
import { useQuotes } from "@/hooks/useQuotes";
import { useOnboarding } from "@/hooks/useOnboarding";
import * as LucideIcons from "lucide-react";

const ServiceCart = () => {
  const { selectedServices, removeService, clearSelection, hasMinimumServices, getRemainingToMinimum } = useServices();
  const { submitQuote, isSubmitting } = useQuotes();
  const { showOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    eventDate: "",
    childrenCount: 0,
    ageRange: "",
    childName: "",
    preferences: [] as string[],
    location: "",
  });

  // Hide cart when wizard is open or no services selected
  if (selectedServices.length === 0 || showOnboarding) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitQuote = async () => {
    try {
      await submitQuote({
        ...formData,
        source: 'services' as const
      });
      setIsOpen(false);
      setShowQuoteForm(false);
      setFormData({
        customerName: "",
        email: "",
        phone: "",
        eventDate: "",
        childrenCount: 0,
        ageRange: "",
        childName: "",
        preferences: [],
        location: "",
      });
    } catch (error) {
      console.error('Error submitting quote:', error);
    }
  };

  const canSubmitQuote = formData.customerName && formData.email && formData.childrenCount >= 1;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-12 px-4 rounded-full shadow-hover z-50 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 animate-fade-in"
          variant="default"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {selectedServices.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Mi Cotización
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {!showQuoteForm ? (
            <>
              {/* Cart Items */}
              <div className="space-y-2">
                {selectedServices.map((item) => {
                  const IconComponent = (LucideIcons as any)[item.service.icon] || LucideIcons.Star;
                  
                  return (
                    <div
                      key={item.service.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                    >
                      <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.service.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{item.service.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => removeService(item.service.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Minimum Services Notice */}
              {!hasMinimumServices() && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Selecciona {getRemainingToMinimum()} servicio{getRemainingToMinimum() > 1 ? 's' : ''} más para continuar
                  </p>
                   <p className="text-xs text-orange-600 mt-1">
                     Mínimo requerido: 2 servicios
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''} seleccionado{selectedServices.length !== 1 ? 's' : ''}. Solicita tu cotización y te enviaremos un presupuesto personalizado.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full"
                  size="lg"
                  disabled={!hasMinimumServices()}
                >
                  {hasMinimumServices() ? 'Solicitar Cotización' : `Faltan ${getRemainingToMinimum()} servicios`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSelection}
                  className="w-full"
                >
                  Limpiar Carrito
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Quote Form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuoteForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">Información de Contacto</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Nombre completo *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+52 555 123 4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="eventDate">Fecha del evento</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="childName">Nombre del festejado</Label>
                    <Input
                      id="childName"
                      value={formData.childName}
                      onChange={(e) => handleInputChange('childName', e.target.value)}
                      placeholder="Nombre del niño/niña"
                    />
                  </div>

                  <div>
                    <Label htmlFor="childrenCount">Número de niños *</Label>
                    <Input
                      id="childrenCount"
                      type="number"
                      min="1"
                      value={formData.childrenCount || ""}
                      onChange={(e) => handleInputChange('childrenCount', parseInt(e.target.value) || 0)}
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Ubicación del evento</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Casa, jardín, salón, etc."
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={handleSubmitQuote}
                    disabled={!canSubmitQuote || isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Cotización"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQuoteForm(false)}
                    className="w-full"
                  >
                    Volver al Carrito
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ServiceCart;