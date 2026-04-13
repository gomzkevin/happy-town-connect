import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, X, Gamepad2, Palette, Heart, Utensils, Crown, Sparkles, Star, PartyPopper, Eye } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useQuotes } from "@/hooks/useQuotes";
import { Service, useServices as useServicesContext } from "@/contexts/ServicesContext";
import raminegrito from "@/assets/raminegrito.png";

import icono01 from "@/assets/Iconos-01.png";
import icono02 from "@/assets/Iconos-02.png";
import icono03 from "@/assets/Iconos-03.png";
import icono04 from "@/assets/Iconos-04.png";
import icono05 from "@/assets/Iconos-05.png";
import icono06 from "@/assets/Iconos-06.png";
import icono07 from "@/assets/Iconos-07.png";
import icono08 from "@/assets/Iconos-08.png";
import icono09 from "@/assets/Iconos-09.png";
import icono10 from "@/assets/Iconos-10.png";
import icono11 from "@/assets/Iconos-11.png";
import icono12 from "@/assets/Iconos-12.png";

const serviceIconMap: Record<string, string> = {
  pesca: icono01,
  caballetes: icono02,
  hamburgueseria: icono03,
  boliche: icono04,
  supermercado: icono05,
  spa: icono06,
  veterinaria: icono07,
  "decora-cupcake": icono08,
  "haz-pulsera": icono09,
  yesitos: icono10,
  construccion: icono11,
  guarderia: icono12,
};

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
  totalHours: number;
}

const preferenceOptions = [
  { id: "active", label: "Juegos Activos", icon: Gamepad2 },
  { id: "creative", label: "Talleres Creativos", icon: Palette },
  { id: "relaxed", label: "Actividades Tranquilas", icon: Heart },
  { id: "food", label: "Gastronomía", icon: Utensils },
  { id: "roleplay", label: "Juegos de Rol", icon: Crown },
  { id: "spa", label: "Spa", icon: Sparkles },
  { id: "educational", label: "Educativo", icon: Star },
  { id: "party", label: "Fiesta", icon: PartyPopper },
];

const TOTAL_STEPS = 5;

