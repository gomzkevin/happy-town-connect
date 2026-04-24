/**
 * Shared pricing logic — mirrors the Edge Function generate-quote rules.
 *
 * Estaciones de Juego:
 *   - 1 sola estación → base_price individual (ej. $1,800)
 *   - 2+ estaciones   → floor(n/2) * 3000 + (n%2) * 1800
 *
 * Talleres Creativos:
 *   - base_price × multiplicador(nNiños)
 *
 * Multiplicadores por tramo de niños:
 *   ≤15 → 1.0 | ≤30 → 1.3 | ≤50 → 1.5 | >50 → 1.8
 *
 * Horas extra:
 *   Cada servicio tiene un campo hora_extra ($/hr adicional).
 *   Se suma hora_extra * extraHours al precio base de cada servicio.
 */

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

export interface ServiceForPricing {
  id: string;
  base_price: number;
  category: string;
  hora_extra?: number;
  pricing_type?: 'fixed' | 'per_child' | string;
}

/**
 * Calculate the total price for a set of selected services,
 * applying station-pair, taller-multiplier, and extra hours logic.
 */
export function calcularPreciosCotizacion(
  services: ServiceForPricing[],
  nNinos: number,
  extraHours: number = 0
): { perService: Map<string, number>; total: number } {
  // Per-child products are billed independently of category/extra hours
  const perChildItems = services.filter(s => s.pricing_type === 'per_child');
  const fixedScope = services.filter(s => s.pricing_type !== 'per_child');

  const estaciones = fixedScope.filter(s => s.category === 'Estaciones de Juego');
  const talleres = fixedScope.filter(s => s.category === 'Talleres Creativos');
  const otros = fixedScope.filter(
    s => s.category !== 'Estaciones de Juego' && s.category !== 'Talleres Creativos'
  );

  const perService = new Map<string, number>();

  // Per-child products: base_price × nNinos, no extra hours
  perChildItems.forEach(s => {
    perService.set(s.id, s.base_price * Math.max(1, nNinos || 1));
  });

  // Estaciones — pair pricing
  if (estaciones.length === 1) {
    perService.set(estaciones[0].id, estaciones[0].base_price);
  } else if (estaciones.length >= 2) {
    const totalEstaciones =
      Math.floor(estaciones.length / 2) * 3000 + (estaciones.length % 2) * 1800;
    // Distribute evenly across stations for display purposes
    const perStation = Math.round(totalEstaciones / estaciones.length);
    const remainder = totalEstaciones - perStation * estaciones.length;
    estaciones.forEach((s, i) => {
      perService.set(s.id, perStation + (i === 0 ? remainder : 0));
    });
  }

  // Talleres — multiplicador por niños
  const mult = getMultiplicador(nNinos || 15);
  talleres.forEach(s => {
    perService.set(s.id, Math.round(s.base_price * mult));
  });

  // Otros — base_price directo
  otros.forEach(s => {
    perService.set(s.id, s.base_price);
  });

  // Add extra hours cost to each service (excluding per_child products)
  if (extraHours > 0) {
    for (const s of services) {
      if (s.pricing_type === 'per_child') continue;
      const currentPrice = perService.get(s.id) ?? 0;
      const horaExtra = s.hora_extra ?? 0;
      perService.set(s.id, currentPrice + horaExtra * extraHours);
    }
  }

  let total = 0;
  perService.forEach(v => (total += v));

  return { perService, total };
}

/**
 * Apply a percentage discount to a subtotal.
 * Returns both the discount amount (rounded) and the resulting total.
 */
export function aplicarDescuento(
  subtotal: number,
  percentage: number
): { discountAmount: number; totalConDescuento: number } {
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const discountAmount = Math.round((subtotal * pct) / 100);
  return { discountAmount, totalConDescuento: subtotal - discountAmount };
}

/**
 * Convenience: get the total price for stations using the pair formula.
 */
export function precioEstaciones(n: number, singleBasePrice?: number): number {
  if (n === 0) return 0;
  if (n === 1) return singleBasePrice ?? 1800;
  return Math.floor(n / 2) * 3000 + (n % 2) * 1800;
}
