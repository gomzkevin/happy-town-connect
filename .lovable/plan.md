

# Fix: PDF generation crash and save edit error

## Root Causes

### Error 1: `ReferenceError: M is not defined` (Edge Function crash)
In `supabase/functions/generate-quote/index.ts`, the logistics fee rendering code (lines 1119-1120) uses `M` as margin variable, but the actual constant is `ML` (line 152). This causes every PDF generation to crash.

### Error 2: `Cannot read properties of undefined (reading 'title')` (AdminKanban save)
In `src/components/admin/AdminKanban.tsx` line 880, `availableServices.find(s => s.id === serviceId)!` can return `undefined` if a previously selected service was deactivated (e.g., the old `foamy` service). The non-null assertion `!` then causes a crash on `.title`.

## Fixes

### File 1: `supabase/functions/generate-quote/index.ts`
- Lines 1119-1120: Replace `M` with `ML` (two occurrences)

### File 2: `src/components/admin/AdminKanban.tsx`
- Line 880: Add a guard — skip services not found in `availableServices` instead of crashing:
  ```ts
  const quoteServices = serviceIds
    .map(serviceId => {
      const svc = availableServices.find(s => s.id === serviceId);
      if (!svc) return null;
      return { quote_id: quote.id, service_id: serviceId, service_name: svc.title, service_price: editPriceMap.get(serviceId) ?? svc.base_price, quantity: 1 };
    })
    .filter(Boolean);
  ```
- Apply same fix at line 510 in `NewQuoteDialog`

### Deployment
- Redeploy `generate-quote` Edge Function after fix

## Files to modify
| File | Change |
|---|---|
| `supabase/functions/generate-quote/index.ts` | `M` → `ML` on lines 1119-1120 |
| `src/components/admin/AdminKanban.tsx` | Guard against undefined service in save handlers (lines 510, 880) |

