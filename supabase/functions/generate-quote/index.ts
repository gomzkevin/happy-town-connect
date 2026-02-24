// ═══════════════════════════════════════════════════════════════
// generate-quote — Supabase Edge Function
// Generates branded PDF quotes for Japitown using pdf-lib
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

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
}

interface FontSet {
  bold: PDFFont;
  medium: PDFFont;
  regular: PDFFont;
  light: PDFFont;
}

interface CardData {
  tipo: "fijo" | "taller";
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
}

// ─── Page Constants ─────────────────────────────────────────────
const W = 612;
const H = 792;
const ML = 42;
const MR = 42;
const CW = W - ML - MR; // 528

// ─── Colors ─────────────────────────────────────────────────────
const C = {
  brown: rgb(0.737, 0.659, 0.627),
  brown_lt: rgb(0.831, 0.769, 0.737),
  cream: rgb(0.953, 0.918, 0.898),
  lcream: rgb(1.0, 0.965, 0.886),
  dark: rgb(0.306, 0.31, 0.31),
  dlt: rgb(0.494, 0.498, 0.498),
  pink: rgb(0.973, 0.761, 0.667),
  blue: rgb(0.608, 0.761, 0.898),
  green: rgb(0.518, 0.737, 0.439),
  yellow: rgb(0.965, 0.733, 0.22),
  red: rgb(0.914, 0.369, 0.239),
  purple: rgb(0.643, 0.565, 0.769),
  white: rgb(1, 1, 1),
  offwhite: rgb(0.98, 0.969, 0.957),
};

const COLOR_MAP: Record<string, ReturnType<typeof rgb>> = {
  blue: C.blue, yellow: C.yellow, red: C.red,
  green: C.green, pink: C.pink, purple: C.purple,
};

// ─── Card Sizes by columns ──────────────────────────────────────
const CARD_SIZES: Record<number, CardSizes> = {
  1: { width: CW * 0.58, gap: 0, bandH: 40, titleSz: 12, subSz: 6.5, priceSz: 14, itemSz: 6.5, itemSpacing: 11, padX: 14, bulletR: 1.8 },
  2: { width: (CW - 14) / 2, gap: 14, bandH: 38, titleSz: 11, subSz: 6, priceSz: 13, itemSz: 6.2, itemSpacing: 10, padX: 12, bulletR: 1.5 },
  3: { width: (CW - 20) / 3, gap: 10, bandH: 36, titleSz: 10, subSz: 5.5, priceSz: 12, itemSz: 5.8, itemSpacing: 9.5, padX: 10, bulletR: 1.3 },
};

// ─── Service Classification ─────────────────────────────────────
const ESTACION_IDS = ["guarderia", "construccion", "hamburgueseria", "supermercado", "veterinaria", "cafeteria", "correo", "peluqueria", "decora-cupcake"];
const FIJO_IDS = ["spa", "pesca", "area_bebes", "inflable_bebes"];
const TALLER_IDS = ["caballetes", "yesitos", "haz-pulsera", "foamy", "diamante"];

// ─── Icon Map (service key → storage path) ──────────────────────
const ICON_MAP: Record<string, string> = {
  guarderia: "icons/Iconos-12.png",
  construccion: "icons/Iconos-04.png",
  hamburgueseria: "icons/Iconos-03.png",
  supermercado: "icons/Iconos-05.png",
  veterinaria: "icons/Iconos-07.png",
  cafeteria: "icons/Iconos-06.png",
  correo: "icons/Iconos-08.png",
  peluqueria: "icons/Iconos-09.png",
  "decora-cupcake": "icons/Iconos-10.png",
  spa: "icons/Iconos-02.png",
  pesca: "icons/Iconos-01.png",
  area_bebes: "icons/Iconos-11.png",
  inflable_bebes: "icons/Iconos-11.png",
  caballetes: "icons/Iconos-16.png",
  yesitos: "icons/Iconos-16.png",
  "haz-pulsera": "icons/Iconos-16.png",
  foamy: "icons/Iconos-16.png",
  diamante: "icons/Iconos-16.png",
};

