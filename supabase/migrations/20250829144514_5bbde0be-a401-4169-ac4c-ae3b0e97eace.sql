-- Create company settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'JapiTown',
  email TEXT NOT NULL DEFAULT 'cotizaciones@japitown.com',
  phone TEXT,
  whatsapp_number TEXT,
  address TEXT,
  terms_conditions TEXT,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company settings
CREATE POLICY "Company settings are viewable by everyone" 
ON public.company_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage company settings" 
ON public.company_settings 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  template_type TEXT NOT NULL DEFAULT 'quote',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email templates
CREATE POLICY "Email templates are viewable by everyone" 
ON public.email_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_api_url TEXT,
  whatsapp_api_token TEXT,
  client_notification_enabled BOOLEAN NOT NULL DEFAULT true,
  admin_notification_enabled BOOLEAN NOT NULL DEFAULT true,
  client_whatsapp_template TEXT,
  admin_whatsapp_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification settings
CREATE POLICY "Notification settings are viewable by admins" 
ON public.notification_settings 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage notification settings" 
ON public.notification_settings 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create quote history table
CREATE TABLE public.quote_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'email_sent', 'pdf_generated', 'whatsapp_sent'
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'pending'
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_history ENABLE ROW LEVEL SECURITY;

-- Create policies for quote history
CREATE POLICY "Quote history viewable by admins" 
ON public.quote_history 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Quote history insertable by everyone" 
ON public.quote_history 
FOR INSERT 
WITH CHECK (true);

-- Add update triggers
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default company settings
INSERT INTO public.company_settings (
  company_name,
  email,
  phone,
  whatsapp_number,
  address,
  terms_conditions,
  website_url
) VALUES (
  'JapiTown - Entretenimiento Infantil',
  'cotizaciones@japitown.com',
  '+52 (555) 123-4567',
  '+525551234567',
  'Ciudad de México, México',
  'Términos y condiciones: El servicio incluye todo el material necesario. Se requiere un anticipo del 50% para confirmar la reservación. Cancelaciones con menos de 48 horas de anticipación no son reembolsables.',
  'https://japitown.com'
);

-- Insert default email template
INSERT INTO public.email_templates (
  name,
  subject,
  html_content,
  template_type
) VALUES (
  'Cotización JapiTown',
  '🎉 Tu cotización personalizada de JapiTown está lista',
  '<html><body><h1>¡Gracias por contactar a JapiTown!</h1><p>Adjunto encontrarás tu cotización personalizada.</p></body></html>',
  'quote'
);

-- Insert default notification settings
INSERT INTO public.notification_settings (
  whatsapp_enabled,
  client_notification_enabled,
  admin_notification_enabled,
  client_whatsapp_template,
  admin_whatsapp_template
) VALUES (
  false,
  true,
  true,
  'Hola! Te hemos enviado tu cotización de JapiTown por correo electrónico. Por favor revisa tu bandeja de entrada. ¡Esperamos hacer realidad la fiesta de tus sueños! 🎉',
  'Nueva cotización generada para: {{customer_name}} - Total estimado: ${{total_estimate}}'
);