// ═══════════════════════════════════════════════════════════════
// generate-quote — Supabase Edge Function
// Generates branded PDF quotes for Japitown using pdf-lib
// Combines renderer-v2 logic with Edge Function boilerplate
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ──────────────────────────────────────────────────────
interface QuoteRequest {
  cliente: string;
  n_ninos: number;
  horas: number;
  fecha: string;
  estaciones?: string[];
  fijos?: string[];
  talleres?: string[];
  hora_evento?: string;
  fecha_emision?: string;
  vigencia?: string;
  notas_extra?: string[];
  anticipo_pct?: number;
  cancelacion?: boolean;
  titulo?: string;
  subtitulo?: string;
  logistics_fee?: number;
}

interface FontSet {
  bold: PDFFont;
  medium: PDFFont;
  regular: PDFFont;
  light: PDFFont;
}

interface CardData {
  tipo: "fijo" | "taller" | "estacion_resumen";
  key: string;
  nombre: string;
  precio: number;
  subtitulo: string;
  items: string[];
  color: string;
}

interface CardSizes {
  width: number;
  gap: number;
  bandH: number;
  titleSz: number;
  subSz: number;
  priceSz: number;
  itemSz: number;
  itemSpacing: number;
  padX: number;
  bulletR: number;
  bodyPadTop: number;
  bodyPadBot: number;
}

type LayoutBlock =
  | { tipo: "estacion_resumen"; estaciones: string[]; precio: number }
  | { tipo: "fila_cards"; cards: CardData[]; cardsPerRow: number };

interface DBService {
  id: string;
  title: string;
  category: string;
  base_price: number;
  hora_extra: number;
  features: string[] | null;
  pdf_color: string;
  pdf_subtitle: string | null;
}

// deno-lint-ignore no-explicit-any
type PDFImage = any;

// ─── Icon Maps ──────────────────────────────────────────────────
// Note: Service icons (01-12) are NOT used in PDFs, only in the web app.
// Only decorative icons (13-19) are used in the PDF cotización.

// Decorative icons for scattered placement and footer band (only 13-19)
const DECORATIVE_ICON_PATHS: string[] = [
  "icons/Iconos-13.png", // Espiral
  "icons/Iconos-14.png", // Flor
  "icons/Iconos-15.png", // Nube
  "icons/Iconos-16.png", // Talleres
  "icons/Iconos-17.png", // Estrella
  "icons/Iconos-18.png", // Decorativo
  "icons/Iconos-19.png", // Sol
];


// ─── Asset Fetching & Icon Loading ──────────────────────────────
// CPU-optimized: only loads service icons actually needed for this quote.
// Decorative icons and logo use geometric fallbacks to save CPU.