// ─── Catalog (visual presentation data) ─────────────────────────
const CATALOGO_ESTACIONES: Record<string, { nombre: string; color: string; subtitulo: string; items: string[] }> = {
  guarderia: { nombre: "Guardería", color: "blue", subtitulo: "Cuidado y juego para los más pequeños", items: ["Cunas y cambiadores", "Juguetes sensoriales", "Zona de juego segura", "Staff dedicado"] },
  construccion: { nombre: "Construcción", color: "yellow", subtitulo: "Construye, imagina y crea", items: ["Bloques de construcción", "Herramientas de juguete", "Cascos y chalecos", "Material reutilizable"] },
  hamburgueseria: { nombre: "Pizzería", color: "red", subtitulo: "Pizza artesanal de juguete", items: ["Horno de juguete", "Ingredientes de felpa", "Cajas de pizza", "Uniformes de chef"] },
  supermercado: { nombre: "Supermercado", color: "green", subtitulo: "Compra, paga y diviértete", items: ["Carritos de compra", "Productos de juguete", "Cajas registradoras", "Bolsas de compra"] },
  veterinaria: { nombre: "Veterinaria", color: "green", subtitulo: "Cuida a los animalitos", items: ["Peluches de animales", "Kit veterinario", "Certificados de salud", "Batas y estetoscopios"] },
  cafeteria: { nombre: "Cafetería", color: "pink", subtitulo: "Barista por un día", items: ["Máquina de café de juguete", "Tazas y platos", "Postres de juguete", "Mandiles y gorros"] },
  correo: { nombre: "Correo", color: "blue", subtitulo: "Envía cartas y paquetes", items: ["Buzón de correo", "Sobres y estampillas", "Paquetes de juguete", "Uniforme postal"] },
  peluqueria: { nombre: "Peluquería", color: "purple", subtitulo: "Estilista por un día", items: ["Secadoras de juguete", "Peines y cepillos", "Accesorios para el pelo", "Espejo y silla"] },
  "decora-cupcake": { nombre: "Decora tu Cupcake", color: "pink", subtitulo: "Decora y disfruta", items: ["Cupcakes", "Betún de colores", "Decoraciones", "Sprinkles"] },
};

const CATALOGO_FIJOS: Record<string, { nombre: string; color: string; subtitulo: string; items: string[] }> = {
  spa: { nombre: "SPA", color: "pink", subtitulo: "Relajación y cuidado personal", items: ["Mascarillas faciales", "Aplicación de esmalte", "Accesorios para el pelo", "Aromaterapia infantil"] },
  pesca: { nombre: "Pesca y Boliche", color: "blue", subtitulo: "Diversión con cañas y pinos", items: ["Cañas de pescar magnéticas", "Peces de juguete", "Set de boliche completo", "Equipo reutilizable"] },
  area_bebes: { nombre: "Área de Bebés", color: "blue", subtitulo: "Espacio seguro para los más pequeños", items: ["Toldo de protección solar", "Tapete acolchado", "Juguetes sensoriales", "Staff dedicado"] },
  inflable_bebes: { nombre: "Inflable para Bebés", color: "green", subtitulo: "Brinca-brinca seguro para bebés", items: ["Inflable 2×2m", "Pelotas de colores", "Supervisión constante", "Montaje incluido"] },
};

const CATALOGO_TALLERES: Record<string, { nombre: string; color: string; subtitulo: string; itemsFn: (n: number) => string[] }> = {
  caballetes: { nombre: "Caballetes", color: "purple", subtitulo: "Pintura y arte para todos", itemsFn: (n) => [`${n} impresiones artísticas`, `Set de pintura para ${n} niños`, "Caballetes de madera", "Pinceles y paletas"] },
  yesitos: { nombre: "Yesitos", color: "pink", subtitulo: "Pinta tus figuras de yeso", itemsFn: (n) => [`${n * 3} figuras de yeso (3 por niño)`, `Set de pintura para ${n} niños`, "Pinceles individuales", "Bolsas para llevar"] },
  "haz-pulsera": { nombre: "Arma tu Pulsera", color: "green", subtitulo: "Diseña tu propia joyería", itemsFn: (n) => [`Kit de charms para ${n} niños`, "Hilo encerado y cuentas", "Dijes decorativos", "Bolsas de regalo"] },
  foamy: { nombre: "Foami Moldeable", color: "yellow", subtitulo: "Moldea y crea figuras", itemsFn: (n) => [`Foami moldeable para ${n} niños`, "Moldes y cortadores", "Accesorios decorativos", "Bolsas para llevar"] },
  diamante: { nombre: "Arte Diamante", color: "blue", subtitulo: "Brilla con arte de gemas", itemsFn: (n) => [`Kit de arte diamante para ${n} niños`, "Gemas de colores surtidos", "Plantillas temáticas", "Bolsas para llevar"] },
};

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

function precioEstaciones(n: number): number {
  if (n < 2) return 0;
  return Math.floor(n / 2) * 3000 + (n % 2) * 1800;
}

function precioTaller(basePrice: number, nNinos: number): number {
  return Math.round(basePrice * getMultiplicador(nNinos));
}

function calcularTotal(
  config: QuoteRequest,
  dbServices: Map<string, DBService>
): { total: number; desglose: Record<string, number> } {
  let total = 0;
  const desglose: Record<string, number> = {};

  // Estaciones (group pricing, minimum 2)
  const nEst = config.estaciones?.length ?? 0;
  if (nEst >= 2) {
    const p = precioEstaciones(nEst);
    total += p;
    desglose.estaciones = p;
  }

  // Fijos (fixed pricing from DB)
  for (const key of config.fijos ?? []) {
    const svc = dbServices.get(key);
    const p = svc?.base_price ?? 0;
    total += p;
    desglose[key] = p;
  }

  // Talleres (tiered pricing from DB)
  for (const key of config.talleres ?? []) {
    const svc = dbServices.get(key);
    const base = svc?.base_price ?? 0;
    const p = precioTaller(base, config.n_ninos);
    total += p;
    desglose[key] = p;
  }

  return { total, desglose };
}

