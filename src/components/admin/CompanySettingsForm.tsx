import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Loader2, Building, Mail, Phone, MapPin, Globe, MessageSquare } from 'lucide-react';

const companySettingsSchema = z.object({
  company_name: z.string().min(1, 'El nombre de la empresa es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  address: z.string().optional(),
  terms_conditions: z.string().optional(),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  website_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

export const CompanySettingsForm: React.FC = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      company_name: settings?.company_name || '',
      email: settings?.email || '',
      phone: settings?.phone || '',
      whatsapp_number: settings?.whatsapp_number || '',
      address: settings?.address || '',
      terms_conditions: settings?.terms_conditions || '',
      logo_url: settings?.logo_url || '',
      website_url: settings?.website_url || '',
    },
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name,
        email: settings.email,
        phone: settings.phone || '',
        whatsapp_number: settings.whatsapp_number || '',
        address: settings.address || '',
        terms_conditions: settings.terms_conditions || '',
        logo_url: settings.logo_url || '',
        website_url: settings.website_url || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: CompanySettingsFormData) => {
    updateSettings(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Configuración de la Empresa
        </CardTitle>
        <CardDescription>
          Configura la información básica de tu empresa que aparecerá en las cotizaciones y correos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="JapiTown Entretenimiento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email de Contacto
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="cotizaciones@japitown.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+52 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+525551234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Sitio Web
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://japitown.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Logo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ciudad de México, México" 
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Términos y Condiciones</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Términos y condiciones que aparecerán en las cotizaciones..." 
                      className="resize-none"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};