

## Problema

`PaymentProgressMini` (barra en la card del Kanban) y `QuoteDetailDialog` (vista interior) cada uno crea su propia instancia independiente del hook `useQuotePayments`. Cuando se registra un pago dentro del dialog, solo esa instancia ejecuta `fetchPayments()`. La instancia de la card mantiene datos antiguos hasta que se recarga la pagina.

## Solucion

Agregar un callback `onPaymentChange` al `QuoteDetailDialog` que se dispare cada vez que se agrega o elimina un pago. El componente padre (`AdminKanban`) mantendra un contador de version (`paymentVersion`) que se incrementa con cada cambio. `PaymentProgressMini` recibira ese contador como prop y lo usara como dependencia de su `useEffect` para re-fetchar los datos.

## Cambios tecnicos

### 1. `src/hooks/useQuotePayments.ts`
- Agregar un parametro opcional `refreshKey` al hook
- Incluir `refreshKey` en las dependencias del `useEffect` que llama a `fetchPayments`

### 2. `src/components/admin/AdminKanban.tsx`

**Estado nuevo en `AdminKanban`:**
- `const [paymentVersion, setPaymentVersion] = useState(0)`

**`PaymentProgressMini`:**
- Recibir prop `refreshKey` y pasarla al hook `useQuotePayments`

**`QuoteDetailDialog`:**
- Recibir prop `onPaymentChange: () => void`
- Llamar `onPaymentChange()` despues de `addPayment` y `deletePayment` exitosos

**Conexion en el componente padre:**
- Pasar `refreshKey={paymentVersion}` a cada `PaymentProgressMini`
- Pasar `onPaymentChange={() => setPaymentVersion(v => v + 1)}` al `QuoteDetailDialog`

## Resultado

Al registrar o eliminar un pago, todas las barras de progreso en las cards se actualizaran automaticamente sin recargar la pagina.

