import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { Service } from '@/hooks/useServices';

const serviceSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  price: z.string().min(1, 'Precio es requerido'),
  category: z.string().min(1, 'Categoría es requerida'),
  icon: z.string().min(1, 'Icono es requerido'),
  features: z.array(z.string()).optional(),
  duration: z.string().optional(),
  max_participants: z.number().min(1).optional(),
  age_range: z.string().optional(),
  space_requirements: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  initialData?: Service;
  loading?: boolean;
}

const categories = [
  'talleres-creativos',
  'entretenimiento',
  'educativo',
  'deportivo',
  'tematico'
];

const icons = [
  'palette',
  'music',
  'gamepad2',
  'book',
  'trophy',
  'star',
  'heart',
  'gift',
  'camera',
  'brush'
];

export const ServiceForm: React.FC<ServiceFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const [features, setFeatures] = React.useState<string[]>(initialData?.features || []);
  const [newFeature, setNewFeature] = React.useState('');

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      id: initialData?.id || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price || '',
      category: initialData?.category || '',
      icon: initialData?.icon || '',
      features: initialData?.features || [],
      duration: initialData?.duration || '2 horas',
      max_participants: initialData?.max_participants || 8,
      age_range: initialData?.age_range || '4-12 años',
      space_requirements: initialData?.space_requirements || '',
    }
  });

  const handleSubmit = (data: ServiceFormData) => {
    onSubmit({
      ...data,
      features,
    });
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {initialData ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID del Servicio</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: taller-ceramica" disabled={!!initialData} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del servicio" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Descripción detallada del servicio" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: $150.000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un icono" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {icons.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: 2 horas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máx. Participantes</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      placeholder="ej: 8" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rango de Edad</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: 4-12 años" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="space_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requerimientos de Espacio</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe los requerimientos de espacio necesarios" rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Features Section */}
          <div className="space-y-3">
            <FormLabel>Características</FormLabel>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Agregar característica"
              />
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {feature}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFeature(feature)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')} Servicio
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};