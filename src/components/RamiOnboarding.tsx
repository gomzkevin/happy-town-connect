import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, PartyPopper, Users, Calendar, MapPin, Heart, Star, Gift, Crown, Palette, Sparkles, Music, Camera, Utensils, Gamepad2 } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useQuotes } from "@/hooks/useQuotes";
import { Service } from "@/contexts/ServicesContext";
import * as LucideIcons from "lucide-react";
import raminegrito from "@/assets/raminegrito.png";

interface OnboardingData {
  childName: string;
  eventDate: string;
  childrenCount: number | null;
  ageRange: string;
  preferences: string[];
  location: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
  selectedServices: string[];
}

const preferenceOptions = [
  { id: "active", label: "Juegos Activos", icon: Gamepad2, color: "bg-red-100 text-red-800" },
  { id: "creative", label: "Talleres Creativos", icon: Palette, color: "bg-blue-100 text-blue-800" },
  { id: "relaxed", label: "Actividades Tranquilas", icon: Heart, color: "bg-green-100 text-green-800" },
  { id: "food", label: "Experiencias Gastronómicas", icon: Utensils, color: "bg-yellow-100 text-yellow-800" },
  { id: "roleplay", label: "Juegos de Rol", icon: Crown, color: "bg-purple-100 text-purple-800" },
  { id: "spa", label: "Experiencias de Spa", icon: Sparkles, color: "bg-pink-100 text-pink-800" },
  { id: "educational", label: "Educativo y Divertido", icon: Star, color: "bg-indigo-100 text-indigo-800" },
  { id: "party", label: "Ambiente de Fiesta", icon: PartyPopper, color: "bg-orange-100 text-orange-800" },
];

interface RamiOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RamiOnboarding: React.FC<RamiOnboardingProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { services } = useServices();
  const { submitQuote, isSubmitting } = useQuotes();

  const [data, setData] = useState<OnboardingData>({
    childName: "",
    eventDate: "",
    childrenCount: null,
    ageRange: "",
    preferences: [],
    location: "",
    customerName: "",
    email: "",
    phone: "",
    comments: "",
    selectedServices: [],
  });

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [recommendations, setRecommendations] = useState<Service[]>([]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 2) {
        generateRecommendations();
      }
    }
  };

  const generateRecommendations = () => {
    if (!data.preferences.length || !services.length) return;

    const servicePreferenceMap: Record<string, string[]> = {
      active: ["boliche", "pesca", "construccion"],
      creative: ["caballetes", "yesitos", "decora-tote-bag", "decora-gorra", "haz-pulsera"],
      relaxed: ["guarderia", "spa"],
      food: ["hamburgueseria", "decora-cupcake"],
      roleplay: ["veterinaria", "supermercado"],
      spa: ["spa"],
      educational: ["veterinaria", "construccion"],
      party: ["boliche", "hamburgueseria", "decora-cupcake"]
    };

    const filtered = services.filter(service => 
      data.preferences.some(pref => servicePreferenceMap[pref]?.includes(service.id))
    ).slice(0, 6);

    setRecommendations(filtered);
    setSelectedServices(filtered.slice(0, 3));
  };

  const handleSubmit = async () => {
    try {
      await submitQuote({
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        eventDate: data.eventDate,
        childrenCount: data.childrenCount || undefined,
        ageRange: data.ageRange,
        childName: data.childName,
        preferences: data.preferences,
        location: data.location,
        source: 'onboarding'
      });
      onClose();
    } catch (error) {
      console.error('Error submitting quote:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <img src={raminegrito} alt="Rami" className="w-8 h-8" />
            ¡Hola! Soy Rami y te ayudaré a planear la fiesta perfecta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={(currentStep / 5) * 100} className="w-full" />

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">¡Cuéntame sobre el festejado! 🎉</h3>
              </div>
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="childName">¿Cómo se llama el niño o niña que cumple años?</Label>
                  <Input
                    id="childName"
                    value={data.childName}
                    onChange={(e) => setData({ ...data, childName: e.target.value })}
                    placeholder="Ej: María, Juan, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">¡Perfecto! Ahora cuéntame sobre la fiesta de {data.childName} 🎈</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>¿Qué edad tiene {data.childName}?</Label>
                  <Select value={data.ageRange} onValueChange={(value) => setData({ ...data, ageRange: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el rango de edad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-4">2-4 años</SelectItem>
                      <SelectItem value="5-7">5-7 años</SelectItem>
                      <SelectItem value="8-10">8-10 años</SelectItem>
                      <SelectItem value="11-13">11-13 años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="childrenCount">¿Cuántos niños aproximadamente?</Label>
                  <Input
                    id="childrenCount"
                    type="number"
                    value={data.childrenCount || ""}
                    onChange={(e) => setData({ ...data, childrenCount: parseInt(e.target.value) || null })}
                    placeholder="Ej: 15"
                  />
                </div>
              </div>

              <div>
                <Label>¿Qué tipo de actividades le gustan más a {data.childName}?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {preferenceOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        data.preferences.includes(option.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setData(prev => ({
                        ...prev,
                        preferences: prev.preferences.includes(option.id)
                          ? prev.preferences.filter(p => p !== option.id)
                          : [...prev.preferences, option.id]
                      }))}
                    >
                      <option.icon className="w-8 h-8 mb-2 text-primary" />
                      <span className="text-sm text-center font-medium">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">¡Servicios recomendados para {data.childName}! ⭐</h3>
                <p className="text-muted-foreground">Selecciona los servicios que más te interesen</p>
              </div>
              
              {recommendations.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((service) => (
                      <Card 
                        key={service.id} 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          data.selectedServices.includes(service.id)
                            ? 'ring-2 ring-primary bg-primary/5'
                            : ''
                        }`}
                        onClick={() => setData(prev => ({
                          ...prev,
                          selectedServices: prev.selectedServices.includes(service.id)
                            ? prev.selectedServices.filter(s => s !== service.id)
                            : [...prev.selectedServices, service.id]
                        }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              {service.icon && React.createElement(
                                (LucideIcons as any)[service.icon], 
                                { className: "w-6 h-6 text-primary" }
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold">{service.title}</h5>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                              <p className="text-sm font-medium text-primary mt-1">{service.price}</p>
                            </div>
                            {data.selectedServices.includes(service.id) && (
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Detalles del evento 📍</h3>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="eventDate">¿Cuándo será la fiesta?</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={data.eventDate}
                    onChange={(e) => setData({ ...data, eventDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">¿En qué zona será la fiesta?</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => setData({ ...data, location: e.target.value })}
                    placeholder="Ej: Polanco, Roma Norte, Satelite..."
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Información de contacto 📞</h3>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="customerName">Tu nombre completo</Label>
                  <Input
                    id="customerName"
                    value={data.customerName}
                    onChange={(e) => setData({ ...data, customerName: e.target.value })}
                    placeholder="Ej: María González"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    placeholder="Ej: maria@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Tu número de teléfono</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    placeholder="Ej: 55 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="comments">Comentarios adicionales (opcional)</Label>
                  <textarea
                    id="comments"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.comments}
                    onChange={(e) => setData({ ...data, comments: e.target.value })}
                    placeholder="¿Hay algo especial que debamos saber sobre la fiesta?"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !data.childName) ||
                  (currentStep === 2 && (!data.ageRange || !data.childrenCount || data.preferences.length === 0)) ||
                  (currentStep === 3 && data.selectedServices.length === 0) ||
                  (currentStep === 4 && (!data.eventDate || !data.location))
                }
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!data.customerName || !data.email || !data.phone || isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Solicitar Cotización"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};