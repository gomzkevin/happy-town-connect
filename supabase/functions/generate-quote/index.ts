// ═══════════════════════════════════════════════════════════════
// generate-quote — Supabase Edge Function
// Generates branded PDF quotes for Japitown using pdf-lib
// Combines renderer-v2 logic with Edge Function boilerplate
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { aplicarDescuento, BASE_HOURS, calcularPreciosCotizacion, normalizeServiceCategory, precioEstaciones, QUOTE_DEFAULTS } from "../_shared/pricing.ts";
import { buildQuoteSnapshot, formatSavedQuoteDate } from "../_shared/quote-snapshot.ts";

type QuoteSnapshot = ReturnType<typeof buildQuoteSnapshot>;

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
  per_child?: string[];
  hora_evento?: string;
  fecha_emision?: string;
  vigencia?: string;
  notas_extra?: string[];
  anticipo_pct?: number;
  cancelacion?: boolean;
  titulo?: string;
  subtitulo?: string;
  logistics_fee?: number;
  discount_enabled?: boolean;
  discount_percentage?: number;
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

interface StationSummaryRow {
  name: string;
  price: number;
  color: string;
}

type LayoutBlock =
  | { tipo: "estacion_resumen"; estaciones: string[]; precio: number; rows: StationSummaryRow[] }
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
  pricing_type?: string;
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
  pdfDoc: PDFDocument,
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
export function deriveServiceSets(dbServices: Map<string, DBService>) {
  const estacionIds = new Set<string>();
  const fijoIds = new Set<string>();
  const tallerIds = new Set<string>();
  const perChildIds = new Set<string>();
  for (const [id, svc] of dbServices) {
    const category = normalizeServiceCategory(svc.category);
    if (svc.pricing_type === "per_child") perChildIds.add(id);
    else if (category === "Estaciones de Juego") estacionIds.add(id);
    else if (category === "Talleres Creativos") tallerIds.add(id);
    else fijoIds.add(id);
  }
  return { estacionIds, fijoIds, tallerIds, perChildIds };
}

// Raw requests use current catalog prices. Saved quotes take a separate, server-built
// snapshot so a client cannot override prices and historical quotes are never repriced.
export function calcularTotal(config: QuoteRequest, dbServices: Map<string, DBService>, snapshot?: QuoteSnapshot) {
  if (snapshot) return snapshot;
  const ids = [...(config.estaciones ?? []), ...(config.fijos ?? []), ...(config.talleres ?? []), ...(config.per_child ?? [])];
  const services = ids.map(id => {
    const service = dbServices.get(id);
    if (!service) throw new Error(`Service not found: ${id}`);
    return service;
  });
  const prices = calcularPreciosCotizacion(services, config.n_ninos, Math.max(0, config.horas - BASE_HOURS));
  const { discountAmount, totalConDescuento } = aplicarDescuento(prices.total, config.discount_enabled ? (config.discount_percentage ?? 0) : 0);
  const logisticsFee = config.logistics_fee ?? 0;
  return {
    lines: services.map(service => ({ key: service.id, serviceId: service.id, name: service.title,
      unitPrice: prices.perService.get(service.id) ?? 0, quantity: 1, total: prices.perService.get(service.id) ?? 0 })),
    servicesSubtotal: prices.total, discountAmount, logisticsFee,
    total: totalConDescuento + logisticsFee, adjustment: 0,
  };
}

