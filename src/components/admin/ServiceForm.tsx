import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { Service } from '@/hooks/useServices';
import { buildServiceSubmission, createServiceFormSchema, getServiceFormDefaults, getServiceCategoryOptions, getServicePricingOptions } from '@/lib/service-form';
import type { ServiceFormData } from '@/lib/service-form';

interface ServiceFormProps {
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  initialData?: Service;
  loading?: boolean;
}

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

  const serviceSchema = React.useMemo(() => createServiceFormSchema(initialData), [initialData]);
  const categories = getServiceCategoryOptions(initialData?.category);
  const pricingTypes = getServicePricingOptions(initialData?.pricing_type);
  const iconOptions = initialData?.icon && !icons.includes(initialData.icon)
    ? [...icons, initialData.icon]
    : icons;

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: getServiceFormDefaults(initialData),
  });
  const { reset } = form;

  React.useEffect(() => {
    reset(getServiceFormDefaults(initialData));
    setFeatures([...(initialData?.features ?? [])]);
    setNewFeature('');
  }, [initialData, reset]);

  const handleSubmit = (data: ServiceFormData) => {
    onSubmit(buildServiceSubmission(data, features, initialData));
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
                          {category}
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
                  <FormLabel>Precio mostrado</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: Desde $1,500" />
                  </FormControl>
                  <FormDescription>Texto del catálogo. Las cotizaciones usan el precio base numérico.</FormDescription>
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
                      {iconOptions.map((icon) => (
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
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio base numérico</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={2147483647}
                      step={1}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                      placeholder="ej: 1500"
                    />
                  </FormControl>
                  <FormDescription>Importe para cotizar, sin símbolos ni separadores.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hora_extra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por hora extra</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={2147483647}
                      step={1}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                      placeholder="ej: 800"
                    />
                  </FormControl>
                  <FormDescription>No se aplica al cobro por niño.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de precio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pricingTypes.map((pricingType) => (
                        <SelectItem key={pricingType} value={pricingType}>
                          {pricingType === 'fixed' ? 'Por servicio' : pricingType === 'per_child' ? 'Por niño' : `${pricingType} (actual)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Por servicio conserva las reglas de su categoría.</FormDescription>
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
                      min={1}
                      step={1}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
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