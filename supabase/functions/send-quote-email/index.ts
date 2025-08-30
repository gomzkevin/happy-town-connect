import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { QuoteEmailComplete } from './_templates/quote-email-complete.tsx';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

// Initialize RESEND_API_KEY validation (exactly like version 6 that worked)
const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log("🔧 RESEND_API_KEY validation:", resendApiKey ? "Key found" : "Key missing");

// Initialize Resend client globally
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  quoteId: string; // UUID from the database
  customerName: string;
  email: string;
  phone?: string;
  eventDate?: string;
  childrenCount?: number;
  ageRange?: string;
  childName?: string;
  preferences?: string[];
  location?: string;
  services: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalEstimate: number;
}


// Send WhatsApp notification
async function sendWhatsAppNotification(
  phoneNumber: string, 
  message: string, 
  settings: any
): Promise<boolean> {
  if (!settings?.whatsapp_enabled || !settings?.whatsapp_api_url) {
    return false;
  }

  try {
    const response = await fetch(settings.whatsapp_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.whatsapp_api_token}`,
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
        type: 'text'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return false;
  }
}

// Log to quote history
async function logQuoteHistory(
  quoteId: string,
  actionType: string,
  recipient: string,
  status: string,
  metadata?: any,
  errorMessage?: string
) {
  try {
    await supabase.from('quote_history').insert({
      quote_id: quoteId,
      action_type: actionType,
      recipient: recipient,
      status: status,
      metadata: metadata,
      error_message: errorMessage
    });
  } catch (error) {
    console.error('Failed to log quote history:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔔 Request received:", req.method);
  
  // Handle CORS preflight requests (always return 200)
  if (req.method === "OPTIONS") {
    console.log("✅ CORS preflight request handled");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log("📧 Processing quote email request...");
    
    const data: QuoteEmailRequest = await req.json();
    console.log('Processing quote email request for:', data.customerName);

    // Get company settings and templates from database
    const [companyResult, templateResult, notificationResult] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('email_templates').select('*').eq('template_type', 'quote').eq('is_active', true).single(),
      supabase.from('notification_settings').select('*').single()
    ]);

    const companySettings = companyResult.data;
    const emailTemplate = templateResult.data;
    const notificationSettings = notificationResult.data;

    // Generate quote number and current date
    const quoteNumber = `QUO-${Date.now().toString().slice(-6)}`;
    const createdDate = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare email data
    const emailData = {
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      companyName: companySettings?.company_name || 'Japitown',
      companyEmail: companySettings?.email || 'cotizaciones@japitown.com',
      companyPhone: companySettings?.phone,
      companyAddress: companySettings?.address,
      logoUrl: companySettings?.logo_url,
      services: data.services,
      totalEstimate: data.totalEstimate,
      eventDate: data.eventDate,
      childrenCount: data.childrenCount,
      location: data.location,
      termsConditions: companySettings?.terms_conditions,
      quoteNumber,
      createdDate,
    };

    // Generate complete email HTML with all quote information
    const emailHtml = await renderAsync(
      React.createElement(QuoteEmailComplete, emailData)
    );

    // Send email without PDF attachment
    const emailSubject = emailTemplate?.subject || `🎉 Tu cotización #${quoteNumber} de ${emailData.companyName} está lista`;
    
    const emailResult = await resend.emails.send({
      from: `${emailData.companyName} <${emailData.companyEmail}>`,
      to: [data.email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResult.error) {
      await logQuoteHistory(data.quoteId, 'email_sent', data.email, 'failed', emailResult, emailResult.error.message);
      throw emailResult.error;
    }

    await logQuoteHistory(data.quoteId, 'email_sent', data.email, 'success', {
      email_id: emailResult.data?.id,
      services_count: data.services.length,
      total_estimate: data.totalEstimate,
      format: 'html_email',
      quote_number: quoteNumber
    });

    // Send WhatsApp notifications if enabled
    if (notificationSettings?.whatsapp_enabled) {
      // Client notification
      if (notificationSettings.client_notification_enabled && data.phone) {
        const clientMessage = notificationSettings.client_whatsapp_template || 
          `Hola ${data.customerName}! Te hemos enviado tu cotización por correo electrónico. ¡Revisa tu bandeja de entrada! 🎉`;
        
        const clientWhatsAppSuccess = await sendWhatsAppNotification(
          data.phone,
          clientMessage,
          notificationSettings
        );

        await logQuoteHistory(
          data.quoteId, 
          'whatsapp_sent', 
          data.phone, 
          clientWhatsAppSuccess ? 'success' : 'failed'
        );
      }

      // Admin notification
      if (notificationSettings.admin_notification_enabled && companySettings?.whatsapp_number) {
        const adminMessage = notificationSettings.admin_whatsapp_template
          ?.replace('{{customer_name}}', data.customerName)
          ?.replace('{{total_estimate}}', data.totalEstimate.toString()) ||
          `Nueva cotización generada para: ${data.customerName} - Total estimado: $${data.totalEstimate.toLocaleString()}`;
        
        const adminWhatsAppSuccess = await sendWhatsAppNotification(
          companySettings.whatsapp_number,
          adminMessage,
          notificationSettings
        );

        await logQuoteHistory(
          data.quoteId, 
          'whatsapp_sent', 
          companySettings.whatsapp_number, 
          adminWhatsAppSuccess ? 'success' : 'failed'
        );
      }
    }

    console.log('Quote email sent successfully:', emailResult.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.data?.id,
        quoteNumber: quoteNumber
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);