// ─── Layout Engine ──────────────────────────────────────────────
function calcularLayout(config: QuoteRequest, dbServices: Map<string, DBService>): LayoutBlock[] {
  const bloques: LayoutBlock[] = [];
  const est = config.estaciones || [];
  const fij = config.fijos || [];
  const tal = config.talleres || [];

  if (est.length >= 2) {
    bloques.push({ tipo: "estacion_resumen", estaciones: est, precio: precioEstaciones(est.length) });
  }

  const cards: CardData[] = [];
  for (const key of fij) {
    const svc = dbServices.get(key);
    const cat = CATALOGO_FIJOS[key];
    cards.push({
      tipo: "fijo", key,
      nombre: cat?.nombre || svc?.title || key,
      precio: svc?.base_price ?? 0,
      subtitulo: cat?.subtitulo || "",
      items: cat?.items || svc?.features || [],
      color: cat?.color || "blue",
    });
  }
  for (const key of tal) {
    const svc = dbServices.get(key);
    const cat = CATALOGO_TALLERES[key];
    const precio = precioTaller(svc?.base_price ?? 0, config.n_ninos);
    cards.push({
      tipo: "taller", key,
      nombre: cat?.nombre || svc?.title || key,
      precio,
      subtitulo: cat?.subtitulo || "",
      items: cat?.itemsFn?.(config.n_ninos) || svc?.features || [],
      color: cat?.color || "blue",
    });
  }

  const filas = distribuirEnFilas(cards);
  for (const fila of filas) {
    bloques.push({ tipo: "fila_cards", cards: fila, cardsPerRow: fila.length });
  }

  return bloques;
}

function distribuirEnFilas(cards: CardData[]): CardData[][] {
  const n = cards.length;
  if (n === 0) return [];
  if (n <= 3) return [cards];
  if (n <= 5) return [cards.slice(0, 2), cards.slice(2)];
  if (n <= 6) return [cards.slice(0, 3), cards.slice(3)];
  return [cards.slice(0, 3), cards.slice(3, 6), cards.slice(6, 9)];
}

// ─── Helpers ────────────────────────────────────────────────────
function formatPrice(amount: number): string {
  return "$" + amount.toLocaleString("es-MX");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
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
  const parts: string[] = [];
  const nEst = config.estaciones?.length ?? 0;
  if (nEst > 0) parts.push(`${nEst} estacion${nEst > 1 ? "es" : ""}`);
  const nFij = config.fijos?.length ?? 0;
  if (nFij > 0) parts.push(`${nFij} servicio${nFij > 1 ? "s" : ""} fijo${nFij > 1 ? "s" : ""}`);
  const nTal = config.talleres?.length ?? 0;
  if (nTal > 0) parts.push(`${nTal} taller${nTal > 1 ? "es" : ""}`);
  return parts.length > 0
    ? `Propuesta personalizada con ${parts.join(", ")} para ${config.n_ninos} niños`
    : `Propuesta personalizada para ${config.n_ninos} niños`;
}

function generarResumen(config: QuoteRequest): string {
  const parts: string[] = [];
  const nEst = config.estaciones?.length ?? 0;
  if (nEst >= 1) parts.push(`${nEst} estación${nEst > 1 ? "es" : ""}`);
  for (const key of config.fijos ?? []) parts.push(CATALOGO_FIJOS[key]?.nombre || key);
  for (const key of config.talleres ?? []) parts.push(CATALOGO_TALLERES[key]?.nombre || key);
  return parts.join(" · ");
}

function generarCondiciones(config: QuoteRequest): string[] {
  const conds = [
    `El servicio tiene una duración de ${config.horas} horas.`,
    "Los precios incluyen personal operativo, material y equipo.",
    `Se requiere un anticipo del ${config.anticipo_pct}% para confirmar la reserva.`,
    `Esta cotización tiene una vigencia de ${config.vigencia}.`,
    "Los precios pueden variar si cambia el número de niños.",
  ];
  if (config.cancelacion) {
    conds.push("Una vez confirmada la reserva, el anticipo no es reembolsable en caso de cancelación.");
  }
  conds.push(...(config.notas_extra || []));
  return conds;
}

function generarNotaHoraExtra(config: QuoteRequest, dbServices: Map<string, DBService>): string {
  const parts: string[] = [];
  if ((config.estaciones?.length ?? 0) >= 2) parts.push("$500/estación");
  const extras: Record<number, string[]> = {};
  for (const key of config.fijos ?? []) {
    const p = dbServices.get(key)?.hora_extra ?? 500;
    (extras[p] ||= []).push(CATALOGO_FIJOS[key]?.nombre || key);
  }
  for (const key of config.talleres ?? []) {
    const p = dbServices.get(key)?.hora_extra ?? 500;
    (extras[p] ||= []).push(CATALOGO_TALLERES[key]?.nombre || key);
  }
  for (const [precio, nombres] of Object.entries(extras).sort((a, b) => +b[0] - +a[0])) {
    parts.push(`${formatPrice(Number(precio))} ${nombres.join(", ")}`);
  }
  return parts.join(" · ");
}