// ─── Layout Engine ──────────────────────────────────────────────
export function calcularLayout(config: QuoteRequest, dbServices: Map<string, DBService>, snapshot?: QuoteSnapshot): LayoutBlock[] {
  const bloques: LayoutBlock[] = [];
  const cards: CardData[] = [];
  const pricing = calcularTotal(config, dbServices, snapshot);
  const stationRows: StationSummaryRow[] = [];
  const stationKeys: string[] = [];
  const sets = deriveServiceSets(dbServices);

  if (!snapshot && (config.estaciones?.length ?? 0) >= 2) {
    const ids = config.estaciones!;
    const extraHours = Math.max(0, config.horas - BASE_HOURS);
    for (let i = 0; i < ids.length; i += 2) {
      const pair = ids.slice(i, i + 2).map(id => dbServices.get(id)!);
      stationRows.push({ name: pair.map(service => service.title).join(" + "),
        // For an odd leftover in a multi-station package, retain the shared package rate.
        price: precioEstaciones(pair.length) + pair.reduce((sum, service) => sum + (service.hora_extra ?? 0) * extraHours, 0),
        color: pair[0].pdf_color || "blue" });
    }
    stationKeys.push(...ids);
  }

  for (const line of pricing.lines) {
    const service = line.serviceId ? dbServices.get(line.serviceId) : undefined;
    const isStation = !!line.serviceId && sets.estacionIds.has(line.serviceId);
    if (!snapshot && stationKeys.includes(line.key)) continue;
    if (snapshot && isStation) {
      stationKeys.push(line.key);
      stationRows.push({ name: `${line.name} · Cantidad: ${line.quantity} × ${formatPrice(line.unitPrice)}`,
        price: line.total, color: service?.pdf_color || "blue" });
      continue;
    }
    const isWorkshop = service && (normalizeServiceCategory(service.category) === "Talleres Creativos" || service.pricing_type === "per_child");
    cards.push({ tipo: isWorkshop ? "taller" : "fijo", key: line.key, nombre: line.name, precio: line.total,
      // Snapshot quantity is authoritative; never substitute the current child count.
      subtitulo: snapshot ? `Cantidad: ${line.quantity} × ${formatPrice(line.unitPrice)}`
        : service?.pricing_type === "per_child" ? `${config.n_ninos} niños × ${formatPrice(service.base_price)}` : (service?.pdf_subtitle || ""),
      items: service?.features || [], color: service?.pdf_color || (isWorkshop ? "pink" : "blue") });
  }
  // Chunk long station summaries too: no saved service may fall off a page.
  for (let i = 0; i < stationRows.length; i += 12) {
    const rows = stationRows.slice(i, i + 12);
    bloques.push({ tipo: "estacion_resumen", estaciones: stationKeys, rows,
      precio: rows.reduce((sum, row) => sum + row.price, 0) });
  }
  for (const fila of distribuirEnFilas(cards)) bloques.push({ tipo: "fila_cards", cards: fila, cardsPerRow: fila.length });
  return bloques;
}

export function distribuirEnFilas(cards: CardData[]): CardData[][] {
  if (cards.length === 0) return [];
  if (cards.length <= 3) return [cards];
  if (cards.length <= 5) return [cards.slice(0, 2), cards.slice(2)];
  const rows: CardData[][] = [];
  for (let i = 0; i < cards.length; i += 3) rows.push(cards.slice(i, i + 3));
  return rows;
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
    per_child: config.per_child || [],
    fecha_emision: config.fecha_emision || formatDate(new Date()),
    vigencia: config.vigencia || QUOTE_DEFAULTS.validity,
    anticipo_pct: config.anticipo_pct ?? QUOTE_DEFAULTS.depositPercentage,
    cancelacion: config.cancelacion ?? QUOTE_DEFAULTS.nonRefundableDeposit,
    notas_extra: config.notas_extra || [],
    titulo: config.titulo || `Cotización — ${config.cliente}`,
    subtitulo: config.subtitulo || generarSubtitulo(config),
  };
}

