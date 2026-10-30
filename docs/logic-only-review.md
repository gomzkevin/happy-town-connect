# Logic-only quotation candidate — 2026-10-30

Local branch: `boris/japitown-logic-only-20261030`. Inspected baseline: `40219f1` (local main). This extracts the pricing/UI work before the integrated security candidate. No remote publication, merge, deployment, live database update or customer message is included.

## Included

- Public quote submission forwards each cart quantity to the shared engine; actual-hook tests cover multi-quantity fixed/workshop/station and per-child services with discount and extra hours.
- One shared calculation policy for browser quotations and fresh canonical PDFs; email and saved PDFs use persisted line prices, quantities and totals rather than current catalog prices.
- Unchanged station pair/odd rates, child tiers, extra-hour rules, discounts and logistics. Known category aliases normalize explicitly; unknown categories never become stations by substring matching.
- Canonical service categories shared with the editor; separate validated numeric base/extra-hour inputs, independent display-price copy, preservation of zero and existing legacy categories.
- Historical total mismatches are explicitly reconciled, never silently repriced. Saved issuance date is stable across regenerated PDF/email.
- PDF service pagination, per-child validation and explicit zero extra-hour handling. Email attachment copy reflects whether a PDF actually exists.
- Regression: four stations plus Caballetes/30 children/logistics 400 yields 10000, rather than the misclassified 10500; saved 9800 remains authoritative.

## Explicitly excluded

Auth/login, membership/invitations, public submission transport/access paths, admin quote editing/payment flows, RLS, database migrations, JWT configuration, bucket visibility/signed access, access helpers, atomic RPC workflows and deployment automation are unchanged from baseline. The legacy `generate-quote-pdf` endpoint is unchanged; it already uses saved amounts and has no independent current-price policy. Existing access risks are neither fixed nor claimed safe. Existing metadata/repricing and concurrency limitations are not solved by this candidate.

No catalog correction SQL or security test dependency is included. Previously authorized production category repair is independent of this branch.

## Verification

- Clean offline locked install with lifecycle scripts disabled: passed (455 packages). No provider/network service was called.
- 44 offline tests passed, none skipped: calculation boundaries, saved facts, PDF rendering/pagination, email HTML, service form validation and actual editor static rendering.
- Frontend production build and both TypeScript projects: passed. Existing bundle-size warning remains.
- Focused lint on pricing/snapshot/email-data/editor/form/service hook: passed.
- Full lint: 56 errors/13 warnings; independently inspected baseline: 60 errors/13 warnings. Full lint is not clean; no rules disabled.
- Baseline comparison confirms AuthContext, auth components, AdminKanban, Supabase config/migrations, legacy PDF and invitation handlers are byte-identical. Canonical PDF/email handlers retain their baseline access and storage paths. `useQuotes` has only a one-line quantity mapping addition; submission access/transport is unchanged.

Static rendering is not interactive browser QA. No staging Edge execution, actual provider delivery, production permissions or concurrent-edit guarantees were tested. Review synthetic PDFs and create/edit/cancel/reopen flows in a disposable staging environment before separate rollout approval. Publication requires an authorized draft PR; merge/deployment remain separately gated. Recheck remote main before publishing because this baseline is local.