// ─── Validation ─────────────────────────────────────────────────
function validate(req: QuoteRequest): string[] {
  const errors: string[] = [];
  if (!req.cliente?.trim()) errors.push("cliente es requerido");
  if (!req.n_ninos || req.n_ninos < 1) errors.push("n_ninos debe ser >= 1");
  if (!req.horas || req.horas < 1) errors.push("horas debe ser >= 1");
  if (!req.fecha?.trim()) errors.push("fecha es requerida");
  if ((req.estaciones?.length ?? 0) === 1) errors.push("Mínimo 2 estaciones");
  const total = (req.estaciones?.length || 0) + (req.fijos?.length || 0) + (req.talleres?.length || 0);
  if (total === 0) errors.push("Debe incluir al menos 1 servicio");

  // Validate service keys exist in catalog
  req.estaciones?.forEach(k => {
    if (!ESTACION_IDS.includes(k)) errors.push(`Estación inválida: ${k}`);
  });
  req.fijos?.forEach(k => {
    if (!FIJO_IDS.includes(k)) errors.push(`Servicio fijo inválido: ${k}`);
  });
  req.talleres?.forEach(k => {
    if (!TALLER_IDS.includes(k)) errors.push(`Taller inválido: ${k}`);
  });

  return errors;
}

// ─── Font Loading ───────────────────────────────────────────────
let fontBytesCache: { bold: Uint8Array; medium: Uint8Array; regular: Uint8Array; light: Uint8Array } | null = null;

async function loadFonts(pdfDoc: InstanceType<typeof PDFDocument>): Promise<FontSet> {
  pdfDoc.registerFontkit(fontkit);
  try {
    const storageUrl = Deno.env.get("SUPABASE_URL") + "/storage/v1/object/public/japitown-assets";
    if (!fontBytesCache) {
      const [bold, medium, regular, light] = await Promise.all([
        fetchAsset(storageUrl, "fonts/Poppins-Bold.ttf"),
        fetchAsset(storageUrl, "fonts/Poppins-Medium.ttf"),
        fetchAsset(storageUrl, "fonts/Poppins-Regular.ttf"),
        fetchAsset(storageUrl, "fonts/Poppins-Light.ttf"),
      ]);
      fontBytesCache = { bold, medium, regular, light };
    }
    return {
      bold: await pdfDoc.embedFont(fontBytesCache.bold),
      medium: await pdfDoc.embedFont(fontBytesCache.medium),
      regular: await pdfDoc.embedFont(fontBytesCache.regular),
      light: await pdfDoc.embedFont(fontBytesCache.light),
    };
  } catch (e) {
    console.warn("Custom fonts unavailable, using Helvetica:", e.message);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    return { bold: helveticaBold, medium: helveticaBold, regular: helvetica, light: helvetica };
  }
}

