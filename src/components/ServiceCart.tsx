import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, X, Plus, Minus, Send } from "lucide-react";
import { useServices } from "@/contexts/ServicesContext";
import { useQuotes } from "@/hooks/useQuotes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const ServiceCart = () => {
  const { selectedServices, removeService, updateQuantity, clearSelection, getTotalPrice } = useServices();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    eventDate: ''
  });
  const { submitQuote, isSubmitting } = useQuotes();

  const handleRequestQuote = () => {
    setShowQuoteForm(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitQuote({
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.eventDate,
        source: 'services'
      });
      
      // Reset form and close
      setFormData({ customerName: '', email: '', phone: '', eventDate: '' });
      setShowQuoteForm(false);
      setIsOpen(false);
    } catch (error) {
      // Error handled in useQuotes hook
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-hover gap-2 relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Mi Cotización</span>
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                {selectedServices.reduce((total, item) => total + item.quantity, 0)}
              </Badge>
            </Button>
          </SheetTrigger>
          
          <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Mi Cotización
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto mt-6 space-y-4">
              {selectedServices.map((item) => {
                const IconComponent = item.service.icon;
                const price = parseInt(item.service.price.replace(/[^\d]/g, ''));
                
                return (
                  <Card key={item.service.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-primary-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{item.service.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.service.price} MXN c/u
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeService(item.service.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t text-right">
                        <span className="text-sm font-medium">
                          ${(price * item.quantity).toLocaleString()} MXN
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Total */}
              <Card className="bg-gradient-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Estimado:</span>
                    <span className="text-lg font-bold text-primary">
                      ${getTotalPrice().toLocaleString()} MXN
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Actions */}
              {!showQuoteForm ? (
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={handleRequestQuote}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Send className="h-4 w-4" />
                    Solicitar Cotización
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearSelection}
                    className="w-full"
                  >
                    Limpiar Selección
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Datos para cotización</h3>
                    <form onSubmit={handleSubmitQuote} className="space-y-4">
                      <div>
                        <Label htmlFor="customerName">Nombre completo *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => handleInputChange('customerName', e.target.value)}
                          required
                          placeholder="Tu nombre completo"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
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
                          placeholder="(55) 1234-5678"
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
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !formData.customerName || !formData.email}
                          className="flex-1"
                        >
                          {isSubmitting ? 'Enviando...' : 'Enviar Cotización'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => setShowQuoteForm(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground text-center pt-2">
                * Los precios son estimados. La cotización final puede variar según 
                ubicación, duración y servicios adicionales.
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default ServiceCart;