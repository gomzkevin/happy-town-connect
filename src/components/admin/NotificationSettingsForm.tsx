import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Loader2, MessageSquare, Bell, Users, UserCheck } from 'lucide-react';

const notificationSettingsSchema = z.object({
  whatsapp_enabled: z.boolean(),
  whatsapp_api_url: z.string().url('URL inválida').optional().or(z.literal('')),
  whatsapp_api_token: z.string().optional(),
  client_notification_enabled: z.boolean(),
  admin_notification_enabled: z.boolean(),
  client_whatsapp_template: z.string().optional(),
  admin_whatsapp_template: z.string().optional(),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

export const NotificationSettingsForm: React.FC = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useNotificationSettings();

  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      whatsapp_enabled: settings?.whatsapp_enabled || false,
      whatsapp_api_url: settings?.whatsapp_api_url || '',
      whatsapp_api_token: settings?.whatsapp_api_token || '',
      client_notification_enabled: settings?.client_notification_enabled || true,
      admin_notification_enabled: settings?.admin_notification_enabled || true,
      client_whatsapp_template: settings?.client_whatsapp_template || '',
      admin_whatsapp_template: settings?.admin_whatsapp_template || '',
    },
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      form.reset({
        whatsapp_enabled: settings.whatsapp_enabled,
        whatsapp_api_url: settings.whatsapp_api_url || '',
        whatsapp_api_token: settings.whatsapp_api_token || '',
        client_notification_enabled: settings.client_notification_enabled,
        admin_notification_enabled: settings.admin_notification_enabled,
        client_whatsapp_template: settings.client_whatsapp_template || '',
        admin_whatsapp_template: settings.admin_whatsapp_template || '',
      });
    }
  }, [settings, form]);

  const whatsappEnabled = form.watch('whatsapp_enabled');

  const onSubmit = (data: NotificationSettingsFormData) => {
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
          <Bell className="h-5 w-5" />
          Configuración de Notificaciones
        </CardTitle>
        <CardDescription>
          Configura cómo y cuándo se envían las notificaciones automáticas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="whatsapp_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Notificaciones WhatsApp
                      </FormLabel>
                      <FormDescription>
                        Habilita el envío automático de notificaciones por WhatsApp
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {whatsappEnabled && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="whatsapp_api_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la API de WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="https://api.whatsapp.com/send" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL del servicio de WhatsApp (ej: Twilio, Zapier, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp_api_token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de API</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Tu token secreto..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Token de autenticación para el servicio de WhatsApp
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="client_notification_enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Notificar a Clientes
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Enviar WhatsApp a clientes cuando se genere su cotización
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="admin_notification_enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Notificar a Administradores
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Enviar WhatsApp a administradores cuando se genere una cotización
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {whatsappEnabled && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="client_whatsapp_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template de WhatsApp para Clientes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Hola! Te hemos enviado tu cotización por correo electrónico. ¡Revisa tu bandeja de entrada! 🎉"
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Mensaje que se enviará a los clientes. Puedes usar {'{customerName}'} para personalizar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admin_whatsapp_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template de WhatsApp para Administradores</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nueva cotización generada para: {{customer_name}} - Total estimado: ${{total_estimate}}"
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Mensaje que se enviará a los administradores. Usa {'{customer_name}'} y {'{total_estimate}'} para personalizar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};