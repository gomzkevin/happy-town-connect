import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  customerName: string;
  email: string;
  phone?: string;
  eventDate?: string;
  childrenCount?: number;
  ageRange?: string;
  childName?: string;
  preferences?: string[];
  location?: string;
  services: {
    name: string;
    price: number;
    quantity: number;
  }[];
  totalEstimate: number;
}

const generateQuoteHTML = (data: QuoteEmailRequest) => {
  const servicesHTML = data.services.map(service => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; text-align: left;">${service.name}</td>
      <td style="padding: 12px; text-align: center;">${service.quantity}</td>
      <td style="padding: 12px; text-align: right;">$${service.price}</td>
      <td style="padding: 12px; text-align: right; font-weight: bold;">$${service.price * service.quantity}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu Cotización - JapiTown</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ff6b35; margin: 0;">🎉 JapiTown</h1>
        <p style="color: #666; font-size: 18px; margin: 10px 0;">¡Tu cotización está lista!</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hola ${data.customerName} 👋</h2>
        <p>Estamos emocionados de ser parte de la celebración de ${data.childName || 'tu pequeño'}. Aquí tienes los detalles de tu cotización personalizada:</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #ff6b35; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">📋 Detalles del Evento</h3>
        <ul style="list-style: none; padding: 0;">
          ${data.childName ? `<li style="padding: 5px 0;"><strong>Niño(a):</strong> ${data.childName}</li>` : ''}
          ${data.eventDate ? `<li style="padding: 5px 0;"><strong>Fecha:</strong> ${data.eventDate}</li>` : ''}
          ${data.childrenCount ? `<li style="padding: 5px 0;"><strong>Número de niños:</strong> ${data.childrenCount}</li>` : ''}
          ${data.ageRange ? `<li style="padding: 5px 0;"><strong>Edad:</strong> ${data.ageRange}</li>` : ''}
          ${data.location ? `<li style="padding: 5px 0;"><strong>Ubicación:</strong> ${data.location}</li>` : ''}
        </ul>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #ff6b35; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">🎪 Servicios Seleccionados</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #ff6b35; color: white;">
              <th style="padding: 12px; text-align: left;">Servicio</th>
              <th style="padding: 12px; text-align: center;">Cantidad</th>
              <th style="padding: 12px; text-align: right;">Precio</th>
              <th style="padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHTML}
          </tbody>
          <tfoot>
            <tr style="background: #f8f9fa; font-weight: bold; font-size: 18px;">
              <td colspan="3" style="padding: 15px; text-align: right;">Total Estimado:</td>
              <td style="padding: 15px; text-align: right; color: #ff6b35;">$${data.totalEstimate}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">💡 Próximos Pasos</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Revisaremos tu solicitud en las próximas 24 horas</li>
          <li>Te contactaremos para confirmar detalles y disponibilidad</li>
          <li>Finalizaremos los detalles de tu evento perfecto</li>
        </ol>
      </div>

      <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="color: #333; margin-top: 0;">¿Tienes preguntas?</h3>
        <p style="margin: 10px 0;">Estamos aquí para ayudarte a crear la fiesta perfecta</p>
        <div style="margin: 15px 0;">
          <a href="tel:+1234567890" style="display: inline-block; background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">📞 Llamar</a>
          <a href="https://wa.me/1234567890" style="display: inline-block; background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">💬 WhatsApp</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
        <p>JapiTown - Creando sonrisas, un evento a la vez 🎉</p>
        <p style="margin: 5px 0;">Este es un mensaje automático, por favor no responder a este email.</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const quoteData: QuoteEmailRequest = await req.json();

    console.log("Processing quote email for:", quoteData.email);

    // Send email to customer
    const emailResponse = await resend.emails.send({
      from: "JapiTown <no-reply@japitown.com>",
      to: [quoteData.email],
      subject: `🎉 Tu Cotización JapiTown - ${quoteData.childName ? `Fiesta de ${quoteData.childName}` : 'Tu Evento Especial'}`,
      html: generateQuoteHTML(quoteData),
    });

    console.log("Email sent successfully:", emailResponse);

    // TODO: Send internal notification
    // TODO: Send WhatsApp notification to customer
    // TODO: Send WhatsApp alert to admin

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cotización enviada exitosamente",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error al enviar la cotización",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);