interface RamiOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RamiOnboarding: React.FC<RamiOnboardingProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { services } = useServices();
  const { submitQuote, isSubmitting } = useQuotes();
  const { selectedServices, addService, removeService, clearSelection } = useServicesContext();

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
    totalHours: 3,
  });

  const [recommendations, setRecommendations] = useState<Service[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
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
      creative: ["caballetes", "yesitos", "haz-pulsera"],
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
    clearSelection();
    filtered.slice(0, 3).forEach(service => addService(service));
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
        extraHours: Math.max(0, data.totalHours - 3),
        source: 'onboarding'
      });
      onClose();
    } catch (error) {
      console.error('Error submitting quote:', error);
    }
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 1: return !!data.childName;
      case 2: return !!data.ageRange && !!data.childrenCount && data.preferences.length > 0;
      case 3: return selectedServices.length >= 2;
      case 4: return !!data.eventDate && !!data.location;
      case 5: return !!data.customerName && !!data.email && !!data.phone;
      default: return false;
    }
  };

  const stepTitles = [
    "El festejado",
    "La fiesta",
    "Servicios",
    "Detalles",
    "Contacto",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-0 bg-background shadow-hover gap-0">
        {/* Header with Rami */}
        <div className="relative bg-accent/50 px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <img src={raminegrito} alt="Rami" className="w-12 h-12" />
            <div>
              <p className="font-display font-bold text-foreground">¡Hola! Soy Rami</p>
              <p className="text-sm text-muted-foreground">Te ayudo a planear la fiesta perfecta</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    i + 1 <= currentStep ? 'bg-secondary' : 'bg-border'
                  }`}
                />
                <span className={`text-[10px] ${i + 1 <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {stepTitles[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Child name */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-1">¡Cuéntame sobre el festejado! 🎉</h3>
                <p className="text-sm text-muted-foreground">Empecemos con lo más importante</p>
              </div>
              <div>
                <Label htmlFor="childName" className="text-sm font-medium">¿Cómo se llama?</Label>
                <Input
                  id="childName"
                  value={data.childName}
                  onChange={(e) => setData({ ...data, childName: e.target.value })}
                  placeholder="Ej: María, Juan..."
                  className="mt-1.5 rounded-xl bg-card border-border"
                />
              </div>
            </div>
          )}

          {/* Step 2: Party details + preferences */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-1">
                  La fiesta de {data.childName} 🎈
                </h3>
                <p className="text-sm text-muted-foreground">Cuéntame más para recomendarte lo mejor</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Edad</Label>
                  <Select value={data.ageRange} onValueChange={(v) => setData({ ...data, ageRange: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl bg-card">
                      <SelectValue placeholder="Rango" />
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
                  <Label htmlFor="childrenCount" className="text-sm font-medium">Niños aprox.</Label>
                  <Input
                    id="childrenCount"
                    type="number"
                    value={data.childrenCount || ""}
                    onChange={(e) => setData({ ...data, childrenCount: parseInt(e.target.value) || null })}
                    placeholder="15"
                    className="mt-1.5 rounded-xl bg-card"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">¿Qué le gusta a {data.childName}?</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {preferenceOptions.map((option) => {
                    const selected = data.preferences.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? 'border-secondary bg-secondary/10'
                            : 'border-border hover:border-secondary/40 bg-card'
                        }`}
                        onClick={() => setData(prev => ({
                          ...prev,
                          preferences: prev.preferences.includes(option.id)
                            ? prev.preferences.filter(p => p !== option.id)
                            : [...prev.preferences, option.id]
                        }))}
                      >
                        <option.icon className={`w-5 h-5 mb-1 ${selected ? 'text-secondary' : 'text-muted-foreground'}`} />
                        <span className="text-[10px] leading-tight font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Service recommendations */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-1">
                  Recomendaciones para {data.childName} ⭐
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona mínimo 2 servicios · {selectedServices.length} seleccionado{selectedServices.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Recommended services */}
              <div className="space-y-2">
                {recommendations.map((service) => {
                  const isSelected = selectedServices.some(item => item.service.id === service.id);
                  const iconSrc = serviceIconMap[service.id];
                  return (
                    <button
                      key={service.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-secondary bg-secondary/5'
                          : 'border-border hover:border-secondary/40 bg-card'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          removeService(service.id);
                        } else {
                          addService(service);
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center flex-shrink-0">
                        <img src={iconSrc} alt={service.title} className="w-7 h-7 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{service.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-secondary' : 'border-2 border-border'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-secondary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Show all services toggle */}
              {(() => {
                const otherServices = services.filter(
                  s => !recommendations.some(r => r.id === s.id)
                );
                if (otherServices.length === 0) return null;
                return (
                  <>
                    <button
                      onClick={() => setShowAllServices(!showAllServices)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-japitown-yellow/60 bg-japitown-yellow/10 hover:bg-japitown-yellow/20 transition-all text-sm font-medium text-foreground"
                    >
                      <Eye className="w-4 h-4 text-japitown-yellow" />
                      {showAllServices ? 'Ocultar servicios extra' : `Ver ${otherServices.length} servicios más`}
                    </button>

                    {showAllServices && (
                      <div className="space-y-2">
                        {otherServices.map((service) => {
                          const isSelected = selectedServices.some(item => item.service.id === service.id);
                          const iconSrc = serviceIconMap[service.id];
                          return (
                            <button
                              key={service.id}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-japitown-yellow bg-japitown-yellow/10'
                                  : 'border-border hover:border-japitown-yellow/40 bg-card'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  removeService(service.id);
                                } else {
                                  addService(service);
                                }
                              }}
                            >
                              <div className="w-10 h-10 rounded-xl bg-japitown-yellow/15 flex items-center justify-center flex-shrink-0">
                                <img src={iconSrc} alt={service.title} className="w-7 h-7 object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground">{service.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'bg-japitown-yellow' : 'border-2 border-border'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-foreground" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {selectedServices.length < 2 && (
                <p className="text-xs text-center text-japitown-orange font-medium">
                  Faltan {2 - selectedServices.length} servicio{2 - selectedServices.length > 1 ? 's' : ''} más
                </p>
              )}
            </div>
          )}

          {/* Step 4: Event details */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-1">Detalles del evento 📍</h3>
                <p className="text-sm text-muted-foreground">¿Dónde y cuándo será la fiesta?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventDate" className="text-sm font-medium">Fecha de la fiesta</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={data.eventDate}
                    onChange={(e) => setData({ ...data, eventDate: e.target.value })}
                    className="mt-1.5 rounded-xl bg-card"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-medium">Zona / Colonia</Label>
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => setData({ ...data, location: e.target.value })}
                    placeholder="Ej: Polanco, Roma Norte..."
                    className="mt-1.5 rounded-xl bg-card"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Contact info */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-1">¡Casi listo! 📞</h3>
                <p className="text-sm text-muted-foreground">Tus datos para enviarte la cotización</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium">Tu nombre</Label>
                  <Input
                    id="customerName"
                    value={data.customerName}
                    onChange={(e) => setData({ ...data, customerName: e.target.value })}
                    placeholder="María González"
                    className="mt-1.5 rounded-xl bg-card"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    placeholder="maria@email.com"
                    className="mt-1.5 rounded-xl bg-card"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">WhatsApp / Teléfono</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    placeholder="55 1234 5678"
                    className="mt-1.5 rounded-xl bg-card"
                  />
                </div>
                <div>
                  <Label htmlFor="comments" className="text-sm font-medium">Comentarios (opcional)</Label>
                  <textarea
                    id="comments"
                    className="flex min-h-[70px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
                    value={data.comments}
                    onChange={(e) => setData({ ...data, comments: e.target.value })}
                    placeholder="¿Algo especial que debamos saber?"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-accent/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="gap-1 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="gap-1 rounded-full"
              variant="hero"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canAdvance() || isSubmitting}
              className="rounded-full"
              variant="hero"
            >
              {isSubmitting ? "Enviando..." : "Solicitar Cotización ✨"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
