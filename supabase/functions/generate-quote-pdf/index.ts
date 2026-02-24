import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    if (!quoteId) {
      return new Response(JSON.stringify({ error: "quoteId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch quote data
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found", details: quoteError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch quote services
    const { data: services } = await supabase
      .from("quote_services")
      .select("*")
      .eq("quote_id", quoteId);

    // Fetch company settings
    const { data: companyArr } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1);
    const company = companyArr?.[0] || {
      company_name: "JapiTown",
      email: "cotizaciones@japitown.com",
      phone: null,
      address: null,
      terms_conditions: null,
    };

    // Generate PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(company.company_name || "JapiTown", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    if (company.email) { doc.text(company.email, margin, y); y += 4; }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, y); y += 4; }
    if (company.address) { doc.text(company.address, margin, y); y += 4; }
    y += 4;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("COTIZACIÓN", margin, y);

    // Quote number & date on right side
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const quoteDate = new Date(quote.created_at).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
    });
    doc.text(`Fecha: ${quoteDate}`, pageWidth - margin, y - 6, { align: "right" });
    doc.text(`No: ${quoteId.slice(0, 8).toUpperCase()}`, pageWidth - margin, y - 1, { align: "right" });
    y += 8;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Client info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Datos del cliente", margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const clientLines = [
      `Nombre: ${quote.customer_name}`,
      `Email: ${quote.email}`,
    ];
    if (quote.phone) clientLines.push(`Teléfono: ${quote.phone}`);
    if (quote.location) clientLines.push(`Ubicación: ${quote.location}`);
    clientLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;

    // Event info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del evento", margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const eventLines: string[] = [];
    if (quote.event_date) {
      const evDate = new Date(quote.event_date + "T12:00:00").toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric",
      });
      eventLines.push(`Fecha del evento: ${evDate}`);
    }
    if (quote.child_name) eventLines.push(`Festejado(a): ${quote.child_name}`);
    if (quote.children_count) eventLines.push(`Número de niños: ${quote.children_count}`);
    if (quote.age_range) eventLines.push(`Rango de edad: ${quote.age_range}`);
    eventLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 6;

    // Services table
    if (services && services.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Servicios", margin, y);
      y += 6;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, contentWidth, 7, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("Servicio", margin + 2, y);
      doc.text("Cant.", margin + contentWidth * 0.6, y);
      doc.text("P. Unit.", margin + contentWidth * 0.72, y);
      doc.text("Subtotal", margin + contentWidth - 2, y, { align: "right" });
      y += 6;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      services.forEach((s: any) => {
        const subtotal = s.service_price * s.quantity;
        doc.text(s.service_name, margin + 2, y);
        doc.text(String(s.quantity), margin + contentWidth * 0.62, y);
        doc.text(`$${s.service_price.toLocaleString()}`, margin + contentWidth * 0.72, y);
        doc.text(`$${subtotal.toLocaleString()}`, margin + contentWidth - 2, y, { align: "right" });
        y += 5;
      });

      // Total
      y += 2;
      doc.line(margin + contentWidth * 0.6, y, pageWidth - margin, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Total:", margin + contentWidth * 0.6, y);
      doc.text(`$${(quote.total_estimate || 0).toLocaleString()} MXN`, margin + contentWidth - 2, y, { align: "right" });
      y += 10;
    }

    // Notes
    if (quote.notes) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Notas", margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(quote.notes, contentWidth);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 6;
    }

    // Terms
    if (company.terms_conditions) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      const termsLines = doc.splitTextToSize(company.terms_conditions, contentWidth);
      // Check if we need a new page
      if (y + termsLines.length * 3.5 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text("Términos y condiciones:", margin, y);
      y += 4;
      doc.text(termsLines, margin, y);
    }

    // Convert to Uint8Array
    const pdfBytes = doc.output("arraybuffer");
    const pdfUint8 = new Uint8Array(pdfBytes);

    // Upload to storage
    const fileName = `cotizacion-${quoteId.slice(0, 8)}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("quote-pdfs")
      .upload(fileName, pdfUint8, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF", details: uploadError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("quote-pdfs")
      .getPublicUrl(fileName);
    const pdfUrl = urlData.publicUrl;

    // Update quote with PDF URL
    await supabase
      .from("quotes")
      .update({ pdf_url: pdfUrl })
      .eq("id", quoteId);

    return new Response(
      JSON.stringify({ success: true, pdf_url: pdfUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
