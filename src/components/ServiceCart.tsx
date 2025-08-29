import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { useServices } from "@/contexts/ServicesContext";
import { useQuotes } from "@/hooks/useQuotes";
import * as LucideIcons from "lucide-react";

const ServiceCart = () => {
  const { selectedServices, removeService, updateQuantity, clearSelection, getTotalPrice } = useServices();
  const { submitQuote, isSubmitting } = useQuotes();
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

  if (selectedServices.length === 0) {
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

  const canSubmitQuote = formData.customerName && formData.email;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <ShoppingCart className="h-6 w-6" />
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs"
          >
            {selectedServices.reduce((total, item) => total + item.quantity, 0)}
          </Badge>
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
              <div className="space-y-4">
                {selectedServices.map((item) => {
                  const IconComponent = (LucideIcons as any)[item.service.icon] || LucideIcons.Star;
                  
                  return (
                    <Card key={item.service.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-primary-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{item.service.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.service.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-semibold text-primary">{item.service.price}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => removeService(item.service.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Estimado:</span>
                  <span className="text-primary">${getTotalPrice().toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  *Precio estimado. El costo final puede variar según los detalles específicos de tu evento.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full"
                  size="lg"
                >
                  Solicitar Cotización
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
                    <Label htmlFor="childrenCount">Número de niños</Label>
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