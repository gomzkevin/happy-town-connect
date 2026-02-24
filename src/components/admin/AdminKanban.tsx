import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Calendar, Mail, Phone, MapPin, DollarSign, TrendingUp, Clock, GripVertical, ChevronRight, XCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useQuotePayments } from '@/hooks/useQuotePayments';

// Types
interface Quote {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  child_name: string | null;
  event_date: string | null;
  children_count: number | null;
  age_range: string | null;
  location: string | null;
  status: string | null;
  source: string | null;
  total_estimate: number | null;
  preferences: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deposit_amount: number | null;
  deposit_paid: boolean | null;
  total_paid: number | null;
  quote_type: string;
}

interface QuoteService {
  id: string;
  service_name: string;
  service_price: number;
  quantity: number;
}

type StageKey = 'pending' | 'contacted' | 'confirmed' | 'upcoming' | 'completed' | 'cancelled';

interface Stage {
  key: StageKey;
  label: string;
  bgColor: string;
  borderColor: string;
  allowedTransitions: StageKey[];
}

const STAGES: Stage[] = [
  { key: 'pending', label: 'Pendiente', bgColor: 'bg-japitown-yellow/10', borderColor: 'border-japitown-yellow/40', allowedTransitions: ['contacted', 'cancelled'] },
  { key: 'contacted', label: 'Contactado', bgColor: 'bg-japitown-blue/10', borderColor: 'border-japitown-blue/40', allowedTransitions: ['confirmed', 'cancelled'] },
  { key: 'confirmed', label: 'Confirmado', bgColor: 'bg-japitown-green-tag/10', borderColor: 'border-japitown-green-tag/40', allowedTransitions: ['upcoming', 'cancelled'] },
  { key: 'upcoming', label: 'Próximo', bgColor: 'bg-secondary/10', borderColor: 'border-secondary/40', allowedTransitions: ['completed'] },
  { key: 'completed', label: 'Realizado', bgColor: 'bg-japitown-green/10', borderColor: 'border-japitown-green/40', allowedTransitions: [] },
  { key: 'cancelled', label: 'Cancelado', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30', allowedTransitions: [] },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s])) as Record<StageKey, Stage>;

// Module-level drag state (HTML5 D&D can't read dataTransfer in dragover)
let _dragQuoteId: string | null = null;
let _dragSourceStage: StageKey | null = null;

function getEffectiveStage(quote: Quote): StageKey {
  const status = (quote.status || 'pending') as StageKey;
  if (status === 'confirmed' && quote.event_date) {
    const eventDate = new Date(quote.event_date + 'T23:59:59');
    const daysUntil = differenceInDays(eventDate, new Date());
    if (daysUntil < 0) return 'completed';
    if (daysUntil <= 5) return 'upcoming';
  }
  if (!STAGE_MAP[status]) return 'pending';
  return status;
}

// KPI Bar
function KPIBar({ quotes }: { quotes: Quote[] }) {
  const active = quotes.filter(q => !['cancelled', 'completed'].includes(getEffectiveStage(q)));
  const confirmed = quotes.filter(q => ['confirmed', 'upcoming'].includes(getEffectiveStage(q)));
  const completed = quotes.filter(q => getEffectiveStage(q) === 'completed');
  const total = quotes.length;
  const conversionRate = total > 0 ? Math.round(((confirmed.length + completed.length) / total) * 100) : 0;
  const confirmedRevenue = confirmed.reduce((s, q) => s + (q.total_estimate || 0), 0);
  const completedRevenue = completed.reduce((s, q) => s + (q.total_estimate || 0), 0);
  const depositsCollected = quotes.filter(q => q.deposit_paid).reduce((s, q) => s + (q.deposit_amount || 0), 0);

  const kpis = [
    { label: 'Activas', value: String(active.length), icon: TrendingUp },
    { label: 'Confirmados', value: `$${confirmedRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Realizados', value: `$${completedRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Conversión', value: `${conversionRate}%`, icon: TrendingUp },
    { label: 'Anticipos', value: `$${depositsCollected.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {kpis.map(kpi => (
        <Card key={kpi.label} className="shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold font-display">{kpi.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Quote Card
function PaymentProgressMini({ quoteId, totalEstimate, refreshKey }: { quoteId: string; totalEstimate: number; refreshKey?: number }) {
  const { totalPaid } = useQuotePayments(quoteId, refreshKey);
  if (totalEstimate <= 0) return null;
  const pct = Math.min(100, Math.round((totalPaid / totalEstimate) * 100));
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
        <span>{pct}% pagado</span>
        <span>${totalPaid.toLocaleString()}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function QuoteCard({ quote, onClick, stage, paymentVersion }: { quote: Quote; onClick: () => void; stage: StageKey; paymentVersion: number }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        _dragQuoteId = quote.id;
        _dragSourceStage = stage;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', quote.id);
      }}
      onDragEnd={() => {
        _dragQuoteId = null;
        _dragSourceStage = null;
        window.dispatchEvent(new CustomEvent('kanban-drag-end'));
      }}
      onClick={onClick}
      className="bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-hover transition-smooth group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{quote.customer_name}</p>
          {quote.child_name && (
            <p className="text-xs text-muted-foreground truncate">🎂 {quote.child_name}</p>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {quote.event_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(quote.event_date), 'dd MMM yyyy', { locale: es })}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">${(quote.total_estimate || 0).toLocaleString()}</span>
          <Badge variant="outline" className="text-[9px]">
            {quote.source === 'onboarding' ? 'Wizard' : 'Servicios'}
          </Badge>
        </div>
        {!['pending', 'contacted'].includes(stage) && (
          <PaymentProgressMini quoteId={quote.id} totalEstimate={quote.total_estimate || 0} refreshKey={paymentVersion} />
        )}
        <div className="flex items-center justify-end">
          <span className="text-[10px]">
            <Clock className="h-2.5 w-2.5 inline mr-0.5" />
            {formatDistanceToNow(new Date(quote.updated_at), { locale: es, addSuffix: false })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Column
function KanbanColumn({ stage, quotes, onCardClick, onDrop, dragOverStage, onDragOver, onDragLeave, paymentVersion }: {
  stage: Stage;
  quotes: Quote[];
  onCardClick: (q: Quote) => void;
  onDrop: (stageKey: StageKey) => void;
  dragOverStage: StageKey | null;
  onDragOver: (stageKey: StageKey) => void;
  onDragLeave: () => void;
  paymentVersion: number;
}) {
  const isDragging = _dragSourceStage !== null;
  const isValidTarget = _dragSourceStage ? STAGE_MAP[_dragSourceStage]?.allowedTransitions.includes(stage.key) : false;
  const isOver = dragOverStage === stage.key;
  const columnTotal = quotes.reduce((s, q) => s + (q.total_estimate || 0), 0);

  return (
    <div
      className={`flex flex-col min-w-[260px] w-[260px] shrink-0 rounded-xl border-2 transition-all duration-200 ${
        isOver && isValidTarget ? `${stage.borderColor} ${stage.bgColor} scale-[1.01]`
        : isDragging && !isValidTarget ? 'border-border/30 opacity-40'
        : `border-border/60 ${stage.bgColor}`
      }`}
      onDragOver={(e) => {
        if (_dragSourceStage && STAGE_MAP[_dragSourceStage]?.allowedTransitions.includes(stage.key)) {
          e.preventDefault();
          onDragOver(stage.key);
        }
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(stage.key);
      }}
    >
      <div className="p-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-sm">{stage.label}</h3>
          <Badge variant="secondary" className="text-[10px] h-5">{quotes.length}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">${columnTotal.toLocaleString()}</p>
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
        {quotes.map(q => (
          <QuoteCard key={q.id} quote={q} stage={stage.key} onClick={() => onCardClick(q)} paymentVersion={paymentVersion} />
        ))}
        {quotes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Sin cotizaciones</p>
        )}
      </div>
    </div>
  );
}

// Detail Dialog
function QuoteDetailDialog({ quote, open, onClose, onStatusChange, onPaymentChange }: {
  quote: Quote | null; open: boolean; onClose: () => void;
  onStatusChange: (id: string, s: StageKey) => void;
  onPaymentChange?: () => void;
}) {
  const [services, setServices] = useState<QuoteService[]>([]);
  const { payments, totalPaid, addPayment, deletePayment } = useQuotePayments(quote?.id);
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState('transferencia');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!quote) return;
    supabase.from('quote_services').select('id, service_name, service_price, quantity').eq('quote_id', quote.id).then(({ data }) => setServices(data || []));
  }, [quote]);

  if (!quote) return null;

  const effectiveStage = getEffectiveStage(quote);
  const stageInfo = STAGE_MAP[effectiveStage];
  const allowedNext = stageInfo.allowedTransitions;
  const totalEstimate = quote.total_estimate || 0;
  const pendingBalance = totalEstimate - totalPaid;
  const paymentPct = totalEstimate > 0 ? Math.min(100, Math.round((totalPaid / totalEstimate) * 100)) : 0;

  const PAYMENT_METHODS = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'otro', label: 'Otro' },
  ];

  const handleAddPayment = async () => {
    const amount = Number(newAmount);
    if (!amount || amount <= 0) return;
    setAdding(true);
    const ok = await addPayment({ amount, payment_method: newMethod, notes: newNotes || undefined });
    if (ok) { setNewAmount(''); setNewNotes(''); onPaymentChange?.(); }
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Detalle de Cotización</DialogTitle>
          <DialogDescription asChild>
            <div>
              <Badge variant="outline" className={`${stageInfo.bgColor} ${stageInfo.borderColor}`}>{stageInfo.label}</Badge>
              <span className="ml-2 text-xs">{format(new Date(quote.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Cliente</Label><p className="font-medium text-sm">{quote.customer_name}</p></div>
            <div><Label className="text-xs text-muted-foreground">Festejado</Label><p className="font-medium text-sm">{quote.child_name || '-'}</p></div>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${quote.email}`} className="text-secondary hover:underline">{quote.email}</a></div>
            {quote.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${quote.phone}`} className="hover:underline">{quote.phone}</a></div>}
            {quote.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{quote.location}</span></div>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-accent/50 text-center">
              <p className="text-[10px] text-muted-foreground">Fecha</p>
              <p className="font-medium text-sm">{quote.event_date ? format(new Date(quote.event_date), 'dd MMM', { locale: es }) : '-'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-accent/50 text-center">
              <p className="text-[10px] text-muted-foreground">Niños</p>
              <p className="font-medium text-sm">{quote.children_count || '-'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-accent/50 text-center">
              <p className="text-[10px] text-muted-foreground">Edades</p>
              <p className="font-medium text-sm">{quote.age_range || '-'}</p>
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Servicios</Label>
              <div className="mt-1 space-y-1">
                {services.map(s => (
                  <div key={s.id} className="flex justify-between text-sm bg-accent/30 rounded-md px-3 py-1.5">
                    <span>{s.service_name} {s.quantity > 1 ? `×${s.quantity}` : ''}</span>
                    <span className="font-medium">${(s.service_price * s.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold px-3 pt-1">
                  <span>Total estimado</span>
                  <span>${totalEstimate.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {quote.preferences && quote.preferences.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Preferencias</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {quote.preferences.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
              </div>
            </div>
          )}

          {/* Payment section - visible from Contactado onwards */}
          {effectiveStage !== 'pending' && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-bold font-display">Pagos</Label>
                  <Badge variant="outline" className={`text-xs ${paymentPct >= 100 ? 'border-japitown-green-tag/40 text-japitown-green-tag' : ''}`}>
                    {paymentPct}%
                  </Badge>
                </div>

                {/* Progress bar */}
                <Progress value={paymentPct} className="h-2.5 mb-3" />

                <div className="flex justify-between items-center bg-accent/50 rounded-lg p-3 mb-3">
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground">Pagado</p>
                    <p className="font-bold text-sm text-japitown-green-tag">${totalPaid.toLocaleString()}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8 mx-2" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground">Pendiente</p>
                    <p className={`font-bold text-sm ${pendingBalance > 0 ? 'text-japitown-orange' : 'text-japitown-green-tag'}`}>
                      ${Math.max(0, pendingBalance).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Payment list */}
                {payments.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-accent/30 rounded-md px-3 py-2 group/pay">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${p.amount.toLocaleString()}</span>
                            <Badge variant="outline" className="text-[9px] capitalize">{p.payment_method}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{format(new Date(p.created_at), 'dd MMM yyyy', { locale: es })}</span>
                            {p.notes && <span className="truncate">· {p.notes}</span>}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover/pay:opacity-100 text-destructive"
                          onClick={async () => { const ok = await deletePayment(p.id); if (ok) onPaymentChange?.(); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add payment form */}
                <div className="space-y-2 border rounded-lg p-3 bg-background">
                  <Label className="text-xs text-muted-foreground">Registrar pago</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Monto"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="h-8 flex-1"
                      min={1}
                    />
                    <Select value={newMethod} onValueChange={setNewMethod}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Notas (opcional)"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="h-8"
                  />
                  <Button size="sm" className="w-full gap-1" onClick={handleAddPayment} disabled={adding || !newAmount}>
                    <Plus className="h-3 w-3" /> Registrar pago
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {allowedNext.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Avanzar etapa</Label>
              <div className="flex gap-2 flex-wrap">
                {allowedNext.map(nextKey => (
                  <Button
                    key={nextKey}
                    size="sm"
                    variant={nextKey === 'cancelled' ? 'destructive' : 'default'}
                    className="text-xs gap-1"
                    onClick={() => onStatusChange(quote.id, nextKey)}
                  >
                    {nextKey === 'cancelled' ? <XCircle className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {STAGE_MAP[nextKey].label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
const AdminKanban = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageKey | null>(null);
  const [paymentVersion, setPaymentVersion] = useState(0);

  const fetchQuotes = useCallback(async () => {
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching quotes:', error);
    else setQuotes((data || []) as Quote[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  // Reset drag state when drag ends (even on invalid targets)
  useEffect(() => {
    const handler = () => setDragOverStage(null);
    window.addEventListener('kanban-drag-end', handler);
    return () => window.removeEventListener('kanban-drag-end', handler);
  }, []);

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage.key] = quotes.filter(q => getEffectiveStage(q) === stage.key);
    return acc;
  }, {} as Record<StageKey, Quote[]>);

  const updateStatus = async (quoteId: string, newStatus: StageKey) => {
    const { error } = await supabase.from('quotes').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', quoteId);
    if (error) { toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' }); return; }
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus, updated_at: new Date().toISOString() } : q));
    if (selectedQuote?.id === quoteId) setSelectedQuote(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
    toast({ title: 'Etapa actualizada', description: `Movido a "${STAGE_MAP[newStatus].label}"` });
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Cargando pipeline...</div>;

  return (
    <div className="space-y-4">
      <KPIBar quotes={quotes} />
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.key}
            stage={stage}
            quotes={grouped[stage.key]}
            onCardClick={(q) => setSelectedQuote(q)}
            paymentVersion={paymentVersion}
            onDrop={(targetStage) => {
              if (_dragQuoteId && _dragSourceStage && STAGE_MAP[_dragSourceStage]?.allowedTransitions.includes(targetStage)) {
                updateStatus(_dragQuoteId, targetStage);
              }
              _dragQuoteId = null;
              _dragSourceStage = null;
              setDragOverStage(null);
            }}
            dragOverStage={dragOverStage}
            onDragOver={(key) => setDragOverStage(key)}
            onDragLeave={() => setDragOverStage(null)}
          />
        ))}
      </div>
      <QuoteDetailDialog
        quote={selectedQuote}
        open={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onStatusChange={updateStatus}
        onPaymentChange={() => setPaymentVersion(v => v + 1)}
      />
    </div>
  );
};

export default AdminKanban;