async function fetchAsset(baseUrl: string, path: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout per asset
  try {
    const res = await fetch(`${baseUrl}/${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to fetch asset: ${path} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

interface IconCache {
  service: Map<string, PDFImage>;    // service key → embedded image
  decorative: PDFImage[];            // array of decorative icons (empty = use geometric fallback)
  logo: PDFImage | null;             // null = use text fallback
}

async function loadAllIcons(
  pdfDoc: InstanceType<typeof PDFDocument>,
): Promise<IconCache> {
  const storageUrl = Deno.env.get("SUPABASE_URL") + "/storage/v1/object/public/japitown-assets";
  const cache: IconCache = { service: new Map(), decorative: [], logo: null };

  // Only load decorative icons (13-19) — service icons are NOT used in PDFs.
  // Load sequentially to minimize peak CPU usage (embedPng is heavy).
  for (const path of DECORATIVE_ICON_PATHS) {
    try {
      const bytes = await fetchAsset(storageUrl, path);
      const image = await pdfDoc.embedPng(bytes);
      cache.decorative.push(image);
    } catch (e) {
      console.warn(`Failed to load decorative icon ${path}:`, e);
      cache.decorative.push(null);
    }
  }

  return cache;
}

// Service icons not used in PDF — only in web app

// ─── Page Constants ─────────────────────────────────────────────
const W = 612;
const H = 792;
const ML = 42;
const MR = 42;
const CW = W - ML - MR; // 528

// ─── Colors ─────────────────────────────────────────────────────
const C = {
  // Background & structure
  bg:       rgb(0.976, 0.965, 0.953),
  brown:    rgb(0.737, 0.659, 0.627),
  brown_lt: rgb(0.831, 0.769, 0.737),
  cream:    rgb(0.953, 0.918, 0.898),
  lcream:   rgb(1.0, 0.965, 0.886),
  offwhite: rgb(0.992, 0.984, 0.976),

  // Text
  dark:     rgb(0.306, 0.310, 0.310),
  dlt:      rgb(0.494, 0.498, 0.498),
  white:    rgb(1, 1, 1),

  // Accent colors
  pink:     rgb(0.973, 0.761, 0.667),
  blue:     rgb(0.608, 0.761, 0.898),
  green:    rgb(0.518, 0.737, 0.439),
  yellow:   rgb(0.965, 0.733, 0.220),
  red:      rgb(0.914, 0.369, 0.239),
  purple:   rgb(0.643, 0.565, 0.769),
  orange:   rgb(0.949, 0.682, 0.459),

  // Decorative icon colors
  ico_pink:    rgb(0.949, 0.725, 0.757),
  ico_blue:    rgb(0.565, 0.741, 0.886),
  ico_green:   rgb(0.518, 0.737, 0.439),
  ico_yellow:  rgb(0.965, 0.800, 0.220),
  ico_red:     rgb(0.914, 0.463, 0.357),
  ico_orange:  rgb(0.949, 0.682, 0.459),
  ico_purple:  rgb(0.706, 0.604, 0.808),
  ico_teal:    rgb(0.494, 0.757, 0.757),

  // Card band colors
  band_purple: rgb(0.745, 0.667, 0.824),
  band_pink:   rgb(0.941, 0.769, 0.706),
  band_blue:   rgb(0.690, 0.808, 0.910),
  band_green:  rgb(0.647, 0.835, 0.573),
  band_yellow: rgb(0.965, 0.843, 0.494),
  band_red:    rgb(0.925, 0.620, 0.545),

  // Card outline colors
  outline_purple: rgb(0.878, 0.835, 0.918),
  outline_pink:   rgb(0.973, 0.890, 0.855),
  outline_blue:   rgb(0.843, 0.902, 0.953),
  outline_green:  rgb(0.808, 0.914, 0.757),
  outline_yellow: rgb(0.988, 0.933, 0.757),
  outline_red:    rgb(0.969, 0.808, 0.773),

  // Bullet colors
  bullet_purple: rgb(0.576, 0.478, 0.698),
  bullet_pink:   rgb(0.914, 0.596, 0.522),
  bullet_blue:   rgb(0.416, 0.639, 0.804),
  bullet_green:  rgb(0.384, 0.620, 0.302),
  bullet_yellow: rgb(0.878, 0.659, 0.133),
  bullet_red:    rgb(0.831, 0.306, 0.200),

  // Rainbow stripe colors
  rainbow: [
    rgb(0.914, 0.369, 0.239),  // red
    rgb(0.949, 0.682, 0.459),  // orange
    rgb(0.965, 0.800, 0.220),  // yellow
    rgb(0.518, 0.737, 0.439),  // green
    rgb(0.416, 0.639, 0.804),  // blue
    rgb(0.576, 0.478, 0.698),  // purple
    rgb(0.914, 0.596, 0.522),  // pink
  ],
};

const BAND_MAP = {
  blue: C.band_blue, yellow: C.band_yellow, red: C.band_red,
  green: C.band_green, pink: C.band_pink, purple: C.band_purple,
};
const OUTLINE_MAP = {
  blue: C.outline_blue, yellow: C.outline_yellow, red: C.outline_red,
  green: C.outline_green, pink: C.outline_pink, purple: C.outline_purple,
};
const BULLET_MAP = {
  blue: C.bullet_blue, yellow: C.bullet_yellow, red: C.bullet_red,
  green: C.bullet_green, pink: C.bullet_pink, purple: C.bullet_purple,
};

// ─── Card Sizes by columns ──────────────────────────────────────
const CARD_SIZES: Record<number, CardSizes> = {
  1: { width: CW * 0.58, gap: 0, bandH: 48, titleSz: 14, subSz: 7.5, priceSz: 18, itemSz: 7.5, itemSpacing: 13, padX: 16, bulletR: 2.5, bodyPadTop: 14, bodyPadBot: 12 },
  2: { width: (CW - 18) / 2, gap: 18, bandH: 44, titleSz: 13, subSz: 7, priceSz: 16, itemSz: 7.2, itemSpacing: 12, padX: 14, bulletR: 2.2, bodyPadTop: 12, bodyPadBot: 10 },
  3: { width: (CW - 24) / 3, gap: 12, bandH: 38, titleSz: 11, subSz: 6, priceSz: 13, itemSz: 6.5, itemSpacing: 10, padX: 12, bulletR: 1.8, bodyPadTop: 10, bodyPadBot: 8 },
};

// ─── Service Classification (dynamic from DB) ──────────────────
// Categories are derived from the `services` table at runtime.
// No hardcoded lists — the DB is the single source of truth.
function deriveServiceSets(dbServices: Map<string, DBService>): {
  estacionIds: Set<string>;
  fijoIds: Set<string>;
  tallerIds: Set<string>;
} {
  const estacionIds = new Set<string>();
  const fijoIds = new Set<string>();
  const tallerIds = new Set<string>();
  for (const [id, svc] of dbServices) {
    const cat = svc.category?.toLowerCase() || "";
    if (cat.includes("estacion") || cat.includes("juego")) {
      estacionIds.add(id);
    } else if (cat.includes("taller") || cat.includes("creativ")) {
      tallerIds.add(id);
    } else {
      fijoIds.add(id);
    }
  }
  return { estacionIds, fijoIds, tallerIds };
}

// ─── Catalogs REMOVED ───────────────────────────────────────────
// All service data (name, color, subtitle, features, price) now comes
// exclusively from the `services` table via dbServices Map.
// No hardcoded catalogs remain — the DB is the single source of truth.

// ─── Pricing ────────────────────────────────────────────────────
const TIERS = [
  { limite: 15, multiplicador: 1.0 },
  { limite: 30, multiplicador: 1.3 },
  { limite: 50, multiplicador: 1.5 },
  { limite: Infinity, multiplicador: 1.8 },
];

function getMultiplicador(nNinos: number): number {
  for (const tier of TIERS) {
    if (nNinos <= tier.limite) return tier.multiplicador;
  }
  return 1.8;
}

function precioEstaciones(n: number, dbServices?: Map<string, DBService>, estacionIds?: string[]): number {
  if (n === 0) return 0;
  if (n === 1) {
    // For a single station, use its base_price from DB, or fallback to 1800
    if (dbServices && estacionIds && estacionIds.length > 0) {
      const svc = dbServices.get(estacionIds[0]);
      if (svc) return svc.base_price;
    }
    return 1800;
  }
  return Math.floor(n / 2) * 3000 + (n % 2) * 1800;
}

function precioTaller(dbPrice: number, nNinos: number): number {
  return Math.round(dbPrice * getMultiplicador(nNinos));
}

function calcularTotal(
  config: QuoteRequest,
  dbServices: Map<string, DBService>
): { total: number; desglose: Record<string, number> } {
  let total = 0;
  const desglose: Record<string, number> = {};

  const nEst = config.estaciones?.length ?? 0;
  if (nEst >= 1) {
    const p = precioEstaciones(nEst, dbServices, config.estaciones);
    total += p;
    desglose.estaciones = p;
  }

  for (const key of config.fijos ?? []) {
    const p = dbServices?.get(key)?.base_price ?? 0;
    total += p;
    desglose[key] = p;
  }

  for (const key of config.talleres ?? []) {
    const dbSvc = dbServices?.get(key);
    const p = precioTaller(dbSvc?.base_price ?? 0, config.n_ninos);
    total += p;
    desglose[key] = p;
  }

  // Add logistics fee if present
  if (config.logistics_fee && config.logistics_fee > 0) {
    total += config.logistics_fee;
    desglose['logistics_fee'] = config.logistics_fee;
  }

  return { total, desglose };
}

// ─── Layout Engine ──────────────────────────────────────────────
function calcularLayout(config: QuoteRequest, dbServices: Map<string, DBService>): LayoutBlock[] {
  const bloques: LayoutBlock[] = [];
  const est = config.estaciones || [];
  const fij = config.fijos || [];
  const tal = config.talleres || [];

  const cards: CardData[] = [];

  if (est.length >= 2) {
    bloques.push({ tipo: "estacion_resumen", estaciones: est, precio: precioEstaciones(est.length, dbServices, est) });
  } else if (est.length === 1) {
    const key = est[0];
    const dbSvc = dbServices?.get(key);
    const precio = precioEstaciones(1, dbServices, est);
    cards.push({
      tipo: "fijo", key,
      nombre: dbSvc?.title || key,
      precio,
      subtitulo: dbSvc?.pdf_subtitle || "",
      items: dbSvc?.features || [],
      color: dbSvc?.pdf_color || "green",
    });
  }
  for (const key of fij) {
    const dbSvc = dbServices?.get(key);
    cards.push({
      tipo: "fijo", key,
      nombre: dbSvc?.title || key,
      precio: dbSvc?.base_price ?? 0,
      subtitulo: dbSvc?.pdf_subtitle || "",
      items: dbSvc?.features || [],
      color: dbSvc?.pdf_color || "blue",
    });
  }

  for (const key of tal) {
    const dbSvc = dbServices?.get(key);
    const precio = precioTaller(dbSvc?.base_price ?? 0, config.n_ninos);
    cards.push({
      tipo: "taller", key,
      nombre: dbSvc?.title || key,
      precio,
      subtitulo: dbSvc?.pdf_subtitle || "",
      items: dbSvc?.features || [],
      color: dbSvc?.pdf_color || "blue",
    });
  }

  console.log(`[DIAG calcularLayout] cards generados: ${cards.map(c => `${c.key}(${c.tipo})`).join(", ")} total=${cards.length}`);
  const filas = distribuirEnFilas(cards);
  for (const fila of filas) {
    bloques.push({ tipo: "fila_cards", cards: fila, cardsPerRow: fila.length });
  }
  console.log(`[DIAG calcularLayout] bloques totales: ${bloques.length}`);

  return bloques;
}

function distribuirEnFilas(cards: CardData[]): CardData[][] {
  const n = cards.length;
  if (n === 0) return [];
  if (n <= 3) return [cards];
  if (n === 4) return [cards.slice(0, 2), cards.slice(2)];
  if (n === 5) return [cards.slice(0, 2), cards.slice(2)];
  if (n === 6) return [cards.slice(0, 3), cards.slice(3)];
  if (n <= 9) return [cards.slice(0, 3), cards.slice(3, 6), cards.slice(6)];
  return [cards.slice(0, 3), cards.slice(3, 6), cards.slice(6, 9)];
}

// ─── Helpers ────────────────────────────────────────────────────
function formatPrice(amount: number): string {
  return "$" + amount.toLocaleString("es-MX");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function resolveDefaults(config: QuoteRequest): QuoteRequest {
  return {
    ...config,
    estaciones: config.estaciones || [],
    fijos: config.fijos || [],
    talleres: config.talleres || [],
    fecha_emision: config.fecha_emision || formatDate(new Date()),
    vigencia: config.vigencia || "15 días naturales",
    anticipo_pct: config.anticipo_pct ?? 50,
    cancelacion: config.cancelacion ?? true,
    notas_extra: config.notas_extra || [],
    titulo: config.titulo || `Cotización — ${config.cliente}`,
    subtitulo: config.subtitulo || generarSubtitulo(config),
  };
}

function generarSubtitulo(config: QuoteRequest): string {
  const nEst = config.estaciones?.length ?? 0;
  const nFij = config.fijos?.length ?? 0;
  const nTal = config.talleres?.length ?? 0;
  if (nEst > 0 && nFij === 0 && nTal === 0) return "Estaciones de mini ciudad para evento infantil";
  if (nTal > 0 && nEst === 0 && nFij === 0) return "Talleres creativos para evento infantil";
  if (nFij > 0 && nEst === 0 && nTal === 0) return "Servicios especiales para evento infantil";
  return "Propuesta personalizada para evento infantil";
}

function generarResumen(config: QuoteRequest): string {
  const parts: string[] = [];
  const nEst = config.estaciones?.length ?? 0;
  if (nEst >= 1) parts.push(`${nEst} ${nEst === 1 ? "estación" : "estaciones"}`);
  const nFij = config.fijos?.length ?? 0;
  if (nFij > 0) parts.push(`${nFij} ${nFij === 1 ? "servicio fijo" : "servicios fijos"}`);
  const nTal = config.talleres?.length ?? 0;
  if (nTal > 0) parts.push(`${nTal} ${nTal === 1 ? "taller creativo" : "talleres creativos"}`);
  return parts.join(" · ") + ` · ${config.n_ninos} niños · ${config.horas} horas`;
}

function generarCondiciones(config: QuoteRequest): string[] {
  const conds = [
    `El servicio tiene una duración de ${config.horas} horas.`,
    "Los precios incluyen personal operativo, material y montaje.",
    `Se requiere un anticipo del ${config.anticipo_pct}% para confirmar la reserva de fecha y servicio.`,
    `Cotización válida para evento de hasta ${config.n_ninos} niños.`,
    `Vigencia de la cotización: ${config.vigencia}.`,
  ];
  if (config.cancelacion) {
    conds.push("Una vez confirmada la reserva, el anticipo no es reembolsable en caso de cancelación.");
  }
  conds.push(...(config.notas_extra || []));
  return conds;
}

function generarNotaHoraExtra(config: QuoteRequest, dbServices: Map<string, DBService>): string {
  const parts: string[] = [];
  if ((config.estaciones?.length ?? 0) >= 1) {
    // Use hora_extra from first station, or default 500
    const firstSvc = dbServices?.get(config.estaciones![0]);
    const horaEst = firstSvc?.hora_extra ?? 500;
    parts.push(`$${horaEst.toLocaleString("es-MX")} por estación`);
  }
  const extras: Record<number, string[]> = {};
  for (const key of config.fijos ?? []) {
    const dbSvc = dbServices?.get(key);
    const p = dbSvc?.hora_extra ?? 500;
    (extras[p] ||= []).push(dbSvc?.title || key);
  }
  for (const key of config.talleres ?? []) {
    const dbSvc = dbServices?.get(key);
    const p = dbSvc?.hora_extra ?? 500;
    (extras[p] ||= []).push(dbSvc?.title || key);
  }
  for (const [precio, nombres] of Object.entries(extras).sort((a, b) => +b[0] - +a[0])) {
    parts.push(`$${Number(precio).toLocaleString("es-MX")} por ${nombres.length === 1 ? 'taller' : 'taller'}`);
  }
  if (parts.length === 0) return "";
  return parts.join(" · ") + " · Sujeto a disponibilidad";
}

// ─── Drawing Helpers ────────────────────────────────────────────

function drawRoundedRect(page: PDFPage, x: number, y: number, w: number, h: number, r: number, opts: any = {}) {
  const { color, borderColor, borderWidth } = opts;
  if (color) {
    page.drawRectangle({ x: x + r, y: y, width: w - 2 * r, height: h, color });
    page.drawRectangle({ x: x, y: y + r, width: w, height: h - 2 * r, color });
    page.drawCircle({ x: x + r, y: y + r, size: r, color });
    page.drawCircle({ x: x + w - r, y: y + r, size: r, color });
    page.drawCircle({ x: x + r, y: y + h - r, size: r, color });
    page.drawCircle({ x: x + w - r, y: y + h - r, size: r, color });
  }
  if (borderColor) {
    const bw = borderWidth || 0.5;
    page.drawLine({ start: { x: x + r, y: y + h }, end: { x: x + w - r, y: y + h }, color: borderColor, thickness: bw });
    page.drawLine({ start: { x: x + r, y: y }, end: { x: x + w - r, y: y }, color: borderColor, thickness: bw });
    page.drawLine({ start: { x: x, y: y + r }, end: { x: x, y: y + h - r }, color: borderColor, thickness: bw });
    page.drawLine({ start: { x: x + w, y: y + r }, end: { x: x + w, y: y + h - r }, color: borderColor, thickness: bw });
  }
}

function textW(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

// (Geometric icon placeholders removed — using PNG icons from Supabase Storage)

// ─── Height Calculators ─────────────────────────────────────────

function calcEstacionResumenH(nEstaciones: number): number {
  const nPairs = Math.floor(nEstaciones / 2);
  const nSingle = nEstaciones % 2;
  const pairLines = nPairs + nSingle;
  return 48 + 16 + 14 + (pairLines * 18) + 12;
}

function calcCardRowH(cards: CardData[]): number {
  const n = cards.length;
  const sizes = CARD_SIZES[n] || CARD_SIZES[3];
  const maxItems = Math.max(...cards.map(c => Math.min(c.items.length, 5)));
  return sizes.bandH + sizes.bodyPadTop + 12 + 10 + (maxItems * sizes.itemSpacing) + sizes.bodyPadBot;
}

// ─── Rendering Functions ────────────────────────────────────────

function drawBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.bg });
}

function drawHeader(page: PDFPage, fonts: FontSet, y: number, fechaEmision: string): number {
  const barH = 58;
  const barY = y - barH;
  page.drawRectangle({ x: 0, y: barY, width: W, height: barH, color: C.brown });

  page.drawText("japitown", { x: ML + 12, y: barY + barH - 32, font: fonts.bold, size: 22, color: C.cream });
  page.drawText("Eventos infantiles", { x: ML + 12, y: barY + barH - 47, font: fonts.light, size: 8, color: C.brown_lt });

  const dateW = textW(fonts.regular, fechaEmision, 9);
  page.drawText(fechaEmision, { x: W - MR - 12 - dateW, y: barY + barH - 26, font: fonts.regular, size: 9, color: C.cream });
  const cotLabel = "COTIZACIÓN";
  const cotW = textW(fonts.bold, cotLabel, 11);
  page.drawText(cotLabel, { x: W - MR - 12 - cotW, y: barY + barH - 43, font: fonts.bold, size: 11, color: C.lcream });

  return barY;
}

function drawTitleStrip(page: PDFPage, fonts: FontSet, y: number, titulo: string, subtitulo: string): number {
  const stripH = 48;
  const sY = y - stripH;
  page.drawText(titulo, { x: ML + 6, y: sY + stripH - 22, font: fonts.bold, size: 16, color: C.dark });
  page.drawText(subtitulo, { x: ML + 6, y: sY + stripH - 40, font: fonts.regular, size: 8.5, color: C.dlt });
  return sY;
}

function drawEventCallout(page: PDFPage, fonts: FontSet, y: number, config: QuoteRequest): number {
  const callH = 42;
  const cY = y - callH;
  const barW = 4;

  drawRoundedRect(page, ML, cY, CW, callH, 5, { color: C.offwhite });
  drawRoundedRect(page, ML, cY, CW, callH, 5, { borderColor: C.cream, borderWidth: 0.5 });

  page.drawRectangle({ x: ML, y: cY + 4, width: barW, height: callH - 8, color: C.yellow });

  const mainText = `Evento para ${config.n_ninos} niños · ${config.fecha} · ${config.horas} horas de servicio`;
  page.drawText(mainText, { x: ML + 18, y: cY + callH - 16, font: fonts.medium, size: 8.5, color: C.dark });

  const subText = "Todas las estaciones y talleres operan las " + config.horas + " horas completas · Incluye montaje y desmontaje";
  page.drawText(subText, { x: ML + 18, y: cY + callH - 30, font: fonts.regular, size: 7.5, color: C.dlt });
  return cY;
}

function drawEstacionResumen(page: PDFPage, fonts: FontSet, y: number, estaciones: string[], precio: number, dbServices: Map<string, DBService>): number {
  const nEst = estaciones.length;
  const nPairs = Math.floor(nEst / 2);
  const nSingle = nEst % 2;
  const pairLines = nPairs + nSingle;

  const headerH = 48;
  const bodyH = 16 + 14 + (pairLines * 18) + 12;
  const totalH = headerH + bodyH;
  const bY = y - totalH;

  drawRoundedRect(page, ML, bY, CW, totalH, 7, { color: C.offwhite });
  drawRoundedRect(page, ML, bY, CW, totalH, 7, { borderColor: C.cream, borderWidth: 0.5 });

  const darkBand = rgb(0.380, 0.380, 0.400);
  drawRoundedRect(page, ML, bY + bodyH, CW, headerH, 7, { color: darkBand });
  page.drawRectangle({ x: ML, y: bY + bodyH, width: CW, height: 7, color: darkBand });

  page.drawText("Paquetes de Estaciones — Mini Ciudad", { x: ML + 16, y: bY + bodyH + headerH - 20, font: fonts.bold, size: 13, color: C.white });
  const subText = `${nEst} estaciones temáticas · 3 horas · Juguetes, mobiliario, materiales y personal dedicado`;
  page.drawText(subText, { x: ML + 16, y: bY + bodyH + headerH - 35, font: fonts.regular, size: 7, color: rgb(0.75, 0.75, 0.78) });

  const priceText = formatPrice(precio);
  const priceW = textW(fonts.bold, priceText, 20);
  page.drawText(priceText, { x: ML + CW - 16 - priceW, y: bY + bodyH + headerH - 26, font: fonts.bold, size: 20, color: C.white });

  let cy = bY + bodyH - 14;
  page.drawText("Incluye por cada paquete: juguetes temáticos, mobiliario, materiales y 1 persona de staff por estación.", {
    x: ML + 16, y: cy, font: fonts.regular, size: 7, color: C.dlt,
  });
  cy -= 18;

  const pairPrice = 3000;
  const singlePrice = 1800;
  const rightMargin = ML + CW - 16;

  for (let i = 0; i < nPairs; i++) {
    const idx = i * 2;
    const key1 = estaciones[idx];
    const key2 = estaciones[idx + 1];
    const svc1 = dbServices?.get(key1);
    const svc2 = dbServices?.get(key2);
    const name1 = svc1?.title || key1;
    const name2 = svc2?.title || key2;
    const color1 = BULLET_MAP[(svc1?.pdf_color || "blue") as keyof typeof BULLET_MAP] || C.bullet_blue;
    const pairLabel = `${name1} + ${name2}`;
    const pairPriceStr = formatPrice(pairPrice);

    page.drawCircle({ x: ML + 22, y: cy + 3, size: 3.5, color: color1 });

    page.drawText(pairLabel, { x: ML + 34, y: cy, font: fonts.medium, size: 8, color: C.dark });
    const labelW = textW(fonts.medium, pairLabel, 8);
    const priceStrW = textW(fonts.regular, pairPriceStr, 8);

    const dotStart = ML + 34 + labelW + 6;
    const dotEnd = rightMargin - priceStrW - 6;
    drawDottedLine(page, dotStart, cy + 2, dotEnd, cy + 2, C.dlt);

    page.drawText(pairPriceStr, { x: rightMargin - priceStrW, y: cy, font: fonts.regular, size: 8, color: C.dark });

    cy -= 18;
  }

  if (nSingle > 0) {
    const idx = nEst - 1;
    const key = estaciones[idx];
    const svc = dbServices?.get(key);
    const name = svc?.title || key;
    const color = BULLET_MAP[(svc?.pdf_color || "blue") as keyof typeof BULLET_MAP] || C.bullet_blue;
    const singlePriceStr = formatPrice(singlePrice);

    page.drawCircle({ x: ML + 22, y: cy + 3, size: 3.5, color });
    page.drawText(name, { x: ML + 34, y: cy, font: fonts.medium, size: 8, color: C.dark });
    const labelW = textW(fonts.medium, name, 8);
    const priceStrW = textW(fonts.regular, singlePriceStr, 8);

    const dotStart = ML + 34 + labelW + 6;
    const dotEnd = rightMargin - priceStrW - 6;
    drawDottedLine(page, dotStart, cy + 2, dotEnd, cy + 2, C.dlt);

    page.drawText(singlePriceStr, { x: rightMargin - priceStrW, y: cy, font: fonts.regular, size: 8, color: C.dark });
    cy -= 18;
  }

  return bY;
}

function drawDottedLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, color: any) {
  const dotSpacing = 4;
  const dotR = 0.5;
  const dist = x2 - x1;
  const nDots = Math.floor(dist / dotSpacing);
  for (let i = 0; i < nDots; i++) {
    const x = x1 + i * dotSpacing;
    page.drawCircle({ x, y: y1, size: dotR, color });
  }
}

function drawCard(page: PDFPage, fonts: FontSet, x: number, y: number, data: CardData, sizes: CardSizes): number {
  const itemCount = Math.min(data.items.length, 5);
  const bodyH = sizes.bodyPadTop + 12 + 10 + (itemCount * sizes.itemSpacing) + sizes.bodyPadBot;
  const totalH = sizes.bandH + bodyH;
  const bandColor = BAND_MAP[data.color as keyof typeof BAND_MAP] || C.band_blue;
  const outlineColor = OUTLINE_MAP[data.color as keyof typeof OUTLINE_MAP] || C.outline_blue;
  const bulletColor = BULLET_MAP[data.color as keyof typeof BULLET_MAP] || C.bullet_blue;
  const cardY = y - totalH;

  drawRoundedRect(page, x, cardY, sizes.width, totalH, 7, { color: C.white });
  drawRoundedRect(page, x, cardY, sizes.width, totalH, 7, { borderColor: outlineColor, borderWidth: 0.8 });

  drawRoundedRect(page, x, cardY + bodyH, sizes.width, sizes.bandH, 7, { color: bandColor });
  page.drawRectangle({ x: x, y: cardY + bodyH, width: sizes.width, height: 7, color: bandColor });

  const titleY = cardY + bodyH + sizes.bandH - 18;
  page.drawText(data.nombre, { x: x + sizes.padX, y: titleY, font: fonts.bold, size: sizes.titleSz, color: C.white });

  page.drawText(data.subtitulo, { x: x + sizes.padX, y: titleY - 13, font: fonts.light, size: sizes.subSz, color: rgb(1, 1, 0.95) });

  const priceStr = formatPrice(data.precio);
  const priceW = textW(fonts.bold, priceStr, sizes.priceSz);
  page.drawText(priceStr, { x: x + sizes.width - sizes.padX - priceW, y: titleY, font: fonts.bold, size: sizes.priceSz, color: C.white });

  let cy = cardY + bodyH - sizes.bodyPadTop;

  page.drawText("Incluye:", { x: x + sizes.padX, y: cy, font: fonts.medium, size: sizes.itemSz, color: C.dark });
  cy -= sizes.itemSpacing + 2;

  for (let i = 0; i < itemCount; i++) {
    page.drawCircle({ x: x + sizes.padX + sizes.bulletR, y: cy + 2, size: sizes.bulletR, color: bulletColor });
    page.drawText(data.items[i], { x: x + sizes.padX + sizes.bulletR * 2 + 6, y: cy, font: fonts.regular, size: sizes.itemSz, color: C.dark });
    cy -= sizes.itemSpacing;
  }

  return totalH;
}

function drawCardRow(page: PDFPage, fonts: FontSet, y: number, cards: CardData[]): number {
  const n = cards.length;
  const sizes = CARD_SIZES[n] || CARD_SIZES[3];
  let maxH = 0;

  for (let i = 0; i < cards.length; i++) {
    let x: number;
    if (n === 1) {
      x = ML + (CW - sizes.width) / 2;
    } else {
      x = ML + i * (sizes.width + sizes.gap);
    }
    const h = drawCard(page, fonts, x, y, cards[i], sizes);
    if (h > maxH) maxH = h;
  }

  return y - maxH;
}

function drawTotalBar(page: PDFPage, fonts: FontSet, y: number, total: number, resumen: string): number {
  const barH = 52;
  const bY = y - barH;
  const midY = bY + barH / 2;
  drawRoundedRect(page, ML, bY, CW, barH, 6, { color: C.brown });

  page.drawText("INVERSIÓN TOTAL", { x: ML + 16, y: midY + 5, font: fonts.bold, size: 11, color: C.white });

  if (resumen) {
    page.drawText(resumen, { x: ML + 16, y: midY - 12, font: fonts.regular, size: 7.5, color: rgb(0.92, 0.88, 0.86) });
  }

  const priceText = formatPrice(total);
  const priceW = textW(fonts.bold, priceText, 28);
  page.drawText(priceText, { x: ML + CW - 16 - priceW, y: midY - 12, font: fonts.bold, size: 28, color: C.white });

  const mxnW = textW(fonts.light, "MXN", 9);
  page.drawText("MXN", { x: ML + CW - 16 - priceW - mxnW - 6, y: midY - 4, font: fonts.light, size: 9, color: rgb(0.92, 0.88, 0.86) });

  return bY;
}

function drawExtraHourNote(page: PDFPage, fonts: FontSet, y: number, noteText: string): number {
  if (!noteText) return y;
  const noteH = 22;
  const nY = y - noteH;
  const barW = 4;

  drawRoundedRect(page, ML, nY, CW, noteH, 4, { color: C.offwhite });
  drawRoundedRect(page, ML, nY, CW, noteH, 4, { borderColor: C.cream, borderWidth: 0.5 });

  page.drawRectangle({ x: ML, y: nY + 3, width: barW, height: noteH - 6, color: C.orange });

  const label = "Hora adicional disponible: ";
  page.drawText(label, { x: ML + 16, y: nY + 6, font: fonts.medium, size: 7, color: C.dark });
  const labelW = textW(fonts.medium, label, 7);
  page.drawText(noteText, { x: ML + 16 + labelW, y: nY + 6, font: fonts.regular, size: 7, color: C.dlt });
  return nY;
}

function drawConditions(page: PDFPage, fonts: FontSet, y: number, condiciones: string[]): number {
  const headerY = y - 12;
  page.drawText("Condiciones", { x: ML + 6, y: headerY, font: fonts.bold, size: 8.5, color: C.dark });
  const headerW = textW(fonts.bold, "Condiciones", 8.5);
  page.drawLine({ start: { x: ML + 6, y: headerY - 2 }, end: { x: ML + 6 + headerW, y: headerY - 2 }, color: C.brown_lt, thickness: 0.5 });

  const lineH = 10;
  let cy = headerY - 14;
  for (const cond of condiciones) {
    page.drawText("•", { x: ML + 10, y: cy, font: fonts.regular, size: 6.5, color: C.brown });
    page.drawText(cond, { x: ML + 22, y: cy, font: fonts.regular, size: 6.5, color: C.dlt });
    cy -= lineH;
  }
  return cy - 4;
}

function drawPaymentInfo(page: PDFPage, fonts: FontSet, y: number, bankInfo?: string): number {
  const infoH = 30;
  const pY = y - infoH;
  const barW = 4;

  drawRoundedRect(page, ML, pY, CW, infoH, 4, { color: C.offwhite });
  drawRoundedRect(page, ML, pY, CW, infoH, 4, { borderColor: C.cream, borderWidth: 0.5 });

  page.drawRectangle({ x: ML, y: pY + 3, width: barW, height: infoH - 6, color: C.orange });

  page.drawText("Datos para depósito de anticipo", { x: ML + 16, y: pY + infoH - 11, font: fonts.bold, size: 7.5, color: C.dark });
  page.drawText(bankInfo || "Contactar para datos de pago", {
    x: ML + 16, y: pY + 5, font: fonts.regular, size: 7, color: C.dlt,
  });
  return pY;
}

// Simple geometric icon fallbacks for decorative elements (CPU-friendly)
const DECO_COLORS = [C.ico_teal, C.ico_green, C.ico_red, C.ico_yellow, C.ico_orange, C.ico_green, C.ico_blue, C.ico_pink, C.ico_orange, C.ico_purple];

function drawSimpleIcon(page: PDFPage, cx: number, cy: number, size: number, color: any, variant: number) {
  const v = variant % 4;
  if (v === 0) {
    // Flower: center + 6 petals
    const petalR = size * 0.3;
    const dist = size * 0.4;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      page.drawCircle({ x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist, size: petalR, color });
    }
    page.drawCircle({ x: cx, y: cy, size: size * 0.2, color: C.yellow });
  } else if (v === 1) {
    // Star: cross shape
    const arm = size * 0.45;
    const thick = size * 0.16;
    page.drawRectangle({ x: cx - arm, y: cy - thick, width: arm * 2, height: thick * 2, color });
    page.drawRectangle({ x: cx - thick, y: cy - arm, width: thick * 2, height: arm * 2, color });
  } else if (v === 2) {
    // Cloud: 3 overlapping circles
    const r = size * 0.28;
    page.drawCircle({ x: cx - size * 0.2, y: cy, size: r, color });
    page.drawCircle({ x: cx + size * 0.2, y: cy, size: r, color });
    page.drawCircle({ x: cx, y: cy + size * 0.12, size: r * 1.1, color });
  } else {
    // Simple circle
    page.drawCircle({ x: cx, y: cy, size: size * 0.4, color });
  }
}

function drawIconBand(page: PDFPage, y: number, icons: IconCache): number {
  const decoIcons = icons.decorative.filter(Boolean);
  const numIcons = 10;
  const totalW = W - ML - MR;
  const spacing = totalW / numIcons;
  const bandY = y;

  for (let i = 0; i < numIcons; i++) {
    const cx = ML + spacing * (i + 0.5);
    if (decoIcons.length > 0) {
      const img = decoIcons[i % decoIcons.length];
      if (img) {
        page.drawImage(img, { x: cx - 9, y: bandY + 5, width: 18, height: 18 });
        continue;
      }
    }
    // Geometric fallback
    drawSimpleIcon(page, cx, bandY + 14, 14, DECO_COLORS[i % DECO_COLORS.length], i);
  }

  return bandY;
}

function drawRainbowStripe(page: PDFPage, y: number): number {
  const stripeH = 4;
  const sY = y;
  const numColors = C.rainbow.length;
  const segW = W / numColors;

  for (let i = 0; i < numColors; i++) {
    page.drawRectangle({ x: i * segW, y: sY, width: segW + 1, height: stripeH, color: C.rainbow[i] });
  }

  return sY;
}

function drawFooter(page: PDFPage, fonts: FontSet) {
  const footerH = 42;
  page.drawRectangle({ x: 0, y: 0, width: W, height: footerH, color: C.brown });

  page.drawText("@japitown", { x: ML + 12, y: 18, font: fonts.medium, size: 8, color: C.cream });

  const rightText = "japitown · Eventos infantiles";
  const rightW = textW(fonts.regular, rightText, 8);
  page.drawText(rightText, { x: W - MR - 12 - rightW, y: 18, font: fonts.regular, size: 8, color: C.cream });
}

function drawScatteredIcons(page: PDFPage, y: number, contentBottom: number, icons: IconCache) {
  const decoIcons = icons.decorative.filter(Boolean);
  const positions = [
    { x: W - MR - 18, y: y - 18, size: 12 },
    { x: ML - 6, y: (y + contentBottom) / 2, size: 10 },
    { x: W - MR + 5, y: (y + contentBottom) / 2 + 30, size: 9 },
    { x: ML - 5, y: contentBottom + 30, size: 10 },
    { x: ML + 15, y: contentBottom + 10, size: 8 },
    { x: W - MR + 5, y: contentBottom + 20, size: 10 },
  ];
  const colors = [C.ico_yellow, C.ico_pink, C.ico_yellow, C.ico_pink, C.ico_teal, C.ico_blue];

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    if (decoIcons.length > 0 && decoIcons[i % decoIcons.length]) {
      page.drawImage(decoIcons[i % decoIcons.length], { x: p.x - p.size / 2, y: p.y - p.size / 2, width: p.size, height: p.size });
    } else {
      drawSimpleIcon(page, p.x, p.y, p.size, colors[i], i);
    }
  }
}

// ─── Font Loading ───────────────────────────────────────────────
// Using standard PDF fonts (Helvetica) to avoid CPU-heavy fontkit parsing.
// Standard fonts are built into every PDF reader — zero download, zero embed cost.
async function loadFonts(pdfDoc: InstanceType<typeof PDFDocument>): Promise<FontSet> {
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  return { bold: helveticaBold, medium: helveticaBold, regular: helvetica, light: helvetica };
}

// ─── Validation ─────────────────────────────────────────────────
function validate(
  req: QuoteRequest,
  sets: { estacionIds: Set<string>; fijoIds: Set<string>; tallerIds: Set<string> }
): string[] {
  const errors: string[] = [];
  if (!req.cliente?.trim()) errors.push("cliente es requerido");
  if (!req.n_ninos || req.n_ninos < 1) errors.push("n_ninos debe ser >= 1");
  if (!req.horas || req.horas < 1) errors.push("horas debe ser >= 1");
  if (!req.fecha?.trim()) errors.push("fecha es requerida");
  if ((req.estaciones?.length ?? 0) === 1) errors.push("Mínimo 2 estaciones");
  const total = (req.estaciones?.length || 0) + (req.fijos?.length || 0) + (req.talleres?.length || 0);
  if (total === 0) errors.push("Debe incluir al menos 1 servicio");
  req.estaciones?.forEach(k => { if (!sets.estacionIds.has(k)) errors.push(`Estación inválida: ${k}`); });
  req.fijos?.forEach(k => { if (!sets.fijoIds.has(k)) errors.push(`Servicio fijo inválido: ${k}`); });
  req.talleres?.forEach(k => { if (!sets.tallerIds.has(k)) errors.push(`Taller inválido: ${k}`); });
  return errors;
}

// ─── Page 2 Drawing Helpers ─────────────────────────────────────

function drawPage2Header(page: PDFPage, fonts: FontSet, y: number, cliente: string): number {
  const barH = 48;
  const barY = y - barH;
  page.drawRectangle({ x: 0, y: barY, width: W, height: barH, color: C.brown });

  page.drawText("japitown", { x: ML + 12, y: barY + barH - 28, font: fonts.bold, size: 18, color: C.cream });
  page.drawText("Eventos infantiles", { x: ML + 12, y: barY + barH - 40, font: fonts.light, size: 7, color: C.brown_lt });

  const rightLabel = `Condiciones — ${cliente}`;
  const rightW = textW(fonts.regular, rightLabel, 9);
  page.drawText(rightLabel, { x: W - MR - 12 - rightW, y: barY + barH - 30, font: fonts.regular, size: 9, color: C.cream });

  return barY;
}

function drawConditionsPage2(page: PDFPage, fonts: FontSet, y: number, condiciones: string[]): number {
  const headerY = y - 16;
  const sectionTitle = "Condiciones del servicio";
  page.drawText(sectionTitle, { x: ML + 6, y: headerY, font: fonts.bold, size: 11, color: C.dark });
  const titleW = textW(fonts.bold, sectionTitle, 11);
  page.drawLine({ start: { x: ML + 6, y: headerY - 3 }, end: { x: ML + 6 + titleW, y: headerY - 3 }, color: C.brown_lt, thickness: 0.7 });

  const lineH = 14;
  let cy = headerY - 20;
  for (const cond of condiciones) {
    page.drawCircle({ x: ML + 14, y: cy + 3, size: 2, color: C.brown });
    page.drawText(cond, { x: ML + 24, y: cy, font: fonts.regular, size: 8, color: C.dlt });
    cy -= lineH;
  }
  return cy - 8;
}

function drawPaymentInfoPage2(page: PDFPage, fonts: FontSet, y: number, bankInfo?: string): number {
  const sectionTitle = "Forma de pago";
  page.drawText(sectionTitle, { x: ML + 6, y: y, font: fonts.bold, size: 11, color: C.dark });
  const titleW = textW(fonts.bold, sectionTitle, 11);
  page.drawLine({ start: { x: ML + 6, y: y - 3 }, end: { x: ML + 6 + titleW, y: y - 3 }, color: C.brown_lt, thickness: 0.7 });

  const boxY = y - 18;
  const bankText = bankInfo || "Contactar para datos de pago";
  // Split bank info by newlines for multi-line display
  const lines = bankText.split(/\n|\\n/).filter(l => l.trim());
  const boxH = Math.max(40, 16 + lines.length * 13 + 10);
  const bY = boxY - boxH;

  drawRoundedRect(page, ML, bY, CW, boxH, 5, { color: C.offwhite });
  drawRoundedRect(page, ML, bY, CW, boxH, 5, { borderColor: C.cream, borderWidth: 0.5 });
  page.drawRectangle({ x: ML, y: bY + 4, width: 4, height: boxH - 8, color: C.orange });

  page.drawText("Datos para depósito / transferencia:", { x: ML + 16, y: bY + boxH - 14, font: fonts.medium, size: 8, color: C.dark });

  let ly = bY + boxH - 28;
  for (const line of lines) {
    page.drawText(line.trim(), { x: ML + 16, y: ly, font: fonts.regular, size: 7.5, color: C.dlt });
    ly -= 13;
  }

  return bY;
}

function drawVigencia(page: PDFPage, fonts: FontSet, y: number, vigencia: string): number {
  const boxH = 32;
  const bY = y - boxH;

  drawRoundedRect(page, ML, bY, CW, boxH, 5, { color: C.offwhite });
  drawRoundedRect(page, ML, bY, CW, boxH, 5, { borderColor: C.cream, borderWidth: 0.5 });
  page.drawRectangle({ x: ML, y: bY + 4, width: 4, height: boxH - 8, color: C.yellow });

  page.drawText("Vigencia de la cotización", { x: ML + 16, y: bY + boxH - 13, font: fonts.medium, size: 8.5, color: C.dark });
  page.drawText(vigencia, { x: ML + 16, y: bY + 7, font: fonts.regular, size: 8, color: C.dlt });

  return bY;
}

// ─── Main Pipeline ──────────────────────────────────────────────
async function generateQuotePDF(config: QuoteRequest, dbServices: Map<string, DBService>, supabase?: any, bankInfo?: string): Promise<Uint8Array> {
  const resolved = resolveDefaults(config);
  const { total } = calcularTotal(resolved, dbServices);
  const bloques = calcularLayout(resolved, dbServices);
  console.log(`[DIAG generateQuotePDF] total=${total}, bloques=${bloques.length}, config.estaciones=${JSON.stringify(resolved.estaciones)} config.talleres=${JSON.stringify(resolved.talleres)}`);

  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);

  // Load decorative icons (13-19) for band and scattered placement
  const icons = await loadAllIcons(pdfDoc);

  const condiciones = generarCondiciones(resolved);
  const horaExtraText = generarNotaHoraExtra(resolved, dbServices);
  const resumen = generarResumen(resolved);

  // ═══════════════════════════════════════════════════════════════
  // PAGE 1 — Cotización (servicios + total)
  // ═══════════════════════════════════════════════════════════════
  const page1 = pdfDoc.addPage([W, H]);

  const HEADER_H = 58;
  const TITLE_H = 48;
  const CALLOUT_H = 42;
  const TOTAL_BAR_H = 52;
  const EXTRA_HOUR_H = horaExtraText ? 22 : 0;
  const ICON_BAND_H = 32;
  const RAINBOW_H = 4;
  const FOOTER_H = 42;

  const blockHeights: number[] = [];
  for (const bloque of bloques) {
    if (bloque.tipo === "estacion_resumen") {
      blockHeights.push(calcEstacionResumenH(bloque.estaciones.length));
    } else {
      blockHeights.push(calcCardRowH(bloque.cards));
    }
  }
  const contentH = blockHeights.reduce((a, b) => a + b, 0);

  // Page 1 no longer includes conditions/payment — more space for cards
  const LOGISTICS_FEE_H = (config.logistics_fee && config.logistics_fee > 0) ? 36 : 0; // 28 + 8 gap
  const totalStuffH_p1 = HEADER_H + TITLE_H + CALLOUT_H + contentH +
    LOGISTICS_FEE_H + TOTAL_BAR_H + EXTRA_HOUR_H + ICON_BAND_H + RAINBOW_H + FOOTER_H;

  const numContentGaps = Math.max(blockHeights.length - 1, 0);
  const MIN_GAP_HEADER = 6;
  const MIN_GAP_TITLE = 6;
  const MIN_GAP_CALLOUT = 12;
  const MIN_GAP_BEFORE_CONTENT = 10;
  const MIN_GAP_BETWEEN_BLOCKS = 12;
  const MIN_GAP_AFTER_CONTENT = 12;
  const MIN_GAP_AFTER_TOTAL = 8;
  const MIN_GAP_AFTER_EXTRAHOUR = 6;
  const MIN_GAP_BEFORE_ICONS = 4;

  const minGapsTotal_p1 = MIN_GAP_HEADER + MIN_GAP_TITLE + MIN_GAP_CALLOUT +
    MIN_GAP_BEFORE_CONTENT + (numContentGaps * MIN_GAP_BETWEEN_BLOCKS) + MIN_GAP_AFTER_CONTENT +
    MIN_GAP_AFTER_TOTAL + (horaExtraText ? MIN_GAP_AFTER_EXTRAHOUR : 0) +
    MIN_GAP_BEFORE_ICONS;

  const extraSpace_p1 = Math.max(0, H - totalStuffH_p1 - minGapsTotal_p1);
  const numDistribGaps_p1 = 3 + numContentGaps;
  const bonusPerGap_p1 = numDistribGaps_p1 > 0 ? extraSpace_p1 / numDistribGaps_p1 : 0;
  const cappedBonus = Math.min(bonusPerGap_p1, 30);

  drawBackground(page1);

  let y = H;

  y = drawHeader(page1, fonts, y, resolved.fecha_emision!);
  y -= MIN_GAP_HEADER;
  y = drawTitleStrip(page1, fonts, y, resolved.titulo!, resolved.subtitulo!);
  y -= MIN_GAP_TITLE;
  y = drawEventCallout(page1, fonts, y, resolved);
  y -= MIN_GAP_CALLOUT + MIN_GAP_BEFORE_CONTENT + cappedBonus;

  for (let i = 0; i < bloques.length; i++) {
    const bloque = bloques[i];
    if (bloque.tipo === "estacion_resumen") {
      y = drawEstacionResumen(page1, fonts, y, bloque.estaciones, bloque.precio, dbServices);
    } else {
      y = drawCardRow(page1, fonts, y, bloque.cards);
    }
    if (i < bloques.length - 1) y -= MIN_GAP_BETWEEN_BLOCKS + cappedBonus;
  }
  y -= MIN_GAP_AFTER_CONTENT + cappedBonus;

  const contentBottom = y;

  // Draw logistics fee row before total if present
  if (config.logistics_fee && config.logistics_fee > 0) {
    const LOGISTICS_H = 28;
    const lx = ML;
    const lw = W - 2 * ML;
    // Draw rounded rect background
    page1.drawRectangle({
      x: lx, y: y - LOGISTICS_H, width: lw, height: LOGISTICS_H,
      color: rgb(1, 0.95, 0.88), // light orange bg
      borderColor: rgb(0.9, 0.7, 0.4),
      borderWidth: 0.5,
    });
    page1.drawText("Gastos de operación y arrastre", {
      x: lx + 10, y: y - 18, size: 9, font: fonts.medium, color: rgb(0.35, 0.25, 0.1),
    });
    const feeText = `$${config.logistics_fee.toLocaleString("es-MX")}`;
    const feeW = fonts.bold.widthOfTextAtSize(feeText, 10);
    page1.drawText(feeText, {
      x: lx + lw - 10 - feeW, y: y - 18, size: 10, font: fonts.bold, color: rgb(0.35, 0.25, 0.1),
    });
    y -= LOGISTICS_H + 8;
  }

  y = drawTotalBar(page1, fonts, y, total, resumen);
  y -= MIN_GAP_AFTER_TOTAL;

  if (horaExtraText) {
    y = drawExtraHourNote(page1, fonts, y, horaExtraText);
    y -= MIN_GAP_AFTER_EXTRAHOUR;
  }

  drawScatteredIcons(page1, H - HEADER_H - MIN_GAP_HEADER, contentBottom, icons);

  const iconBandY_p1 = FOOTER_H + RAINBOW_H;
  drawIconBand(page1, iconBandY_p1, icons);
  drawRainbowStripe(page1, FOOTER_H);
  drawFooter(page1, fonts);

  // ═══════════════════════════════════════════════════════════════
  // PAGE 2 — Condiciones y forma de pago
  // ═══════════════════════════════════════════════════════════════
  const page2 = pdfDoc.addPage([W, H]);
  drawBackground(page2);

  let y2 = H;

  // Simplified header with client reference
  y2 = drawPage2Header(page2, fonts, y2, resolved.cliente);
  y2 -= 16;

  // Conditions section (larger, more readable)
  y2 = drawConditionsPage2(page2, fonts, y2, condiciones);
  y2 -= 16;

  // Extra hour note on page 2 as well
  if (horaExtraText) {
    y2 = drawExtraHourNote(page2, fonts, y2, horaExtraText);
    y2 -= 16;
  }

  // Payment info with full bank details
  y2 = drawPaymentInfoPage2(page2, fonts, y2, bankInfo);
  y2 -= 16;

  // Vigencia
  y2 = drawVigencia(page2, fonts, y2, resolved.vigencia || "15 días naturales");

  // Decorative elements on page 2
  drawScatteredIcons(page2, H - 48 - 16, y2, icons);

  const iconBandY_p2 = FOOTER_H + RAINBOW_H;
  drawIconBand(page2, iconBandY_p2, icons);
  drawRainbowStripe(page2, FOOTER_H);
  drawFooter(page2, fonts);

  return await pdfDoc.save();
}

// ─── Quote-from-DB Mapper ───────────────────────────────────────
async function mapQuoteToConfig(supabase: any, quoteId: string): Promise<QuoteRequest> {
  const { data: quote, error: qErr } = await supabase
    .from("quotes").select("*").eq("id", quoteId).single();
  if (qErr || !quote) throw new Error("Quote not found: " + (qErr?.message || quoteId));

  const { data: qServices } = await supabase
    .from("quote_services").select("service_id, quantity").eq("quote_id", quoteId);

  // Fetch all active services from DB for dynamic classification fallback
  const { data: allDbServices } = await supabase
    .from("services")
    .select("id, title, category, base_price, hora_extra, features, pdf_color, pdf_subtitle")
    .eq("is_active", true);

  const dbServices = new Map<string, any>();
  for (const s of allDbServices || []) {
    dbServices.set(s.id, s);
  }

  const estaciones: string[] = [];
  const fijos: string[] = [];
  const talleres: string[] = [];

  for (const qs of qServices || []) {
    const sid = qs.service_id;

    // Classify by DB category (single source of truth)
    const dbSvc = dbServices.get(sid);
    if (dbSvc) {
      const cat = dbSvc.category?.toLowerCase() || "";
      if (cat.includes("estacion") || cat.includes("juego")) {
        estaciones.push(sid);
      } else if (cat.includes("taller") || cat.includes("creativ")) {
        talleres.push(sid);
      } else {
        fijos.push(sid);
      }
      console.log(`[DIAG] service_id "${sid}" classified by DB category "${dbSvc.category}"`);
    } else {
      console.warn(`[DIAG] service_id "${sid}" not found in DB — skipped`);
    }
  }
  console.log(`[DIAG mapQuoteToConfig] service_ids recibidos: ${(qServices||[]).map((q: any)=>q.service_id).join(", ")}`);
  console.log(`[DIAG mapQuoteToConfig] estaciones=${JSON.stringify(estaciones)} talleres=${JSON.stringify(talleres)} fijos=${JSON.stringify(fijos)}`);

  let fecha = "";
  if (quote.event_date) {
    try {
      const d = new Date(quote.event_date + "T12:00:00");
      const dayName = d.toLocaleDateString("es-MX", { weekday: "long" });
      const rest = d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
      fecha = dayName.charAt(0).toUpperCase() + dayName.slice(1) + " " + rest;
    } catch { fecha = quote.event_date; }
  }

  return {
    cliente: quote.customer_name,
    n_ninos: quote.children_count || 15,
    horas: 3,
    fecha: fecha || "Por confirmar",
    estaciones,
    fijos,
    talleres,
    logistics_fee: quote.logistics_fee_enabled ? (quote.logistics_fee || 0) : 0,
  };
}

// ─── Entry Point ────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: dbServicesRaw } = await supabase
      .from("services").select("id, title, category, base_price, hora_extra, features, pdf_color, pdf_subtitle").eq("is_active", true);
    const dbServices = new Map<string, DBService>();
    for (const s of dbServicesRaw || []) {
      dbServices.set(s.id, s as DBService);
    }

    // Fetch bank info from company_settings
    const { data: companySettings } = await supabase
      .from("company_settings").select("bank_info").single();
    const bankInfo = companySettings?.bank_info || undefined;

    let config: QuoteRequest;
    let quoteId: string | null = null;

    if (body.quoteId) {
      quoteId = body.quoteId;
      config = await mapQuoteToConfig(supabase, quoteId);
    } else if (body.cliente) {
      config = body as QuoteRequest;
      const serviceSets = deriveServiceSets(dbServices);
      const errors = validate(config, serviceSets);
      if (errors.length > 0) {
        return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Must provide quoteId or QuoteRequest body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = await generateQuotePDF(config, dbServices, supabase, bankInfo);

    const url = new URL(req.url);
    const output = url.searchParams.get("output") ?? (quoteId ? "storage" : "binary");

    if (output === "storage") {
      const safeName = config.cliente
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // Remove accents (ñ→n, á→a)
        .replace(/[^a-zA-Z0-9]/g, "_")                     // Replace non-alphanumeric with _
        .replace(/_+/g, "_")                                // Collapse multiple underscores
        .replace(/^_|_$/g, "")                              // Trim leading/trailing _
        .substring(0, 50) || "cliente";                     // Limit length
      const fileName = `cotizacion-${safeName}-${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return new Response(JSON.stringify({ error: "Failed to upload PDF", details: uploadError }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: urlData } = supabase.storage.from("quote-pdfs").getPublicUrl(fileName);
      const pdfUrl = urlData.publicUrl;

      if (quoteId) {
        await supabase.from("quotes").update({ pdf_url: pdfUrl }).eq("id", quoteId);

        // Traceability: record pdf_generated in quote_history
        await supabase.from("quote_history").insert({
          quote_id: quoteId,
          action_type: "pdf_generated",
          status: "success",
          recipient: config.cliente,
          metadata: {
            pdf_url: pdfUrl,
            service_ids: [
              ...(config.estaciones || []),
              ...(config.fijos || []),
              ...(config.talleres || []),
            ],
            n_ninos: config.n_ninos,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return new Response(JSON.stringify({ success: true, pdf_url: pdfUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = config.cliente.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").trim();
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Cotizacion ${safeName} - Japitown.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error generating quote PDF:", err);
    return new Response(JSON.stringify({ error: "Internal server error", message: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
