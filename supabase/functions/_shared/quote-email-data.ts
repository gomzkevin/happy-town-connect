import { buildQuoteSnapshot, formatSavedQuoteDate, type SavedQuoteLine, type SavedQuoteTotals } from './quote-snapshot.ts';
export interface SavedEmailQuote extends SavedQuoteTotals {
  id: string;
  customer_name: string;
  email: string;
  phone?: string | null;
  event_date?: string | null;
  children_count?: number | null;
  location?: string | null;
  created_at: string;
}
/** Email and attachment use the same saved quote, not untrusted caller totals. */
export function buildQuoteEmailData(quote: SavedEmailQuote, rows: SavedQuoteLine[]) {
  const snapshot = buildQuoteSnapshot(quote, rows);
  if (!quote.email) throw new Error('Saved quote has no recipient email');
  return {
    customerName: quote.customer_name, email: quote.email, phone: quote.phone || undefined,
    eventDate: quote.event_date || undefined, childrenCount: quote.children_count ?? undefined,
    location: quote.location || undefined,
    services: snapshot.lines.map(line => ({name: line.name, price: line.unitPrice, quantity: line.quantity})),
    totalEstimate: snapshot.total, discountAmount: snapshot.discountAmount,
    logisticsFee: snapshot.logisticsFee, savedAdjustment: snapshot.adjustment,
    quoteNumber: `QUO-${quote.id}`, createdDate: formatSavedQuoteDate(quote.created_at),
  };
}
