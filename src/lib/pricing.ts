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
}

/**
 * Calculate the total price for a set of selected services,
 * applying station-pair and taller-multiplier logic.
 */
export function calcularPreciosCotizacion(
  services: ServiceForPricing[],
  nNinos: number
): { perService: Map<string, number>; total: number } {
  const estaciones = services.filter(s => s.category === 'Estaciones de Juego');
  const talleres = services.filter(s => s.category === 'Talleres Creativos');
  const otros = services.filter(
    s => s.category !== 'Estaciones de Juego' && s.category !== 'Talleres Creativos'
  );

  const perService = new Map<string, number>();

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

  let total = 0;
  perService.forEach(v => (total += v));

  return { perService, total };
}

/**
 * Convenience: get the total price for stations using the pair formula.
 */
export function precioEstaciones(n: number, singleBasePrice?: number): number {
  if (n === 0) return 0;
  if (n === 1) return singleBasePrice ?? 1800;
  return Math.floor(n / 2) * 3000 + (n % 2) * 1800;
}
