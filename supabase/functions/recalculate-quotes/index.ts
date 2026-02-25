import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Same pricing logic as src/lib/pricing.ts
const TIERS = [
  { limite: 15, multiplicador: 1.0 },
  { limite: 30, multiplicador: 1.3 },
  { limite: 50, multiplicador: 1.5 },
  { limite: Infinity, multiplicador: 1.8 },
];

function getMultiplicador(n: number): number {
  for (const t of TIERS) {
    if (n <= t.limite) return t.multiplicador;
  }
  return 1.8;
}

interface ServiceInfo {
  base_price: number;
  category: string;
}

function recalculate(
  items: { id: string; service_id: string }[],
  serviceMap: Map<string, ServiceInfo>,
  childrenCount: number
): { perItem: Map<string, number>; total: number } | null {
  // Classify
  const estaciones: { id: string; base_price: number }[] = [];
  const talleres: { id: string; base_price: number }[] = [];
  const otros: { id: string; base_price: number }[] = [];

  for (const item of items) {
    const svc = serviceMap.get(item.service_id);
    if (!svc) return null; // unknown service → skip quote
    const entry = { id: item.id, base_price: svc.base_price };
    if (svc.category === "Estaciones de Juego") estaciones.push(entry);
    else if (svc.category === "Talleres Creativos") talleres.push(entry);
    else otros.push(entry);
  }

  const perItem = new Map<string, number>();

  // Estaciones — pair pricing
  if (estaciones.length === 1) {
    perItem.set(estaciones[0].id, estaciones[0].base_price);
  } else if (estaciones.length >= 2) {
    const totalEst =
      Math.floor(estaciones.length / 2) * 3000 +
      (estaciones.length % 2) * 1800;
    const perStation = Math.round(totalEst / estaciones.length);
    const remainder = totalEst - perStation * estaciones.length;
    estaciones.forEach((s, i) => {
      perItem.set(s.id, perStation + (i === 0 ? remainder : 0));
    });
  }

  // Talleres — multiplicador
  const mult = getMultiplicador(childrenCount || 15);
  talleres.forEach((s) => {
    perItem.set(s.id, Math.round(s.base_price * mult));
  });

  // Otros — base_price directo
  otros.forEach((s) => {
    perItem.set(s.id, s.base_price);
  });

  let total = 0;
  perItem.forEach((v) => (total += v));
  return { perItem, total };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch all services
    const { data: services, error: svcErr } = await sb
      .from("services")
      .select("id, base_price, category");
    if (svcErr) throw svcErr;

    const serviceMap = new Map<string, ServiceInfo>();
    for (const s of services || []) {
      serviceMap.set(s.id, {
        base_price: s.base_price,
        category: s.category,
      });
    }

    // 2. Fetch active quotes
    const { data: quotes, error: qErr } = await sb
      .from("quotes")
      .select("id, children_count, total_estimate, deposit_amount")
      .in("status", ["pending", "contacted", "confirmed"]);
    if (qErr) throw qErr;

    let updated = 0;
    let skipped = 0;

    for (const quote of quotes || []) {
      // 3. Fetch quote_services
      const { data: qsItems, error: qsErr } = await sb
        .from("quote_services")
        .select("id, service_id")
        .eq("quote_id", quote.id);
      if (qsErr || !qsItems?.length) {
        skipped++;
        continue;
      }

      const result = recalculate(qsItems, serviceMap, quote.children_count || 15);
      if (!result) {
        skipped++;
        continue;
      }

      // 4. Update each quote_service price
      for (const [qsId, price] of result.perItem) {
        await sb
          .from("quote_services")
          .update({ service_price: price })
          .eq("id", qsId);
      }

      // 5. Update quote totals
      const depositAmount = Math.round(result.total * 0.5);
      await sb
        .from("quotes")
        .update({
          total_estimate: result.total,
          deposit_amount: depositAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.id);

      updated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        skipped,
        total_quotes: (quotes || []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("recalculate-quotes error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
