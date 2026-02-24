import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { email, role, inviterEmail } = await req.json();
    if (!email) throw new Error("Email is required");

    const signupUrl = `https://happy-town-connect.lovable.app/auth`;
    const roleName = role === "admin" ? "Administrador" : "Operador";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #FF6B6B, #FF8E53); padding: 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 24px;">🎉 Japitown</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">¡Te han invitado al equipo!</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        <strong>${inviterEmail || 'Un administrador'}</strong> te ha invitado a unirte al equipo de <strong>Japitown</strong> como <strong>${roleName}</strong>.
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Para aceptar la invitación, ingresa tu email (<strong>${email}</strong>) y haz clic en <strong>"Registrarme con invitación"</strong> en el siguiente enlace:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Crear mi cuenta
        </a>
      </div>
    </div>
    <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">Japitown · Fiestas Infantiles</p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Japitown <cotizaciones@japitown.com>",
        to: [email],
        subject: `🎉 Te han invitado al equipo de Japitown como ${roleName}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Resend error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
