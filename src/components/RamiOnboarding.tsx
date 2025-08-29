import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
                <h3 className="text-xl font-semibold mb-2">¡Perfecto {data.childName}! Cuéntame más detalles 🎈</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="childrenCount">¿Cuántos niños aproximadamente?</Label>
                  <Input
                    id="childrenCount"
                    type="number"
                    value={data.childrenCount || ""}
                    onChange={(e) => setData({ ...data, childrenCount: parseInt(e.target.value) || null })}
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
                <h3 className="text-xl font-semibold mb-2">¿Qué edad tiene {data.childName}? 🎂</h3>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label>Selecciona el rango de edad</Label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      { value: "2-4", label: "2-4 años" },
                      { value: "5-7", label: "5-7 años" },
                      { value: "8-10", label: "8-10 años" },
                      { value: "11-13", label: "11-13 años" }
                    ].map((age) => (
                      <div
                        key={age.value}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                          data.ageRange === age.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setData({ ...data, ageRange: age.value })}
                      >
                        <span className="font-medium">{age.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {recommendations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-center">¡Servicios recomendados para {data.childName}! ⭐</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.slice(0, 4).map((service) => (
                      <Card key={service.id} className="cursor-pointer transition-all hover:shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              {service.icon && React.createElement(
                                (LucideIcons as any)[service.icon], 
                                { className: "w-6 h-6 text-primary" }
                              )}
                            </div>
                            <div>
                              <h5 className="font-semibold">{service.title}</h5>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
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
                <h3 className="text-xl font-semibold mb-2">¡Ya casi terminamos! 📍</h3>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="location">¿En qué zona será la fiesta?</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => setData({ ...data, location: e.target.value })}
                    placeholder="Ej: Polanco, Roma Norte, Satelite..."
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
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">¡Casi terminamos! 🎯</h3>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="customerName">Tu nombre completo</Label>
                  <Input
                    id="customerName"
                    value={data.customerName}
                    onChange={(e) => setData({ ...data, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
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
                  (currentStep === 2 && (!data.eventDate || !data.childrenCount || data.preferences.length === 0)) ||
                  (currentStep === 3 && !data.ageRange) ||
                  (currentStep === 4 && (!data.location || !data.phone))
                }
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!data.customerName || !data.email || isSubmitting}
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