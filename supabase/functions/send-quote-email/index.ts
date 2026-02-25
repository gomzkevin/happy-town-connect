import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { QuoteEmailComplete } from './_templates/quote-email-complete.tsx';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Initialize Resend
const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log("🔧 RESEND_API_KEY validation:", resendApiKey ? "Key found" : "Key missing");

let resend: Resend | null = null;
if (resendApiKey) {
  try {
    resend = new Resend(resendApiKey);
    console.log("✅ Resend client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Resend client:", error.message);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  quoteId: string;
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
    category?: string;
  }>;
  totalEstimate: number;
}

// ─── PDF Generation & Download ──────────────────────────────────

async function generateAndDownloadPDF(
  quoteId: string,
  quoteNumber: string,
  customerName: string
): Promise<{ pdfBase64: string; filename: string } | null> {
  try {
    console.log(`📄 Generating PDF for quote ${quoteId}...`);

    // Call generate-quote edge function internally
    const generateUrl = `${supabaseUrl}/functions/v1/generate-quote?output=storage`;
    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({ quoteId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ generate-quote failed (${response.status}):`, errorText);
      return null;
    }

    const result = await response.json();
    const pdfUrl = result.pdf_url;

    if (!pdfUrl) {
      console.error('❌ No pdf_url returned from generate-quote');
      return null;
    }

    console.log(`📥 Downloading PDF from: ${pdfUrl}`);

    // Download the PDF bytes
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`❌ Failed to download PDF (${pdfResponse.status})`);
      return null;
    }

    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    // Sanitize filename
    const safeName = customerName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 40) || "cliente";

    const filename = `Cotizacion-Japitown-${safeName}-${quoteNumber}.pdf`;

    console.log(`✅ PDF ready: ${filename} (${pdfBytes.length} bytes)`);
    return { pdfBase64, filename };
  } catch (error) {
    console.error('❌ PDF generation/download error:', error);
    return null;
  }
}

// ─── WhatsApp Notification ──────────────────────────────────────

async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string,
  settings: any
): Promise<boolean> {
  if (!settings?.whatsapp_enabled || !settings?.whatsapp_api_url) return false;
  try {
    const response = await fetch(settings.whatsapp_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.whatsapp_api_token}`,
      },
      body: JSON.stringify({ to: phoneNumber, message, type: 'text' }),
    });
    return response.ok;
  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return false;
  }
}

// ─── Quote History Logger ───────────────────────────────────────

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
      recipient,
      status,
      metadata,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log quote history:', error);
  }
}

// ─── Main Handler ───────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  console.log("🔔 Request received:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!resend) {
      throw new Error("Email service is not properly configured. Please check RESEND_API_KEY.");
    }

    const data: QuoteEmailRequest = await req.json();
    console.log('Processing quote email for:', data.customerName);

    // Fetch settings in parallel
    const [companyResult, templateResult, notificationResult] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('email_templates').select('*').eq('template_type', 'quote').eq('is_active', true).single(),
      supabase.from('notification_settings').select('*').single(),
    ]);

    const companySettings = companyResult.data;
    const emailTemplate = templateResult.data;
    const notificationSettings = notificationResult.data;

    const quoteNumber = `QUO-${Date.now().toString().slice(-6)}`;
    const createdDate = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // Generate PDF in parallel with email rendering
    const pdfPromise = generateAndDownloadPDF(data.quoteId, quoteNumber, data.customerName);

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

    const [emailHtml, pdfResult] = await Promise.all([
      renderAsync(React.createElement(QuoteEmailComplete, emailData)),
      pdfPromise,
    ]);

    // Build email payload
    const emailSubject = emailTemplate?.subject ||
      `🎉 Tu cotización #${quoteNumber} de ${emailData.companyName} está lista`;

    const emailPayload: any = {
      from: `${emailData.companyName} <${emailData.companyEmail}>`,
      to: [data.email],
      subject: emailSubject,
      html: emailHtml,
    };

    // Attach PDF if available
    if (pdfResult) {
      emailPayload.attachments = [{
        filename: pdfResult.filename,
        content: pdfResult.pdfBase64,
      }];
      console.log(`📎 PDF attached: ${pdfResult.filename}`);
    } else {
      console.warn('⚠️ PDF not available, sending email without attachment');
    }

    const emailResult = await resend.emails.send(emailPayload);

    if (emailResult.error) {
      await logQuoteHistory(data.quoteId, 'email_sent', data.email, 'failed', emailResult, emailResult.error.message);
      throw emailResult.error;
    }

    await logQuoteHistory(data.quoteId, 'email_sent', data.email, 'success', {
      email_id: emailResult.data?.id,
      services_count: data.services.length,
      total_estimate: data.totalEstimate,
      format: 'html_email_with_pdf',
      pdf_attached: !!pdfResult,
      quote_number: quoteNumber,
    });

    // WhatsApp notifications
    if (notificationSettings?.whatsapp_enabled) {
      if (notificationSettings.client_notification_enabled && data.phone) {
        const msg = notificationSettings.client_whatsapp_template ||
          `Hola ${data.customerName}! Te hemos enviado tu cotización por correo electrónico. ¡Revisa tu bandeja de entrada! 🎉`;
        const ok = await sendWhatsAppNotification(data.phone, msg, notificationSettings);
        await logQuoteHistory(data.quoteId, 'whatsapp_sent', data.phone, ok ? 'success' : 'failed');
      }

      if (notificationSettings.admin_notification_enabled && companySettings?.whatsapp_number) {
        const msg = notificationSettings.admin_whatsapp_template
          ?.replace('{{customer_name}}', data.customerName)
          ?.replace('{{total_estimate}}', data.totalEstimate.toString()) ||
          `Nueva cotización para: ${data.customerName} - Total: $${data.totalEstimate.toLocaleString()}`;
        const ok = await sendWhatsAppNotification(companySettings.whatsapp_number, msg, notificationSettings);
        await logQuoteHistory(data.quoteId, 'whatsapp_sent', companySettings.whatsapp_number, ok ? 'success' : 'failed');
      }
    }

    console.log('✅ Quote email sent:', emailResult.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.data?.id,
        quoteNumber,
        pdfAttached: !!pdfResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-quote-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred', success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
