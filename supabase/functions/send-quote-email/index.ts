import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { buildQuoteEmailData } from '../_shared/quote-email-data.ts';
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
    // Convert to base64 in chunks to avoid stack overflow
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const pdfBase64 = btoa(binary);

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

    const requestData: QuoteEmailRequest = await req.json();
    const { data: savedQuote, error: quoteError } = await supabase.from('quotes').select('*').eq('id', requestData.quoteId).single();
    if (quoteError || !savedQuote) throw new Error('Quote not found');
    const data = { ...requestData, quoteId: savedQuote.id, customerName: savedQuote.customer_name, email: savedQuote.email, phone: savedQuote.phone };
    console.log('Processing quote email for:', data.customerName);

    // Fetch settings + real services from DB in parallel
    const [companyResult, templateResult, notificationResult, quoteServicesResult] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('email_templates').select('*').eq('template_type', 'quote').eq('is_active', true).single(),
      supabase.from('notification_settings').select('*').single(),
      supabase.from('quote_services').select('id, service_id, service_name, service_price, quantity').eq('quote_id', data.quoteId),
    ]);

    const companySettings = companyResult.data;
    const emailTemplate = templateResult.data;
    const notificationSettings = notificationResult.data;
    const quoteServices = quoteServicesResult.data || [];

    if (quoteServicesResult.error) throw new Error('Failed to load saved quote services');
    const savedEmailData = buildQuoteEmailData(savedQuote, quoteServices);
    const servicesForEmail = savedEmailData.services;
    const calculatedTotal = savedEmailData.totalEstimate;
    const { quoteNumber, createdDate } = savedEmailData;

    // Generate PDF in parallel with email rendering
    const pdfPromise = generateAndDownloadPDF(data.quoteId, quoteNumber, data.customerName);

    const emailData = {
      ...savedEmailData,
      assetsBase: `${supabaseUrl}/storage/v1/object/public/japitown-assets`,
      companyName: companySettings?.company_name || 'Japitown',
      companyEmail: companySettings?.email || 'cotizaciones@japitown.com',
      companyPhone: companySettings?.phone,
      companyAddress: companySettings?.address,
      logoUrl: companySettings?.logo_url,
      services: servicesForEmail,
      totalEstimate: calculatedTotal,

      termsConditions: companySettings?.terms_conditions,
      quoteNumber,
      createdDate,
    };

    const pdfResult = await pdfPromise;
    const emailHtml = await renderAsync(React.createElement(QuoteEmailComplete, {
      ...emailData, pdfAttached: !!pdfResult,
    }));

    // Build email payload
    const emailSubject = emailTemplate?.subject ||
      `🎉 Tu cotización #${quoteNumber} de ${emailData.companyName} está lista`;

    // CRITICAL: 'from' must use a verified domain in Resend.
    // Customer-facing contact email goes in reply_to so replies reach the business inbox.
    const VERIFIED_SENDER = Deno.env.get('RESEND_FROM_EMAIL') || 'cotizaciones@japitown.com';
    const emailPayload: any = {
      from: `${emailData.companyName} <${VERIFIED_SENDER}>`,
      to: [data.email],
      reply_to: emailData.companyEmail ? [emailData.companyEmail] : undefined,
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
      const errMsg = emailResult.error.message || String(emailResult.error);
      console.error('❌ Resend send failed:', errMsg);
      await logQuoteHistory(data.quoteId, 'email_sent', data.email, 'failed', emailResult, errMsg);

      // Return 200 with success:false so frontend can warn user without crashing the flow.
      return new Response(
        JSON.stringify({
          success: false,
          emailSent: false,
          error: errMsg,
          quoteNumber,
          pdfAttached: !!pdfResult,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await logQuoteHistory(data.quoteId, 'email_sent', data.email, 'success', {
      email_id: emailResult.data?.id,
      services_count: servicesForEmail.length,
      total_estimate: calculatedTotal,
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
          ?.replace('{{total_estimate}}', calculatedTotal.toString()) ||
          `Nueva cotización para: ${data.customerName} - Total: $${calculatedTotal.toLocaleString()}`;
        const ok = await sendWhatsAppNotification(companySettings.whatsapp_number, msg, notificationSettings);
        await logQuoteHistory(data.quoteId, 'whatsapp_sent', companySettings.whatsapp_number, ok ? 'success' : 'failed');
      }
    }

    console.log('✅ Quote email sent:', emailResult.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: true,
        emailId: emailResult.data?.id,
        quoteNumber,
        pdfAttached: !!pdfResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-quote-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred', success: false, emailSent: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
