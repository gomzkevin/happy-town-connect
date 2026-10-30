import { aplicarDescuento } from './pricing.ts';

export interface SavedQuoteTotals {
  total_estimate?: number | null;
  discount_enabled?: boolean | null;
  discount_percentage?: number | string | null;
  logistics_fee_enabled?: boolean | null;
  logistics_fee?: number | null;
  pricing_version?: string | null;
}
export interface SavedQuoteLine {
  id?: string;
  service_id: string;
  service_name: string;
  service_price: number;
  quantity?: number | null;
}
export interface QuoteSnapshot {
  lines: Array<{key: string; serviceId: string; name: string; unitPrice: number; quantity: number; total: number}>;
  servicesSubtotal: number;
  discountAmount: number;
  logisticsFee: number;
  total: number;
  adjustment: number;
  pricingVersion: string;
}
function amount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid saved ${label}`);
  return value;
}
/** Read saved financial facts only. Never consult or reprice from today's catalog. */
export function buildQuoteSnapshot(quote: SavedQuoteTotals, rows: SavedQuoteLine[]): QuoteSnapshot {
  const lines = rows.map((row, index) => {
    const quantity = row.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Invalid saved quantity');
    const unitPrice = amount(row.service_price, 'line price');
    const total = amount(unitPrice * quantity, 'line total');
    return { key: `${row.id || row.service_id}:${index}`, serviceId: row.service_id,
      name: row.service_name, unitPrice, quantity, total };
  });
  const servicesSubtotal = amount(lines.reduce((sum, row) => sum + row.total, 0), 'subtotal');
  const discountPercentage = Number(quote.discount_percentage ?? 0);
  if (!Number.isFinite(discountPercentage)) throw new Error('Invalid saved discount');
  const { discountAmount } = aplicarDescuento(servicesSubtotal, quote.discount_enabled ? discountPercentage : 0);
  const logisticsFee = quote.logistics_fee_enabled ? amount(quote.logistics_fee ?? 0, 'logistics fee') : 0;
  const calculated = servicesSubtotal - discountAmount + logisticsFee;
  const total = quote.total_estimate == null ? calculated : amount(quote.total_estimate, 'total');
  return {lines, servicesSubtotal, discountAmount, logisticsFee, total,
    adjustment: total - calculated, pricingVersion: quote.pricing_version || 'legacy-saved'};
}

/** Saved issuance dates never renew when a document is regenerated. */
export function formatSavedQuoteDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (!createdAt || !Number.isFinite(date.getTime())) throw new Error('Invalid saved creation date');
  return date.toLocaleDateString('es-MX', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});
}