function generarSubtitulo(config: QuoteRequest): string {
  const nEst = config.estaciones?.length ?? 0;
  const nFij = config.fijos?.length ?? 0;
  const nTal = (config.talleres?.length ?? 0) + (config.per_child?.length ?? 0);
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
  const nTal = (config.talleres?.length ?? 0) + (config.per_child?.length ?? 0);
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
  const extraHours = Math.max(0, config.horas - BASE_HOURS);

  // If extra hours are already included in prices, show a note about it
  if (extraHours > 0) {
    return `Incluye ${extraHours} hora${extraHours > 1 ? 's' : ''} adicional${extraHours > 1 ? 'es' : ''} · Los precios reflejan el total por ${config.horas} horas de servicio`;
  }

  // If no extra hours selected, show available rates
  const parts: string[] = [];

  // Bucket 1: Estaciones + Extras + Fijos → "por estación"
  let precioEstacion: number | null = null;
  for (const key of [...(config.estaciones ?? []), ...(config.fijos ?? [])]) {
    const dbSvc = dbServices?.get(key);
    const p = dbSvc?.hora_extra ?? 0;
    if (p > 0 && precioEstacion === null) precioEstacion = p;
  }
  if (precioEstacion !== null) {
    parts.push(`$${precioEstacion.toLocaleString("es-MX")} por estación`);
  }

  // Bucket 2: Talleres Creativos → "por taller"
  let precioTallerExtra: number | null = null;
  for (const key of config.talleres ?? []) {
    const dbSvc = dbServices?.get(key);
    const p = dbSvc?.hora_extra ?? 0;
    if (p > 0 && precioTallerExtra === null) precioTallerExtra = p;
  }
  if (precioTallerExtra !== null) {
    parts.push(`$${precioTallerExtra.toLocaleString("es-MX")} por taller`);
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

function drawFittedText(page: PDFPage, text: string, font: PDFFont, preferredSize: number, x: number, y: number, maxWidth: number, color: ReturnType<typeof rgb>): number {
  const width = textW(font, text, preferredSize);
  const size = width > maxWidth ? preferredSize * maxWidth / width : preferredSize;
  page.drawText(text, { x, y, font, size, color });
  return textW(font, text, size);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && textW(font, candidate, size) > maxWidth) { lines.push(current); current = word; }
    else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

function cardMetrics(data: CardData, sizes: CardSizes, fonts: FontSet) {
  const titleLines = wrapText(data.nombre, fonts.bold, sizes.titleSz, sizes.width - 2 * sizes.padX);
  // Prices get a separate baseline rather than overlapping a longer saved name.
  const bandH = Math.max(sizes.bandH, 14 + titleLines.length * (sizes.titleSz + 2) + sizes.subSz + sizes.priceSz + 15);
  const itemCount = Math.min(data.items.length, 5);
  const bodyH = sizes.bodyPadTop + 12 + 10 + itemCount * sizes.itemSpacing + sizes.bodyPadBot;
  return { titleLines, bandH, itemCount, bodyH };
}

// (Geometric icon placeholders removed — using PNG icons from Supabase Storage)

// ─── Height Calculators ─────────────────────────────────────────

function calcEstacionResumenH(rowCount: number): number {
  return 48 + 16 + 14 + (rowCount * 18) + 12;
}

function calcCardRowH(cards: CardData[], fonts: FontSet): number {
  const sizes = CARD_SIZES[cards.length] || CARD_SIZES[3];
  return Math.max(...cards.map(card => { const metrics = cardMetrics(card, sizes, fonts); return metrics.bandH + metrics.bodyH; }));
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
  drawFittedText(page, titulo, fonts.bold, 16, ML + 6, sY + stripH - 22, CW - 12, C.dark);
  drawFittedText(page, subtitulo, fonts.regular, 8.5, ML + 6, sY + stripH - 40, CW - 12, C.dlt);
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
  drawFittedText(page, mainText, fonts.medium, 8.5, ML + 18, cY + callH - 16, CW - 36, C.dark);

  const subText = "Todas las estaciones y talleres operan las " + config.horas + " horas completas · Incluye montaje y desmontaje";
  page.drawText(subText, { x: ML + 18, y: cY + callH - 30, font: fonts.regular, size: 7.5, color: C.dlt });
  return cY;
}

function drawEstacionResumen(page: PDFPage, fonts: FontSet, y: number, rows: StationSummaryRow[], precio: number, horas: number): number {
  const headerH = 48;
  const totalH = calcEstacionResumenH(rows.length);
  const bodyH = totalH - headerH;
  const bY = y - totalH;
  drawRoundedRect(page, ML, bY, CW, totalH, 7, { color: C.offwhite });
  drawRoundedRect(page, ML, bY, CW, totalH, 7, { borderColor: C.cream, borderWidth: 0.5 });
  const darkBand = rgb(0.380, 0.380, 0.400);
  drawRoundedRect(page, ML, bY + bodyH, CW, headerH, 7, { color: darkBand });
  page.drawRectangle({ x: ML, y: bY + bodyH, width: CW, height: 7, color: darkBand });
  const priceText = formatPrice(precio);
  const priceW = textW(fonts.bold, priceText, 20);
  drawFittedText(page, "Estaciones — Mini Ciudad", fonts.bold, 13, ML + 16, bY + bodyH + headerH - 20, CW - priceW - 48, C.white);
  drawFittedText(page, `${horas} horas · Juguetes, mobiliario, materiales y personal dedicado`, fonts.regular, 7,
    ML + 16, bY + bodyH + headerH - 35, CW - 32, rgb(0.75, 0.75, 0.78));
  page.drawText(priceText, { x: ML + CW - 16 - priceW, y: bY + bodyH + headerH - 26, font: fonts.bold, size: 20, color: C.white });
  let cy = bY + bodyH - 14;
  page.drawText("Incluye juguetes temáticos, mobiliario, materiales y personal por estación.", {
    x: ML + 16, y: cy, font: fonts.regular, size: 7, color: C.dlt });
  cy -= 18;
  const rightMargin = ML + CW - 16;
  for (const row of rows) {
    const color = BULLET_MAP[row.color as keyof typeof BULLET_MAP] || C.bullet_blue;
    const price = formatPrice(row.price);
    const priceWidth = textW(fonts.regular, price, 8);
    page.drawCircle({ x: ML + 22, y: cy + 3, size: 3.5, color });
    const labelWidth = drawFittedText(page, row.name, fonts.medium, 8, ML + 34, cy, CW - 62 - priceWidth, C.dark);
    drawDottedLine(page, ML + 34 + labelWidth + 6, cy + 2, rightMargin - priceWidth - 6, cy + 2, C.dlt);
    page.drawText(price, { x: rightMargin - priceWidth, y: cy, font: fonts.regular, size: 8, color: C.dark });
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
  const { titleLines, bandH, itemCount, bodyH } = cardMetrics(data, sizes, fonts);
  const totalH = bandH + bodyH;
  const bandColor = BAND_MAP[data.color as keyof typeof BAND_MAP] || C.band_blue;
  const outlineColor = OUTLINE_MAP[data.color as keyof typeof OUTLINE_MAP] || C.outline_blue;
  const bulletColor = BULLET_MAP[data.color as keyof typeof BULLET_MAP] || C.bullet_blue;
  const cardY = y - totalH;
  drawRoundedRect(page, x, cardY, sizes.width, totalH, 7, { color: C.white });
  drawRoundedRect(page, x, cardY, sizes.width, totalH, 7, { borderColor: outlineColor, borderWidth: 0.8 });
  drawRoundedRect(page, x, cardY + bodyH, sizes.width, bandH, 7, { color: bandColor });
  page.drawRectangle({ x, y: cardY + bodyH, width: sizes.width, height: 7, color: bandColor });
  let titleY = y - 16;
  for (const line of titleLines) {
    drawFittedText(page, line, fonts.bold, sizes.titleSz, x + sizes.padX, titleY, sizes.width - 2 * sizes.padX, C.white);
    titleY -= sizes.titleSz + 2;
  }
  drawFittedText(page, data.subtitulo, fonts.light, sizes.subSz, x + sizes.padX, titleY - 1, sizes.width - 2 * sizes.padX, rgb(1, 1, 0.95));
  const priceStr = formatPrice(data.precio);
  drawFittedText(page, priceStr, fonts.bold, sizes.priceSz, x + sizes.padX, cardY + bodyH + 9, sizes.width - 2 * sizes.padX, C.white);
  let cy = cardY + bodyH - sizes.bodyPadTop;
  page.drawText(itemCount ? "Incluye:" : "Servicio cotizado", { x: x + sizes.padX, y: cy, font: fonts.medium, size: sizes.itemSz, color: C.dark });
  cy -= sizes.itemSpacing + 2;
  for (let i = 0; i < itemCount; i++) {
    page.drawCircle({ x: x + sizes.padX + sizes.bulletR, y: cy + 2, size: sizes.bulletR, color: bulletColor });
    drawFittedText(page, data.items[i], fonts.regular, sizes.itemSz, x + sizes.padX + sizes.bulletR * 2 + 6, cy,
      sizes.width - 2 * sizes.padX - sizes.bulletR * 2 - 6, C.dark);
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
    drawFittedText(page, resumen, fonts.regular, 7.5, ML + 16, midY - 12, CW - 62 - textW(fonts.bold, formatPrice(total), 28), rgb(0.92, 0.88, 0.86));
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

  const label = noteText.startsWith("Incluye") || noteText.startsWith("Importes") ? "" : "Hora adicional disponible: ";
  page.drawText(label, { x: ML + 16, y: nY + 6, font: fonts.medium, size: 7, color: C.dark });
  const labelW = textW(fonts.medium, label, 7);
  drawFittedText(page, noteText, fonts.regular, 7, ML + 16 + labelW, nY + 6, CW - 32 - labelW, C.dlt);
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
    { x: W - MR + 18, y: y - 18, size: 12 },
    { x: ML - 18, y: (y + contentBottom) / 2, size: 10 },
    { x: W - MR + 18, y: (y + contentBottom) / 2 + 30, size: 9 },
    { x: ML - 18, y: contentBottom + 30, size: 10 },
    { x: ML - 18, y: contentBottom + 10, size: 8 },
    { x: W - MR + 18, y: contentBottom + 20, size: 10 },
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
async function loadFonts(pdfDoc: PDFDocument): Promise<FontSet> {
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  return { bold: helveticaBold, medium: helveticaBold, regular: helvetica, light: helvetica };
}

// ─── Validation ─────────────────────────────────────────────────
export function validate(req: QuoteRequest, sets: ReturnType<typeof deriveServiceSets>): string[] {
  const errors: string[] = [];
  if (typeof req.cliente !== "string" || !req.cliente.trim()) errors.push("cliente es requerido");
  if (!Number.isSafeInteger(req.n_ninos) || req.n_ninos < 1) errors.push("n_ninos debe ser un entero >= 1");
  if (typeof req.horas !== "number" || !Number.isFinite(req.horas) || req.horas < 1) errors.push("horas debe ser un número finito >= 1");
  if (typeof req.fecha !== "string" || !req.fecha.trim()) errors.push("fecha es requerida");
  const groups = [
    ["estaciones", sets.estacionIds], ["fijos", sets.fijoIds],
    ["talleres", sets.tallerIds], ["per_child", sets.perChildIds],
  ] as const;
  const seen = new Set<string>();
  let total = 0;
  for (const [field, allowed] of groups) {
    const ids = req[field];
    if (ids === undefined) continue;
    if (!Array.isArray(ids)) { errors.push(`${field} debe ser una lista`); continue; }
    total += ids.length;
    for (const id of ids) {
      if (typeof id !== "string" || !allowed.has(id)) errors.push(`Servicio inválido en ${field}: ${String(id)}`);
      if (seen.has(id)) errors.push(`Servicio duplicado: ${String(id)}`);
      seen.add(id);
    }
  }
  // Preserve this channel's current minimum pending the explicit business decision.
  if (Array.isArray(req.estaciones) && req.estaciones.length === 1) errors.push("Mínimo 2 estaciones");
  if (total === 0) errors.push("Debe incluir al menos 1 servicio");
  for (const [field, maximum] of [["logistics_fee", Infinity], ["discount_percentage", 100], ["anticipo_pct", 100]] as const) {
    const value = req[field];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum)) {
      errors.push(`${field} debe ser un número válido entre 0 y ${maximum}`);
    }
  }
  for (const field of ["discount_enabled", "cancelacion"] as const) {
    if (req[field] !== undefined && typeof req[field] !== "boolean") errors.push(`${field} debe ser booleano`);
  }
  for (const field of ["hora_evento", "fecha_emision", "vigencia", "titulo", "subtitulo"] as const) {
    if (req[field] !== undefined && typeof req[field] !== "string") errors.push(`${field} debe ser texto`);
  }
  if (req.notas_extra !== undefined && (!Array.isArray(req.notas_extra) || req.notas_extra.some(note => typeof note !== "string"))) {
    errors.push("notas_extra debe ser una lista de textos");
  }
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
export interface RenderOptions {
  // Injected only by trusted callers/tests; never read from the request body.
  loadIcons?: (document: PDFDocument) => Promise<IconCache>;
}

export async function generateQuotePDF(config: QuoteRequest, dbServices: Map<string, DBService>, _supabase?: unknown, bankInfo?: string,
  snapshot?: QuoteSnapshot, options: RenderOptions = {}): Promise<Uint8Array> {
  const resolved = resolveDefaults(config);
  const pricing = calcularTotal(resolved, dbServices, snapshot);
  const bloques = calcularLayout(resolved, dbServices, snapshot);
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const icons = await (options.loadIcons ?? loadAllIcons)(pdfDoc);
  const condiciones = generarCondiciones(resolved);
  // Do not advertise today's catalog hourly rates on a historical quote.
  const horaExtraText = snapshot ? "Importes conservados de la cotización guardada." : generarNotaHoraExtra(resolved, dbServices);
  const resumen = generarResumen(resolved);
  const FOOTER_H = 42;
  const RAINBOW_H = 4;
  const CONTENT_BOTTOM = 94;
  let servicePageNumber = 0;
  const decorateFooter = (page: PDFPage) => {
    drawIconBand(page, FOOTER_H + RAINBOW_H, icons);
    drawRainbowStripe(page, FOOTER_H);
    drawFooter(page, fonts);
  };
  const createServicePage = () => {
    const page = pdfDoc.addPage([W, H]);
    drawBackground(page);
    let y = drawHeader(page, fonts, H, resolved.fecha_emision!);
    y = drawTitleStrip(page, fonts, y - 6, resolved.titulo!, servicePageNumber++ ? "Servicios · Continuación" : resolved.subtitulo!);
    y = drawEventCallout(page, fonts, y - 6, resolved);
    decorateFooter(page);
    return { page, y: y - 22 };
  };
  const extraRows = Number(pricing.logisticsFee > 0) + Number(pricing.discountAmount > 0) + Number(pricing.adjustment !== 0);
  const totalsHeight = extraRows * 36 + 52 + (horaExtraText ? 30 : 0);
  let current = createServicePage();
  const pageContentHeight = current.y - CONTENT_BOTTOM;
  for (const [index, block] of bloques.entries()) {
    const height = block.tipo === "estacion_resumen" ? calcEstacionResumenH(block.rows.length) : calcCardRowH(block.cards, fonts);
    const together = height + 14 + totalsHeight;
    const required = index === bloques.length - 1 && together <= pageContentHeight ? together : height;
    if (current.y - required < CONTENT_BOTTOM) current = createServicePage();
    if (current.y - height < CONTENT_BOTTOM) throw new Error("Service description is too long to fit on a PDF page");
    current.y = block.tipo === "estacion_resumen"
      ? drawEstacionResumen(current.page, fonts, current.y, block.rows, block.precio, config.horas)
      : drawCardRow(current.page, fonts, current.y, block.cards);
    current.y -= 14;
  }
  if (current.y - totalsHeight < CONTENT_BOTTOM) current = createServicePage();
  const amountRow = (label: string, value: number, background: ReturnType<typeof rgb>, color: ReturnType<typeof rgb>) => {
    current.page.drawRectangle({ x: ML, y: current.y - 28, width: CW, height: 28, color: background });
    drawFittedText(current.page, label, fonts.medium, 9, ML + 10, current.y - 18, CW - 120, color);
    const text = value < 0 ? `-${formatPrice(-value)}` : formatPrice(value);
    const width = textW(fonts.bold, text, 10);
    current.page.drawText(text, { x: ML + CW - 10 - width, y: current.y - 18, size: 10, font: fonts.bold, color });
    current.y -= 36;
  };
  if (pricing.logisticsFee > 0) amountRow("Gastos de operación y arrastre", pricing.logisticsFee, rgb(1, 0.95, 0.88), rgb(0.35, 0.25, 0.1));
  if (pricing.discountAmount > 0) amountRow(`Descuento (${(config.discount_percentage ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%)`,
    -pricing.discountAmount, rgb(0.88, 0.96, 0.88), rgb(0.1, 0.4, 0.15));
  if (pricing.adjustment !== 0) amountRow("Ajuste para conciliar el total guardado", pricing.adjustment, C.cream, C.dark);
  current.y = drawTotalBar(current.page, fonts, current.y, pricing.total, resumen) - 8;
  if (horaExtraText) current.y = drawExtraHourNote(current.page, fonts, current.y, horaExtraText);

  const page2 = pdfDoc.addPage([W, H]);
  drawBackground(page2);
  let y2 = drawPage2Header(page2, fonts, H, resolved.cliente) - 16;
  y2 = drawConditionsPage2(page2, fonts, y2, condiciones) - 16;
  y2 = drawPaymentInfoPage2(page2, fonts, y2, bankInfo) - 16;
  y2 = drawVigencia(page2, fonts, y2, resolved.vigencia!);
  drawScatteredIcons(page2, H - 64, y2, icons);
  decorateFooter(page2);
  return await pdfDoc.save();
}

// ─── Quote-from-DB Mapper ───────────────────────────────────────
export function mapSavedQuoteToConfig(quote: any, snapshot: QuoteSnapshot, dbServices: Map<string, DBService>): QuoteRequest {
  const sets = deriveServiceSets(dbServices);
  const estaciones: string[] = [], fijos: string[] = [], talleres: string[] = [], perChild: string[] = [];
  for (const line of snapshot.lines) {
    const id = line.serviceId;
    if (sets.perChildIds.has(id)) perChild.push(id);
    else if (sets.estacionIds.has(id)) estaciones.push(id);
    else if (sets.tallerIds.has(id)) talleres.push(id);
    else fijos.push(id); // Deleted catalog services remain present using saved facts.
  }
  let fecha = "Por confirmar";
  if (quote.event_date) {
    const date = new Date(`${quote.event_date}T12:00:00Z`);
    fecha = Number.isNaN(date.getTime()) ? String(quote.event_date)
      : date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  }
  return {
    cliente: quote.customer_name, n_ninos: quote.children_count ?? 15,
    horas: BASE_HOURS + (quote.extra_hours ?? 0), fecha,
    fecha_emision: formatSavedQuoteDate(quote.created_at),
    estaciones, fijos, talleres, per_child: perChild,
    logistics_fee: snapshot.logisticsFee,
    discount_enabled: quote.discount_enabled ?? false,
    discount_percentage: Number(quote.discount_percentage ?? 0),
  };
}

export async function mapQuoteToConfig(supabase: any, quoteId: string, dbServices: Map<string, DBService>) {
  const { data: quote, error: quoteError } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (quoteError || !quote) throw new Error("Quote not found");
  const { data: rows, error: rowsError } = await supabase.from("quote_services")
    .select("id, service_id, service_name, service_price, quantity").eq("quote_id", quoteId).order("id");
  if (rowsError) throw new Error("Could not load saved quote services");
  const snapshot = buildQuoteSnapshot(quote, rows ?? []);
  return { config: mapSavedQuoteToConfig(quote, snapshot, dbServices), snapshot };
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
    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body || typeof body !== "object" || Array.isArray(body) || (body.quoteId !== undefined && (typeof body.quoteId !== "string" || !body.quoteId.trim()))) {
      return new Response(JSON.stringify({ error: "Invalid quote request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // A single catalog read supplies presentation metadata. Historical quotes also
    // include inactive services; deleted ones render from their saved row alone.
    let catalogQuery = supabase.from("services").select("id, title, category, base_price, hora_extra, features, pdf_color, pdf_subtitle, pricing_type");
    if (!body.quoteId) catalogQuery = catalogQuery.eq("is_active", true);
    const { data: dbServicesRaw, error: catalogError } = await catalogQuery;
    if (catalogError) throw new Error("Could not load service catalog");
    const dbServices = new Map<string, DBService>();
    for (const s of dbServicesRaw || []) {
      dbServices.set(s.id, s as DBService);
    }

    // Fetch bank info from company_settings
    const { data: companySettings } = await supabase
      .from("company_settings").select("bank_info").single();
    const bankInfo = companySettings?.bank_info || undefined;

    let config: QuoteRequest;
    let snapshot: QuoteSnapshot | undefined;
    let quoteId: string | null = null;

    if (body.quoteId) {
      quoteId = body.quoteId;
      ({ config, snapshot } = await mapQuoteToConfig(supabase, quoteId, dbServices));
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

    const pdfBytes = await generateQuotePDF(config, dbServices, supabase, bankInfo, snapshot);

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
              ...(config.per_child || []),
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
