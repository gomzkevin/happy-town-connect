import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { servicesData } from '@/data/services';
import { useQuotes } from '@/hooks/useQuotes';
import { useServices } from '@/contexts/ServicesContext';
import { 
  ChefHat, 
  Hammer, 
  Palette, 
  Music, 
  Gamepad2, 
  Camera,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface OnboardingData {
  childName: string;
  age: number;
  childrenCount: number;
  preferences: string[];
  customerName: string;
  email: string;
  phone: string;
  eventDate: string;
}

const preferenceOptions = [
  { id: 'cooking', label: 'Cocinar', icon: ChefHat, color: 'bg-orange-100 text-orange-700' },
  { id: 'building', label: 'Construir', icon: Hammer, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'painting', label: 'Pintar', icon: Palette, color: 'bg-purple-100 text-purple-700' },
  { id: 'music', label: 'Música', icon: Music, color: 'bg-blue-100 text-blue-700' },
  { id: 'games', label: 'Juegos', icon: Gamepad2, color: 'bg-green-100 text-green-700' },
  { id: 'photos', label: 'Fotos', icon: Camera, color: 'bg-pink-100 text-pink-700' },
];

interface RamiOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RamiOnboarding: React.FC<RamiOnboardingProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    childName: '',
    age: 6,
    childrenCount: 10,
    preferences: [],
    customerName: '',
    email: '',
    phone: '',
    eventDate: ''
  });
  
  const [recommendedServices, setRecommendedServices] = useState<typeof servicesData>([]);
  const { submitQuote, isSubmitting } = useQuotes();
  const { addService, selectedServices } = useServices();

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const getRecommendations = () => {
    const { age, preferences, childrenCount } = data;
    
    let recommendations = servicesData.filter(service => {
      // Age-based filtering
      const [minAge, maxAge] = service.ageRange.split('-').map(a => parseInt(a.replace(/\D/g, '')));
      const ageMatch = age >= minAge && age <= maxAge;
      
      // Preference-based filtering
      const preferenceMatch = preferences.some(pref => {
        switch (pref) {
          case 'cooking': return service.category === 'culinary' || service.title.toLowerCase().includes('chef');
          case 'building': return service.category === 'construction' || service.title.toLowerCase().includes('construcción');
          case 'painting': return service.category === 'art' || service.title.toLowerCase().includes('arte');
          case 'music': return service.title.toLowerCase().includes('música') || service.title.toLowerCase().includes('dj');
          case 'games': return service.category === 'entertainment' || service.title.toLowerCase().includes('juegos');
          case 'photos': return service.title.toLowerCase().includes('foto');
          default: return false;
        }
      });
      
      // Group size compatibility
      const capacityMatch = service.maxParticipants >= childrenCount;
      
      return (ageMatch || preferenceMatch) && capacityMatch;
    }).slice(0, 4); // Limit to 4 recommendations
    
    // If no matches, show popular services for the age group
    if (recommendations.length === 0) {
      recommendations = servicesData.filter(service => {
        const [minAge, maxAge] = service.ageRange.split('-').map(a => parseInt(a.replace(/\D/g, '')));
        return data.age >= minAge && data.age <= maxAge && service.maxParticipants >= childrenCount;
      }).slice(0, 4);
    }
    
    setRecommendedServices(recommendations);
  };

  const handleNext = () => {
    if (step === 2) {
      getRecommendations();
    }
    setStep(step + 1);
  };

  const handlePreferenceToggle = (preference: string) => {
    setData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  const handleServiceToggle = (service: typeof servicesData[0]) => {
    const isSelected = selectedServices.some(s => s.service.id === service.id);
    if (isSelected) {
      // Remove from selection (would need removeService function)
    } else {
      addService(service);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitQuote({
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        eventDate: data.eventDate,
        childrenCount: data.childrenCount,
        ageRange: `${data.age} años`,
        childName: data.childName,
        preferences: data.preferences,
        source: 'onboarding'
      });
      onClose();
    } catch (error) {
      // Error handled in useQuotes hook
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">🐕</div>
            <h2 className="text-2xl font-bold">¡Hola! Soy Rami</h2>
            <p className="text-muted-foreground">
              Voy a ayudarte a crear la fiesta perfecta. ¿Cómo se llama el festejado?
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="childName">Nombre del festejado</Label>
                <Input
                  id="childName"
                  value={data.childName}
                  onChange={(e) => setData(prev => ({ ...prev, childName: e.target.value }))}
                  placeholder="Ej: Sofia, Diego, etc."
                  className="text-center text-lg"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎂</div>
              <h2 className="text-xl font-bold">
                ¡Perfecto {data.childName}! Ahora cuéntame sobre la fiesta:
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label>¿Cuántos años cumple?</Label>
                <div className="px-4 py-6">
                  <Slider
                    value={[data.age]}
                    onValueChange={(value) => setData(prev => ({ ...prev, age: value[0] }))}
                    min={3}
                    max={12}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>3 años</span>
                    <span className="font-bold text-primary text-lg">{data.age} años</span>
                    <span>12 años</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>¿Cuántos niños van a venir?</Label>
                <div className="px-4 py-6">
                  <Slider
                    value={[data.childrenCount]}
                    onValueChange={(value) => setData(prev => ({ ...prev, childrenCount: value[0] }))}
                    min={5}
                    max={30}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>5 niños</span>
                    <span className="font-bold text-primary text-lg">{data.childrenCount} niños</span>
                    <span>30 niños</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>¿Qué le gusta más hacer a {data.childName}?</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {preferenceOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = data.preferences.includes(option.id);
                    return (
                      <Card
                        key={option.id}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handlePreferenceToggle(option.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="text-xl font-bold">
                ¡Genial! Creo que a {data.childName} le encantarán estas actividades:
              </h2>
              <p className="text-muted-foreground mt-2">
                Puedes seleccionar las que más te gusten
              </p>
            </div>

            <div className="grid gap-4">
              {recommendedServices.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedServices.some(s => s.service.id === service.id);
                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{service.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{service.ageRange}</Badge>
                            <Badge variant="outline">{service.price}</Badge>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="text-primary">
                            <Sparkles className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              💡 Siempre puedes añadir más servicios después
            </div>
          </div>
        );

      case 4:
        const totalServices = selectedServices.length;
        const totalEstimate = selectedServices.reduce((total, item) => {
          const price = parseInt(item.service.price.replace(/[^\d]/g, ''));
          return total + (price * item.quantity);
        }, 0);

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold">
                ¡Perfecto! Esta fiesta será increíble
              </h2>
              <p className="text-muted-foreground">
                Resumen de la fiesta de {data.childName}
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span>Edad:</span>
                <span className="font-medium">{data.age} años</span>
              </div>
              <div className="flex justify-between">
                <span>Invitados:</span>
                <span className="font-medium">{data.childrenCount} niños</span>
              </div>
              <div className="flex justify-between">
                <span>Actividades:</span>
                <span className="font-medium">{totalServices} servicios</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Estimado total:</span>
                <span className="text-primary">${totalEstimate.toLocaleString()}</span>
              </div>
            </div>

            {selectedServices.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Servicios seleccionados:</h3>
                {selectedServices.map((item) => (
                  <div key={item.service.id} className="flex justify-between text-sm">
                    <span>{item.service.title} x{item.quantity}</span>
                    <span>{item.service.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h2 className="text-xl font-bold">
                ¡Casi listo! Solo necesito tus datos
              </h2>
              <p className="text-muted-foreground">
                Para enviarte la cotización personalizada
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Tu nombre completo *</Label>
                <Input
                  id="customerName"
                  value={data.customerName}
                  onChange={(e) => setData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Ej: Ana García"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ana@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(55) 1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="eventDate">Fecha del evento</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={data.eventDate}
                  onChange={(e) => setData(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.childName.trim() !== '';
      case 2: return data.preferences.length > 0;
      case 3: return true; // Can proceed without selecting services
      case 4: return true;
      case 5: return data.customerName.trim() !== '' && data.email.trim() !== '';
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Progress value={progress} className="w-full" />
          <div className="text-sm text-muted-foreground text-center mt-2">
            Paso {step} de {totalSteps}
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Cotización'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};