async function fetchAsset(baseUrl: string, path: string): Promise<Uint8Array> {
  const res = await fetch(`${baseUrl}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch asset: ${path} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

// ─── Icon Loading ───────────────────────────────────────────────
type EmbeddedIconCache = Map<string, any>; // PDFImage

async function loadIcons(
  pdfDoc: InstanceType<typeof PDFDocument>,
  serviceKeys: string[]
): Promise<EmbeddedIconCache> {
  const cache: EmbeddedIconCache = new Map();
  const storageUrl = Deno.env.get("SUPABASE_URL") + "/storage/v1/object/public/japitown-assets";

  // Collect unique icon paths
  const pathsToLoad = new Map<string, string>(); // path → key (for dedup)
  for (const key of serviceKeys) {
    const iconPath = ICON_MAP[key];
    if (iconPath && !pathsToLoad.has(iconPath)) {
      pathsToLoad.set(iconPath, key);
    }
  }

  // Load all icons in parallel
  const entries = Array.from(pathsToLoad.entries());
  const results = await Promise.allSettled(
    entries.map(async ([path]) => {
      const bytes = await fetchAsset(storageUrl, path);
      return { path, image: await pdfDoc.embedPng(bytes) };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      cache.set(result.value.path, result.value.image);
    } else {
      console.warn("Failed to load icon:", result.reason);
    }
  }

  return cache;
}

function getIcon(cache: EmbeddedIconCache, serviceKey: string): any | null {
  const path = ICON_MAP[serviceKey];
  return path ? cache.get(path) ?? null : null;
}

// ─── Rounded Rectangle Helper ───────────────────────────────────
function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  options: { color?: ReturnType<typeof rgb>; borderColor?: ReturnType<typeof rgb>; borderWidth?: number }
) {
  const { color, borderColor, borderWidth } = options;
  r = Math.min(r, w / 2, h / 2);

  if (color) {
    // Horizontal rect (full width, reduced height)
    page.drawRectangle({ x: x, y: y + r, width: w, height: h - 2 * r, color });
    // Vertical rect (full height, reduced width)
    page.drawRectangle({ x: x + r, y: y, width: w - 2 * r, height: h, color });
    // 4 corner circles
    page.drawCircle({ x: x + r, y: y + r, size: r, color });           // bottom-left
    page.drawCircle({ x: x + w - r, y: y + r, size: r, color });       // bottom-right
    page.drawCircle({ x: x + r, y: y + h - r, size: r, color });       // top-left
    page.drawCircle({ x: x + w - r, y: y + h - r, size: r, color });   // top-right
  }

  if (borderColor && borderWidth) {
    // Draw border as 4 lines approximation using thin rectangles
    const bw = borderWidth;
    // Bottom
    page.drawRectangle({ x: x + r, y: y, width: w - 2 * r, height: bw, color: borderColor });
    // Top
    page.drawRectangle({ x: x + r, y: y + h - bw, width: w - 2 * r, height: bw, color: borderColor });
    // Left
    page.drawRectangle({ x: x, y: y + r, width: bw, height: h - 2 * r, color: borderColor });
    // Right
    page.drawRectangle({ x: x + w - bw, y: y + r, width: bw, height: h - 2 * r, color: borderColor });
  }
}

/** Draw rounded rect with only top corners rounded */
function drawRoundedRectTop(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: ReturnType<typeof rgb>
) {
  r = Math.min(r, w / 2, h / 2);
  // Main body (full width, from bottom to h - r)
  page.drawRectangle({ x, y, width: w, height: h - r, color });
  // Top strip (reduced width)
  page.drawRectangle({ x: x + r, y: y + h - r, width: w - 2 * r, height: r, color });
  // Top-left corner
  page.drawCircle({ x: x + r, y: y + h - r, size: r, color });
  // Top-right corner
  page.drawCircle({ x: x + w - r, y: y + h - r, size: r, color });
}

// ─── Rendering Functions ────────────────────────────────────────

function drawBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.cream });
}

function drawHeader(page: PDFPage, fonts: FontSet, y: number, fechaEmision: string): number {
  const barH = 55;
  page.drawRectangle({ x: 0, y: y - barH, width: W, height: barH, color: C.brown });
  page.drawText("japitown", { x: ML + 10, y: y - 32, font: fonts.bold, size: 19, color: C.cream });
  page.drawText("Eventos infantiles", { x: ML + 10, y: y - 46, font: fonts.light, size: 7.5, color: C.brown_lt });
  const dateW = fonts.regular.widthOfTextAtSize(fechaEmision, 8.5);
  page.drawText(fechaEmision, { x: W - MR - 10 - dateW, y: y - 26, font: fonts.regular, size: 8.5, color: C.cream });
  const cotLabel = "COTIZACIÓN";
  const cotW = fonts.bold.widthOfTextAtSize(cotLabel, 10);
  page.drawText(cotLabel, { x: W - MR - 10 - cotW, y: y - 42, font: fonts.bold, size: 10, color: C.lcream });
  return y - barH;
}

function drawTitleStrip(page: PDFPage, fonts: FontSet, y: number, titulo: string, subtitulo: string): number {
  const stripH = 40;
  drawRoundedRect(page, ML, y - stripH, CW, stripH, 4, { color: C.offwhite });
  page.drawText(titulo, { x: ML + 14, y: y - 18, font: fonts.bold, size: 13, color: C.dark });
  page.drawText(subtitulo, { x: ML + 14, y: y - 32, font: fonts.regular, size: 7.5, color: C.dlt });
  return y - stripH;
}

function drawEventCallout(page: PDFPage, fonts: FontSet, y: number, config: QuoteRequest): number {
  const callH = 38;
  drawRoundedRect(page, ML, y - callH, CW, callH, 4, { color: C.lcream });
  drawRoundedRect(page, ML, y - callH, CW, callH, 4, { borderColor: C.brown_lt, borderWidth: 1 });
  const mainText = `Evento para ${config.n_ninos} niños · ${config.horas} horas de diversión`;
  page.drawText(mainText, { x: ML + 14, y: y - 16, font: fonts.medium, size: 8, color: C.dark });
  let subText = config.fecha;
  if (config.hora_evento) subText += ` · ${config.hora_evento}`;
  page.drawText(subText, { x: ML + 14, y: y - 30, font: fonts.regular, size: 7.2, color: C.dlt });
  return y - callH;
}

function drawEstacionResumen(page: PDFPage, fonts: FontSet, y: number, estaciones: string[], precio: number, icons: EmbeddedIconCache): number {
  const headerH = 34;
  const listH = estaciones.length * 14;
  const totalH = headerH + 12 + listH + 10;

  // Background with rounded corners
  drawRoundedRect(page, ML, y - totalH, CW, totalH, 6, { color: C.offwhite });
  // Header band with rounded top corners
  drawRoundedRectTop(page, ML, y - headerH, CW, headerH, 6, C.brown);

  page.drawText("Estaciones — Mini Ciudad", { x: ML + 14, y: y - 22, font: fonts.bold, size: 12, color: C.white });
  const priceText = formatPrice(precio);
  const priceW = fonts.bold.widthOfTextAtSize(priceText, 16);
  page.drawText(priceText, { x: ML + CW - 14 - priceW, y: y - 24, font: fonts.bold, size: 16, color: C.white });

  let cy = y - headerH - 14;
  for (const key of estaciones) {
    const nombre = CATALOGO_ESTACIONES[key]?.nombre || key;
    const color = COLOR_MAP[CATALOGO_ESTACIONES[key]?.color || "blue"] || C.blue;
    
    // Draw icon if available
    const icon = getIcon(icons, key);
    if (icon) {
      const iconSize = 14;
      page.drawImage(icon, { x: ML + 14, y: cy - 2, width: iconSize, height: iconSize });
      page.drawText(nombre, { x: ML + 14 + iconSize + 4, y: cy, font: fonts.regular, size: 8, color: C.dark });
    } else {
      page.drawCircle({ x: ML + 20, y: cy + 3, size: 3, color });
      page.drawText(nombre, { x: ML + 30, y: cy, font: fonts.regular, size: 8, color: C.dark });
    }
    cy -= 14;
  }

  return y - totalH;
}

function drawCard(page: PDFPage, fonts: FontSet, x: number, y: number, data: CardData, sizes: CardSizes, icons: EmbeddedIconCache): number {
  const itemCount = Math.min(data.items.length, 4);
  // Price is now inside band, so card body only has subtitle + incluye + items
  const totalH = sizes.bandH + 8 + 14 + (itemCount * sizes.itemSpacing) + 10;
  const bandColor = COLOR_MAP[data.color] || C.blue;
  const r = 6;

  // White card background with rounded corners
  drawRoundedRect(page, x, y - totalH, sizes.width, totalH, r, { color: C.white });
  // Colored top band with rounded top corners
  drawRoundedRectTop(page, x, y - sizes.bandH, sizes.width, sizes.bandH, r, bandColor);

  // Icon in band (left side)
  const icon = getIcon(icons, data.key);
  const iconOffset = icon ? 24 : 0;
  if (icon) {
    const iconSize = 22;
    const bandBottom = y - sizes.bandH;
    const iconY = bandBottom + (sizes.bandH - iconSize) / 2;
    page.drawImage(icon, { x: x + sizes.padX, y: iconY, width: iconSize, height: iconSize });
  }

  // Title (left, after icon) and Price (right) both vertically centered in band
  const bandBottom = y - sizes.bandH;
  const titleCenterY = bandBottom + sizes.bandH / 2 - sizes.titleSz / 2;
  page.drawText(data.nombre, { x: x + sizes.padX + iconOffset, y: titleCenterY, font: fonts.bold, size: sizes.titleSz, color: C.white });

  const priceStr = formatPrice(data.precio);
  const priceW = fonts.bold.widthOfTextAtSize(priceStr, sizes.priceSz);
  const priceCenterY = bandBottom + sizes.bandH / 2 - sizes.priceSz / 2;
  page.drawText(priceStr, { x: x + sizes.width - sizes.padX - priceW, y: priceCenterY, font: fonts.bold, size: sizes.priceSz, color: C.white });

  let cy = y - sizes.bandH - 8;
  // Subtitle
  page.drawText(data.subtitulo, { x: x + sizes.padX, y: cy, font: fonts.light, size: sizes.subSz, color: C.dlt });
  cy -= 12;

  // "Incluye:" label
  page.drawText("Incluye:", { x: x + sizes.padX, y: cy, font: fonts.medium, size: sizes.itemSz, color: C.dlt });
  cy -= sizes.itemSpacing;

  // Items
  for (let i = 0; i < itemCount; i++) {
    page.drawCircle({ x: x + sizes.padX + sizes.bulletR, y: cy + 2, size: sizes.bulletR, color: bandColor });
    page.drawText(data.items[i], { x: x + sizes.padX + sizes.bulletR * 2 + 4, y: cy, font: fonts.regular, size: sizes.itemSz, color: C.dark });
    cy -= sizes.itemSpacing;
  }

  return totalH;
}

function drawCardRow(page: PDFPage, fonts: FontSet, y: number, cards: CardData[], icons: EmbeddedIconCache): number {
  const n = cards.length as 1 | 2 | 3;
  const sizes = CARD_SIZES[n] || CARD_SIZES[3];
  let maxH = 0;

  for (let i = 0; i < cards.length; i++) {
    let x: number;
    if (n === 1) {
      x = ML + (CW - sizes.width) / 2;
    } else {
      x = ML + i * (sizes.width + sizes.gap);
    }
    const h = drawCard(page, fonts, x, y, cards[i], sizes, icons);
    if (h > maxH) maxH = h;
  }

  return y - maxH;
}

function drawTotalBar(page: PDFPage, fonts: FontSet, y: number, total: number, resumen: string): number {
  const barH = 42;
  page.drawRectangle({ x: ML, y: y - barH, width: CW, height: barH, color: C.brown });

  page.drawText("INVERSIÓN TOTAL", { x: ML + 14, y: y - 14, font: fonts.medium, size: 6.2, color: C.brown_lt });

  const priceText = formatPrice(total);
  page.drawText(priceText, { x: ML + 14, y: y - 34, font: fonts.bold, size: 22, color: C.white });
  const priceW = fonts.bold.widthOfTextAtSize(priceText, 22);
  page.drawText("MXN", { x: ML + 14 + priceW + 6, y: y - 34, font: fonts.light, size: 10, color: C.brown_lt });

  if (resumen) {
    const lines = wrapText(resumen, fonts.regular, 6.5, CW * 0.4);
    let ry = y - 14;
    for (const line of lines) {
      const lw = fonts.regular.widthOfTextAtSize(line, 6.5);
      page.drawText(line, { x: ML + CW - 14 - lw, y: ry, font: fonts.regular, size: 6.5, color: C.cream });
      ry -= 9;
    }
  }

  return y - barH;
}

function drawExtraHourNote(page: PDFPage, fonts: FontSet, y: number, noteText: string): number {
  if (!noteText) return y;
  const noteH = 18;
  drawRoundedRect(page, ML, y - noteH, CW, noteH, 4, { color: C.offwhite });
  drawRoundedRect(page, ML, y - noteH, CW, noteH, 4, { borderColor: C.brown_lt, borderWidth: 0.5 });
  const label = "Hora adicional disponible:  ";
  page.drawText(label, { x: ML + 14, y: y - 12, font: fonts.medium, size: 6.5, color: C.dark });
  const labelW = fonts.medium.widthOfTextAtSize(label, 6.5);
  page.drawText(noteText, { x: ML + 14 + labelW, y: y - 12, font: fonts.regular, size: 6.5, color: C.dlt });
  return y - noteH;
}

function drawConditions(page: PDFPage, fonts: FontSet, y: number, condiciones: string[]): number {
  const lineH = 8;
  let cy = y;
  for (const cond of condiciones) {
    cy -= lineH;
    page.drawText("•", { x: ML + 10, y: cy, font: fonts.regular, size: 6, color: C.brown });
    page.drawText(cond, { x: ML + 20, y: cy, font: fonts.regular, size: 6, color: C.dlt });
  }
  return cy - 4;
}

function drawPaymentInfo(page: PDFPage, fonts: FontSet, y: number): number {
  const infoH = 28;
  drawRoundedRect(page, ML, y - infoH, CW, infoH, 4, { color: C.lcream });
  drawRoundedRect(page, ML, y - infoH, CW, infoH, 4, { borderColor: C.brown_lt, borderWidth: 0.5 });
  page.drawText("Datos para depósito:", { x: ML + 14, y: y - 10, font: fonts.bold, size: 7, color: C.dark });
  page.drawText("BBVA · Frida Velásquez Hdez. · CLABE: 012 610 015493815314", {
    x: ML + 14, y: y - 22, font: fonts.regular, size: 6.5, color: C.dlt,
  });
  return y - infoH;
}

function drawFooter(page: PDFPage, fonts: FontSet): void {
  const footerH = 55;
  const stripeH = 3.5;
  // Stripe above footer
  page.drawRectangle({ x: 0, y: footerH, width: W, height: stripeH, color: C.brown });
  // Footer background
  page.drawRectangle({ x: 0, y: 0, width: W, height: footerH, color: C.brown });
  // Logo
  page.drawText("japitown", { x: ML + 10, y: 32, font: fonts.bold, size: 12, color: C.cream });
  page.drawText("Eventos infantiles", { x: ML + 10, y: 18, font: fonts.light, size: 7, color: C.brown_lt });
  // Contact
  const email = "cotizaciones@japitown.com";
  const emailW = fonts.regular.widthOfTextAtSize(email, 7);
  page.drawText(email, { x: W - MR - 10 - emailW, y: 28, font: fonts.regular, size: 7, color: C.cream });
}

// ─── Height Estimation (for adaptive spacing) ───────────────────
function estimateBlockHeight(bloque: LayoutBlock, sizes?: CardSizes): number {
  if (bloque.tipo === "estacion_resumen") {
    const headerH = 34;
    const listH = bloque.estaciones.length * 14;
    return headerH + 12 + listH + 10;
  } else {
    const n = bloque.cardsPerRow as 1 | 2 | 3;
    const s = CARD_SIZES[n] || CARD_SIZES[3];
    const itemCount = 4; // max items
    return s.bandH + 8 + 14 + (itemCount * s.itemSpacing) + 10;
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────
async function generateQuotePDF(config: QuoteRequest, dbServices: Map<string, DBService>): Promise<Uint8Array> {
  const resolved = resolveDefaults(config);
  const { total } = calcularTotal(resolved, dbServices);
  const bloques = calcularLayout(resolved, dbServices);

  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);

  // Load icons from storage
  const allServiceKeys = [
    ...(resolved.estaciones || []),
    ...(resolved.fijos || []),
    ...(resolved.talleres || []),
  ];
  const icons = await loadIcons(pdfDoc, allServiceKeys);

  const page = pdfDoc.addPage([W, H]);

  // Background
  drawBackground(page);

  // ─── Calculate adaptive spacing ───
  const headerH = 55;
  const titleStripH = 40;
  const calloutH = 38;
  const totalBarH = 42;
  const footerH = 55 + 3.5; // footer + stripe

  // Estimate conditions height
  const condiciones = generarCondiciones(resolved);
  const conditionsH = condiciones.length * 8 + 4;

  // Extra hour note
  const horaExtraText = generarNotaHoraExtra(resolved, dbServices);
  const extraHourH = horaExtraText ? 18 : 0;

  // Payment info
  const paymentH = 28;

  // Dynamic blocks height
  let dynamicH = 0;
  for (const b of bloques) {
    dynamicH += estimateBlockHeight(b);
  }

  // Fixed gaps
  const fixedGaps = 5 + 10 + 16; // after header, after title, after callout
  const numGaps = bloques.length + 3; // gaps between dynamic blocks + total + extra + conditions

  const totalContentH = headerH + titleStripH + calloutH + dynamicH + totalBarH + extraHourH + conditionsH + paymentH + footerH + fixedGaps;
  const availableSpace = H - totalContentH;
  const gapExtra = Math.max(0, Math.min(availableSpace / numGaps, 20)); // cap at 20pt max

  // ─── Draw everything ───
  let y = H;
  y = drawHeader(page, fonts, y, resolved.fecha_emision!);
  y -= 5 + gapExtra * 0.3;
  y = drawTitleStrip(page, fonts, y, resolved.titulo!, resolved.subtitulo!);
  y -= 10 + gapExtra * 0.5;
  y = drawEventCallout(page, fonts, y, resolved);
  y -= 16 + gapExtra;

  // Dynamic content blocks
  for (const bloque of bloques) {
    if (bloque.tipo === "estacion_resumen") {
      y = drawEstacionResumen(page, fonts, y, bloque.estaciones, bloque.precio, icons);
    } else if (bloque.tipo === "fila_cards") {
      y = drawCardRow(page, fonts, y, bloque.cards, icons);
    }
    y -= 12 + gapExtra;
  }

  // Total bar
  const resumen = generarResumen(resolved);
  y = drawTotalBar(page, fonts, y, total, resumen);
  y -= 10 + gapExtra * 0.5;

  // Extra hour note
  if (horaExtraText) {
    y = drawExtraHourNote(page, fonts, y, horaExtraText);
    y -= 10 + gapExtra * 0.3;
  }

  // Conditions
  y = drawConditions(page, fonts, y, condiciones);
  y -= 4 + gapExtra * 0.3;

  // Payment info
  drawPaymentInfo(page, fonts, y);

  // Footer (fixed position at bottom)
  drawFooter(page, fonts);

  return await pdfDoc.save();
}

// ─── Quote-from-DB Mapper ───────────────────────────────────────
async function mapQuoteToConfig(supabase: any, quoteId: string): Promise<QuoteRequest> {
  const { data: quote, error: qErr } = await supabase
    .from("quotes").select("*").eq("id", quoteId).single();
  if (qErr || !quote) throw new Error("Quote not found: " + (qErr?.message || quoteId));

  const { data: qServices } = await supabase
    .from("quote_services").select("service_id, quantity").eq("quote_id", quoteId);

  const estaciones: string[] = [];
  const fijos: string[] = [];
  const talleres: string[] = [];

  for (const qs of qServices || []) {
    const sid = qs.service_id;
    if (ESTACION_IDS.includes(sid)) estaciones.push(sid);
    else if (FIJO_IDS.includes(sid)) fijos.push(sid);
    else if (TALLER_IDS.includes(sid)) talleres.push(sid);
  }

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

    // Fetch all active services from DB for pricing
    const { data: dbServicesRaw } = await supabase
      .from("services").select("id, title, category, base_price, hora_extra, features").eq("is_active", true);
    const dbServices = new Map<string, DBService>();
    for (const s of dbServicesRaw || []) {
      dbServices.set(s.id, s as DBService);
    }

    let config: QuoteRequest;
    let quoteId: string | null = null;

    if (body.quoteId) {
      // Mode: generate from existing quote
      quoteId = body.quoteId;
      config = await mapQuoteToConfig(supabase, quoteId);
    } else if (body.cliente) {
      // Mode: direct QuoteRequest
      config = body as QuoteRequest;
      const errors = validate(config);
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

    // Generate PDF
    const pdfBytes = await generateQuotePDF(config, dbServices);

    // Determine output mode
    const url = new URL(req.url);
    const output = url.searchParams.get("output") ?? (quoteId ? "storage" : "binary");

    if (output === "storage") {
      const safeName = config.cliente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-");
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

      // Update quote record if we have a quoteId
      if (quoteId) {
        await supabase.from("quotes").update({ pdf_url: pdfUrl }).eq("id", quoteId);
      }

      return new Response(JSON.stringify({ success: true, pdf_url: pdfUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Binary response
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
