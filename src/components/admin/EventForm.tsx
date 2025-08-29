import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Event } from '@/hooks/useEvents';
import { useServices } from '@/hooks/useServices';

const eventSchema = z.object({
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().optional(),
  event_date: z.string().optional(),
  location: z.string().optional(),
  guest_count: z.number().min(1).optional(),
  services: z.array(z.string()).optional(),
  featured_image_url: z.string().optional(),
  is_featured: z.boolean().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSubmit: (data: EventFormData & { id?: string }) => void;
  onCancel: () => void;
  initialData?: Event;
  loading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false
}) => {
  const { services } = useServices();
  const [selectedServices, setSelectedServices] = React.useState<string[]>(initialData?.services || []);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      event_date: initialData?.event_date || '',
      location: initialData?.location || '',
      guest_count: initialData?.guest_count || undefined,
      services: initialData?.services || [],
      featured_image_url: initialData?.featured_image_url || '',
      is_featured: initialData?.is_featured || false,
    }
  });

  const handleSubmit = (data: EventFormData) => {
    onSubmit({
      ...data,
      id: initialData?.id,
      services: selectedServices,
      guest_count: data.guest_count || null,
    });
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(id => id !== serviceId));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {initialData ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Evento</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del evento" />
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
                  <Textarea {...field} placeholder="Descripción del evento" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Evento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guest_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Invitados</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      placeholder="ej: 20" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Dirección o ubicación del evento" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Imagen Destacada</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://ejemplo.com/imagen.jpg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Services Selection */}
          <div className="space-y-3">
            <FormLabel>Servicios Incluidos</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <label htmlFor={service.id} className="text-sm cursor-pointer">
                    {service.title}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Selected Services Display */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((serviceId) => {
                  const service = services.find(s => s.id === serviceId);
                  return service ? (
                    <Badge key={serviceId} variant="secondary" className="gap-1">
                      {service.title}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeService(serviceId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Evento Destacado</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Este evento aparecerá en la sección destacada
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')} Evento
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};