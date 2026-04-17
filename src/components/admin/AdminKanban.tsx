import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Calendar, Mail, Phone, MapPin, DollarSign, TrendingUp, Clock, GripVertical, ChevronRight, XCircle, Plus, Trash2, FileText, Download, Loader2, AlertTriangle, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useQuotePayments } from '@/hooks/useQuotePayments';
import { calcularPreciosCotizacion, aplicarDescuento, type ServiceForPricing } from '@/lib/pricing';

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
  pdf_url: string | null;
  logistics_fee_enabled?: boolean;
  logistics_fee?: number;
  discount_enabled?: boolean;
  discount_percentage?: number;
}

interface QuoteService {
  id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  quantity: number;
}

interface ServiceOption {
  id: string;
  title: string;
  price: string;
  base_price: number;
  is_active: boolean;
  category: string;
  hora_extra: number;
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

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  manual: { label: 'Manual', className: 'border-japitown-orange/40 text-japitown-orange' },
  'manual-whatsapp': { label: 'WhatsApp', className: 'border-japitown-green/40 text-japitown-green' },
  'manual-facebook': { label: 'Facebook', className: 'border-japitown-blue/40 text-japitown-blue' },
  'manual-instagram': { label: 'Instagram', className: 'border-japitown-pink/40 text-japitown-pink' },
  onboarding: { label: 'Wizard', className: '' },
  services: { label: 'Servicios', className: '' },
};

// Module-level drag state
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
function KPIBar({ quotes, paymentTotals }: { quotes: Quote[]; paymentTotals: Record<string, number> }) {
  const active = quotes.filter(q => !['cancelled', 'completed'].includes(getEffectiveStage(q)));
  const confirmed = quotes.filter(q => ['confirmed', 'upcoming'].includes(getEffectiveStage(q)));
  const completed = quotes.filter(q => getEffectiveStage(q) === 'completed');
  const nonCancelled = quotes.filter(q => getEffectiveStage(q) !== 'cancelled');
  const conversionRate = nonCancelled.length > 0 ? Math.round(((confirmed.length + completed.length) / nonCancelled.length) * 100) : 0;

  // Confirmados: total cobrado de eventos confirmados/próximos (aún no ocurridos)
  const confirmedPaid = confirmed.reduce((s, q) => s + (paymentTotals[q.id] || 0), 0);
  // Realizados: total cobrado de eventos ya realizados
  const completedPaid = completed.reduce((s, q) => s + (paymentTotals[q.id] || 0), 0);
  // Por Cobrar: pendiente de cobro de TODAS las etapas no canceladas
  const pendingCollection = nonCancelled.reduce((s, q) => {
    const estimate = q.total_estimate || 0;
    const paid = paymentTotals[q.id] || 0;
    return s + Math.max(0, estimate - paid);
  }, 0);

  const kpis = [
    { label: 'Activas', value: String(active.length), icon: TrendingUp },
    { label: 'Confirmados', value: `$${confirmedPaid.toLocaleString()}`, icon: DollarSign },
    { label: 'Realizados', value: `$${completedPaid.toLocaleString()}`, icon: DollarSign },
    { label: 'Conversión', value: `${conversionRate}%`, icon: TrendingUp },
    { label: 'Por Cobrar', value: `$${pendingCollection.toLocaleString()}`, icon: DollarSign },
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

function QuoteCard({ quote, onClick, stage, paymentVersion, dateConflictCount }: { quote: Quote; onClick: () => void; stage: StageKey; paymentVersion: number; dateConflictCount: number }) {
  const sourceInfo = SOURCE_LABELS[quote.source || ''] || { label: quote.source || 'Web', className: '' };

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
            {dateConflictCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-japitown-orange ml-1" title={`${dateConflictCount} evento(s) más en esta fecha`}>
                <AlertTriangle className="h-3 w-3" />
                <span className="text-[10px] font-medium">+{dateConflictCount}</span>
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">${(quote.total_estimate || 0).toLocaleString()}</span>
          <Badge variant="outline" className={`text-[9px] ${sourceInfo.className}`}>
            {sourceInfo.label}
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
function KanbanColumn({ stage, quotes, allQuotes, onCardClick, onDrop, dragOverStage, onDragOver, onDragLeave, paymentVersion }: {
  stage: Stage;
  quotes: Quote[];
  allQuotes: Quote[];
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

  const getDateConflictCount = (quote: Quote) => {
    if (!quote.event_date) return 0;
    return allQuotes.filter(q => q.id !== quote.id && q.event_date === quote.event_date && !['cancelled', 'completed'].includes(q.status || '')).length;
  };

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
          <QuoteCard key={q.id} quote={q} stage={stage.key} onClick={() => onCardClick(q)} paymentVersion={paymentVersion} dateConflictCount={getDateConflictCount(q)} />
        ))}
        {quotes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Sin cotizaciones</p>
        )}
      </div>
    </div>
  );
}

// PDF Section in Detail Dialog
function PdfSection({ quote, onPdfGenerated }: { quote: Quote; onPdfGenerated: (url: string) => void }) {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(quote.pdf_url);

  // Sync local state when quote.pdf_url changes (e.g. after regeneration from another flow)
  useEffect(() => {
    setPdfUrl(quote.pdf_url);
  }, [quote.pdf_url]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { quoteId: quote.id },
      });
      if (error) throw error;
      if (data?.pdf_url) {
        setPdfUrl(data.pdf_url);
        onPdfGenerated(data.pdf_url);
        toast({ title: 'PDF generado', description: 'La cotización está lista para descargar.' });
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold font-display">Documento</Label>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1 flex-1"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
          {generating ? 'Generando...' : pdfUrl ? 'Regenerar PDF' : 'Generar PDF'}
        </Button>
        {pdfUrl && (
          <Button
            size="sm"
            variant="warm"
            className="gap-1 flex-1"
            onClick={async () => {
              try {
                // Re-fetch latest pdf_url from DB to avoid stale URLs
                const { data: freshQuote } = await supabase
                  .from('quotes')
                  .select('pdf_url')
                  .eq('id', quote.id)
                  .single();
                const url = freshQuote?.pdf_url || pdfUrl;
                if (!url) {
                  toast({ title: 'Sin PDF', description: 'Genera el PDF primero.', variant: 'destructive' });
                  return;
                }
                if (url !== pdfUrl) setPdfUrl(url);

                const res = await fetch(url);
                if (!res.ok) throw new Error('fetch failed');
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `cotizacion-${(quote.customer_name || 'japitown').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(blobUrl);
              } catch (err) {
                console.error('PDF download error:', err);
                const fallbackUrl = pdfUrl;
                if (!fallbackUrl) {
                  toast({ title: 'Error', description: 'No se pudo descargar el PDF.', variant: 'destructive' });
                  return;
                }
                const a = document.createElement('a');
                a.href = fallbackUrl;
                a.download = `cotizacion-${(quote.customer_name || 'japitown').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }
            }}
          >
            <Download className="h-3 w-3" /> Descargar PDF
          </Button>
        )}
      </div>
    </div>
  );
}

// New Quote Dialog
function NewQuoteDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);
  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    phone: '',
    location: '',
    event_date: '',
    child_name: '',
    children_count: '',
    age_range: '',
    notes: '',
    source_channel: 'whatsapp' as 'whatsapp' | 'facebook' | 'instagram' | 'otro',
    total_hours: '3',
  });
  const [logisticsFeeEnabled, setLogisticsFeeEnabled] = useState(false);
  const [logisticsFee, setLogisticsFee] = useState('');
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [dateConflicts, setDateConflicts] = useState<{ customer_name: string; status: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from('services').select('id, title, price, base_price, is_active, category, hora_extra').eq('is_active', true).order('category').then(({ data }) => {
      setAvailableServices((data || []).map((s: any) => ({ ...s, hora_extra: s.hora_extra ?? 0 })) as ServiceOption[]);
    });
  }, [open]);

  // Check for date conflicts
  useEffect(() => {
    if (!form.event_date) { setDateConflicts([]); return; }
    supabase
      .from('quotes')
      .select('customer_name, status')
      .eq('event_date', form.event_date)
      .in('status', ['pending', 'contacted', 'confirmed'])
      .then(({ data }) => setDateConflicts(data || []));
  }, [form.event_date]);

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nNinos = form.children_count ? parseInt(form.children_count) : 15;
  const extraHours = Math.max(0, (parseInt(form.total_hours) || 3) - 3);
  const selectedSvcsForPricing = Array.from(selectedServices)
    .map(id => availableServices.find(s => s.id === id))
    .filter(Boolean) as ServiceForPricing[];
  const { perService: priceMap, total: servicesTotalEstimate } = calcularPreciosCotizacion(selectedSvcsForPricing, nNinos, extraHours);
  const logisticsFeeAmount = logisticsFeeEnabled && logisticsFee ? parseInt(logisticsFee) || 0 : 0;
  const discountPctNum = discountEnabled ? Math.max(0, Math.min(100, parseFloat(discountPercentage) || 0)) : 0;
  const { discountAmount, totalConDescuento: servicesAfterDiscount } = aplicarDescuento(servicesTotalEstimate, discountPctNum);
  const totalEstimate = servicesAfterDiscount + logisticsFeeAmount;

  // Group services by category
  const servicesByCategory = availableServices.reduce<Record<string, ServiceOption[]>>((acc, svc) => {
    const cat = svc.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const CATEGORY_STYLES: Record<string, { bg: string; border: string; selectedBg: string; label: string }> = {
    'Talleres Creativos': { bg: 'bg-japitown-green-tag/5', border: 'border-japitown-green-tag/30', selectedBg: 'bg-japitown-green-tag/20 border-japitown-green-tag/60', label: '🎨 Talleres Creativos' },
    'Estaciones de Juego': { bg: 'bg-japitown-blue/5', border: 'border-japitown-blue/30', selectedBg: 'bg-japitown-blue/20 border-japitown-blue/60', label: '🎮 Estaciones de Juego' },
  };

  const SOURCE_CHANNELS = [
    { value: 'whatsapp', label: '💬 WhatsApp' },
    { value: 'facebook', label: '📘 Facebook' },
    { value: 'instagram', label: '📸 Instagram' },
    { value: 'otro', label: '📋 Otro' },
  ];

  const getSourceValue = () => {
    if (form.source_channel === 'otro') return 'manual';
    return `manual-${form.source_channel}`;
  };

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.email.trim() || !form.children_count) {
      toast({ title: 'Campos requeridos', description: 'Nombre, email y número de niños son obligatorios.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_name: form.customer_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          event_date: form.event_date || null,
          child_name: form.child_name.trim() || null,
          children_count: form.children_count ? parseInt(form.children_count) : null,
          age_range: form.age_range.trim() || null,
          notes: form.notes.trim() || null,
          total_estimate: totalEstimate,
          logistics_fee_enabled: logisticsFeeEnabled,
          logistics_fee: logisticsFeeAmount,
          discount_enabled: discountEnabled,
          discount_percentage: discountPctNum,
          extra_hours: extraHours,
          source: getSourceValue(),
          quote_type: 'manual',
          status: 'pending',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert selected services
      const serviceIds = Array.from(selectedServices);
      if (serviceIds.length > 0 && quote) {
      const quoteServices = serviceIds.map(serviceId => {
          const svc = availableServices.find(s => s.id === serviceId);
          if (!svc) return null;
          return {
            quote_id: quote.id,
            service_id: serviceId,
            service_name: svc.title,
            service_price: priceMap.get(serviceId) ?? svc.base_price,
            quantity: 1,
          };
        }).filter(Boolean);
        const { error: svcError } = await supabase.from('quote_services').insert(quoteServices);
        if (svcError) console.error('Error inserting services:', svcError);
      }

      toast({ title: 'Cotización creada', description: `Se creó la cotización para ${form.customer_name}.` });
      setForm({ customer_name: '', email: '', phone: '', location: '', event_date: '', child_name: '', children_count: '', age_range: '', notes: '', source_channel: 'whatsapp', total_hours: '3' });
      setSelectedServices(new Set());
      setLogisticsFeeEnabled(false);
      setLogisticsFee('');
      onCreated();
      onClose();
    } catch (err) {
      console.error('Error creating quote:', err);
      toast({ title: 'Error', description: 'No se pudo crear la cotización.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Nueva Cotización Manual</DialogTitle>
          <DialogDescription>Crea una cotización para un lead externo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source channel */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Canal de origen</Label>
            <div className="flex gap-2 mt-2">
              {SOURCE_CHANNELS.map(ch => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, source_channel: ch.value as any }))}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg border-2 transition-all font-medium ${
                    form.source_channel === ch.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Client data */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos del cliente</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Nombre completo" className="h-9" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="55 1234 5678" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Ubicación</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ciudad o zona" className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Event data */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos del evento</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label className="text-xs">Fecha del evento</Label>
                <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Festejado(a)</Label>
                <Input value={form.child_name} onChange={e => setForm(f => ({ ...f, child_name: e.target.value }))} placeholder="Nombre (opcional)" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Número de niños *</Label>
                <Input type="number" min={1} value={form.children_count} onChange={e => setForm(f => ({ ...f, children_count: e.target.value }))} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Horas totales</Label>
                <Input type="number" min={3} value={form.total_hours} onChange={e => setForm(f => ({ ...f, total_hours: e.target.value }))} className="h-9" />
                {extraHours > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{extraHours} hora{extraHours > 1 ? 's' : ''} extra</p>}
              </div>
              <div>
                <Label className="text-xs">Rango de edad</Label>
                <Input value={form.age_range} onChange={e => setForm(f => ({ ...f, age_range: e.target.value }))} placeholder="4-8 años" className="h-9" />
              </div>
            </div>
            {dateConflicts.length > 0 && (
              <div className="col-span-2 mt-1 flex items-start gap-2 rounded-lg border-2 border-japitown-orange/40 bg-japitown-orange/10 p-2.5">
                <AlertTriangle className="h-4 w-4 text-japitown-orange shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">
                    ⚠️ {dateConflicts.length} {dateConflicts.length === 1 ? 'evento' : 'eventos'} en esta fecha
                  </p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {dateConflicts.map((c, i) => (
                      <li key={i}>• {c.customer_name} <span className="text-[10px]">({c.status})</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Services selector grouped by category */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Servicios</Label>
              {selectedServices.size > 0 && (
                <span className="text-xs text-muted-foreground">{selectedServices.size} seleccionados</span>
              )}
            </div>
            <div className="mt-2 space-y-3 max-h-56 overflow-y-auto border rounded-lg p-3">
              {Object.entries(servicesByCategory).map(([category, svcs]) => {
                const catStyle = CATEGORY_STYLES[category] || { bg: 'bg-accent/30', border: 'border-border/40', selectedBg: 'bg-accent border-primary/40', label: category };
                return (
                  <div key={category}>
                    <p className="text-xs font-bold text-muted-foreground mb-1.5">{catStyle.label}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {svcs.map(svc => {
                        const isSelected = selectedServices.has(svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => toggleService(svc.id)}
                            className={`text-left rounded-lg border-2 p-2 transition-all text-xs ${
                              isSelected ? catStyle.selectedBg + ' shadow-sm' : catStyle.bg + ' ' + catStyle.border + ' hover:shadow-sm'
                            }`}
                          >
                            <p className="font-medium truncate">{svc.title}</p>
<p className="text-muted-foreground mt-0.5">${(isSelected ? (priceMap.get(svc.id) ?? svc.base_price) : svc.base_price).toLocaleString()}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {availableServices.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Cargando servicios...</p>
              )}
            </div>
            {totalEstimate > 0 && (
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-sm font-medium">Total estimado:</span>
                <span className="text-sm font-bold">${totalEstimate.toLocaleString()} MXN</span>
              </div>
            )}
          </div>

          {/* Logistics fee toggle */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Gastos de operación / arrastre</Label>
              <Switch checked={logisticsFeeEnabled} onCheckedChange={setLogisticsFeeEnabled} />
            </div>
            {logisticsFeeEnabled && (
              <div>
                <Label className="text-xs text-muted-foreground">Monto</Label>
                <Input
                  type="number"
                  min={0}
                  value={logisticsFee}
                  onChange={e => setLogisticsFee(e.target.value)}
                  placeholder="Ej. 500"
                  className="h-9"
                />
              </div>
            )}
          </div>

          {/* Discount toggle */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Descuento</Label>
              <Switch checked={discountEnabled} onCheckedChange={setDiscountEnabled} />
            </div>
            {discountEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Porcentaje (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(e.target.value)}
                  placeholder="Ej. 10"
                  className="h-9"
                />
                {discountAmount > 0 && (
                  <p className="text-[11px] text-japitown-green-tag font-medium">
                    -${discountAmount.toLocaleString()} MXN sobre subtotal de servicios
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones adicionales..."
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Crear Cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Detail Dialog
function QuoteDetailDialog({ quote, open, onClose, onStatusChange, onPaymentChange, onQuoteUpdate }: {
  quote: Quote | null; open: boolean; onClose: () => void;
  onStatusChange: (id: string, s: StageKey) => void;
  onPaymentChange?: () => void;
  onQuoteUpdate?: (id: string, updates: Partial<Quote>) => void;
}) {
  const [services, setServices] = useState<QuoteService[]>([]);
  const { payments, totalPaid, addPayment, deletePayment } = useQuotePayments(quote?.id);
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState('transferencia');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [dateConflicts, setDateConflicts] = useState<{ customer_name: string; status: string }[]>([]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    child_name: '',
    email: '',
    phone: '',
    location: '',
    event_date: '',
    children_count: '',
    age_range: '',
    notes: '',
    total_hours: '3',
  });
  const [editSelectedServices, setEditSelectedServices] = useState<Set<string>>(new Set());
  const [editLogisticsFeeEnabled, setEditLogisticsFeeEnabled] = useState(false);
  const [editLogisticsFee, setEditLogisticsFee] = useState('');
  const [editDiscountEnabled, setEditDiscountEnabled] = useState(false);
  const [editDiscountPercentage, setEditDiscountPercentage] = useState('');

  useEffect(() => {
    if (!quote) return;
    supabase.from('quote_services').select('id, service_name, service_price, quantity, service_id').eq('quote_id', quote.id).then(({ data }) => setServices(data || []));
  }, [quote]);

  // Check date conflicts for this quote
  useEffect(() => {
    if (!quote?.event_date) { setDateConflicts([]); return; }
    supabase
      .from('quotes')
      .select('customer_name, status')
      .eq('event_date', quote.event_date)
      .neq('id', quote.id)
      .in('status', ['pending', 'contacted', 'confirmed'])
      .then(({ data }) => setDateConflicts(data || []));
  }, [quote?.id, quote?.event_date]);

  // Load available services when entering edit mode
  useEffect(() => {
    if (!isEditing) return;
    supabase.from('services').select('id, title, price, base_price, is_active, category, hora_extra').eq('is_active', true).order('category').then(({ data }) => {
      setAvailableServices((data || []).map((s: any) => ({ ...s, hora_extra: s.hora_extra ?? 0 })) as ServiceOption[]);
    });
  }, [isEditing]);

  const enterEditMode = () => {
    if (!quote) return;
    setEditForm({
      customer_name: quote.customer_name || '',
      child_name: quote.child_name || '',
      email: quote.email || '',
      phone: quote.phone || '',
      location: quote.location || '',
      event_date: quote.event_date || '',
      children_count: quote.children_count ? String(quote.children_count) : '',
      age_range: quote.age_range || '',
      notes: quote.notes || '',
      total_hours: String(3 + ((quote as any).extra_hours || 0)),
    });
    // Pre-select current services by service_id
    const currentIds = new Set(services.map((s: any) => s.service_id).filter(Boolean));
    setEditSelectedServices(currentIds);
    setEditLogisticsFeeEnabled(quote.logistics_fee_enabled || false);
    setEditLogisticsFee(quote.logistics_fee ? String(quote.logistics_fee) : '');
    setEditDiscountEnabled(quote.discount_enabled || false);
    setEditDiscountPercentage(quote.discount_percentage ? String(quote.discount_percentage) : '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const toggleEditService = (id: string) => {
    setEditSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const editNNinos = editForm.children_count ? parseInt(editForm.children_count) : 15;
  const editExtraHours = Math.max(0, (parseInt(editForm.total_hours) || 3) - 3);
  const editSvcsForPricing = Array.from(editSelectedServices)
    .map(id => availableServices.find(s => s.id === id))
    .filter(Boolean) as ServiceForPricing[];
  const { perService: editPriceMap, total: editServicesTotalEstimate } = calcularPreciosCotizacion(editSvcsForPricing, editNNinos, editExtraHours);
  const editLogisticsFeeAmount = editLogisticsFeeEnabled && editLogisticsFee ? parseInt(editLogisticsFee) || 0 : 0;
  const editDiscountPctNum = editDiscountEnabled ? Math.max(0, Math.min(100, parseFloat(editDiscountPercentage) || 0)) : 0;
  const { discountAmount: editDiscountAmount, totalConDescuento: editServicesAfterDiscount } = aplicarDescuento(editServicesTotalEstimate, editDiscountPctNum);
  const editTotalEstimate = editServicesAfterDiscount + editLogisticsFeeAmount;

  const editServicesByCategory = availableServices.reduce<Record<string, ServiceOption[]>>((acc, svc) => {
    const cat = svc.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const CATEGORY_STYLES: Record<string, { bg: string; border: string; selectedBg: string; label: string }> = {
    'Talleres Creativos': { bg: 'bg-japitown-green-tag/5', border: 'border-japitown-green-tag/30', selectedBg: 'bg-japitown-green-tag/20 border-japitown-green-tag/60', label: '🎨 Talleres Creativos' },
    'Estaciones de Juego': { bg: 'bg-japitown-blue/5', border: 'border-japitown-blue/30', selectedBg: 'bg-japitown-blue/20 border-japitown-blue/60', label: '🎮 Estaciones de Juego' },
  };

  const handleSaveEdit = async () => {
    if (!quote) return;
    if (!editForm.customer_name.trim() || !editForm.email.trim()) {
      toast({ title: 'Campos requeridos', description: 'Nombre y email son obligatorios.', variant: 'destructive' });
      return;
    }
    if (editForm.children_count && parseInt(editForm.children_count) < 1) {
      toast({ title: 'Campo inválido', description: 'El número de niños debe ser al menos 1.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        customer_name: editForm.customer_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        location: editForm.location.trim() || null,
        event_date: editForm.event_date || null,
        child_name: editForm.child_name.trim() || null,
        children_count: editForm.children_count ? parseInt(editForm.children_count) : null,
        age_range: editForm.age_range.trim() || null,
        notes: editForm.notes.trim() || null,
        total_estimate: editTotalEstimate,
        logistics_fee_enabled: editLogisticsFeeEnabled,
        logistics_fee: editLogisticsFeeAmount,
        discount_enabled: editDiscountEnabled,
        discount_percentage: editDiscountPctNum,
        extra_hours: editExtraHours,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase.from('quotes').update(updates).eq('id', quote.id);
      if (updateError) throw updateError;

      // Replace quote_services: delete existing, insert new
      const { error: deleteError } = await supabase.from('quote_services').delete().eq('quote_id', quote.id);
      if (deleteError) throw deleteError;

      const serviceIds = Array.from(editSelectedServices);
      if (serviceIds.length > 0) {
        const quoteServices = serviceIds.map(serviceId => {
          const svc = availableServices.find(s => s.id === serviceId);
          if (!svc) return null;
          return {
            quote_id: quote.id,
            service_id: serviceId,
            service_name: svc.title,
            service_price: editPriceMap.get(serviceId) ?? svc.base_price,
            quantity: 1,
          };
        }).filter(Boolean);
        const { error: insertError } = await supabase.from('quote_services').insert(quoteServices);
        if (insertError) throw insertError;
      }

      // Sync local state
      onQuoteUpdate?.(quote.id, updates);

      // Refresh services list
      const { data: freshServices } = await supabase.from('quote_services').select('id, service_name, service_price, quantity, service_id').eq('quote_id', quote.id);
      setServices(freshServices || []);

      setIsEditing(false);
      toast({ title: 'Cotización actualizada', description: 'Los cambios se guardaron. Regenerando PDF...' });

      // Auto-regenerate PDF with updated services
      try {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-quote', {
          body: { quoteId: quote.id },
        });
        if (pdfError) throw pdfError;
        if (pdfData?.pdf_url) {
          onQuoteUpdate?.(quote.id, { pdf_url: pdfData.pdf_url });
          toast({ title: 'PDF regenerado', description: 'El PDF se actualizó con los nuevos servicios.' });
        }
      } catch (pdfErr) {
        console.error('Error regenerating PDF:', pdfErr);
        toast({ title: 'Aviso', description: 'Los cambios se guardaron pero el PDF no se pudo regenerar. Usa el botón "Regenerar PDF".', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error saving edit:', err);
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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

  const sourceInfo = SOURCE_LABELS[quote.source || ''] || { label: quote.source || 'Web', className: '' };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setIsEditing(false); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="font-display">Detalle de Cotización</DialogTitle>
            {!isEditing && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={enterEditMode} title="Editar cotización">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DialogDescription asChild>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${stageInfo.bgColor} ${stageInfo.borderColor}`}>{stageInfo.label}</Badge>
              <Badge variant="outline" className={`text-[9px] ${sourceInfo.className}`}>{sourceInfo.label}</Badge>
              <span className="text-xs">{format(new Date(quote.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client & event info - read or edit mode */}
          {isEditing ? (
            <>
              {/* Editable client data */}
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos del cliente</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">Nombre *</Label>
                    <Input value={editForm.customer_name} onChange={e => setEditForm(f => ({ ...f, customer_name: e.target.value }))} className="h-9" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Ubicación</Label>
                    <Input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className="h-9" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Editable event data */}
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos del evento</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs">Fecha del evento</Label>
                    <Input type="date" value={editForm.event_date} onChange={e => setEditForm(f => ({ ...f, event_date: e.target.value }))} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Festejado(a)</Label>
                    <Input value={editForm.child_name} onChange={e => setEditForm(f => ({ ...f, child_name: e.target.value }))} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Número de niños</Label>
                    <Input type="number" min={1} value={editForm.children_count} onChange={e => setEditForm(f => ({ ...f, children_count: e.target.value }))} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Horas totales</Label>
                    <Input type="number" min={3} value={editForm.total_hours} onChange={e => setEditForm(f => ({ ...f, total_hours: e.target.value }))} className="h-9" />
                    {editExtraHours > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{editExtraHours} hora{editExtraHours > 1 ? 's' : ''} extra</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Rango de edad</Label>
                    <Input value={editForm.age_range} onChange={e => setEditForm(f => ({ ...f, age_range: e.target.value }))} className="h-9" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Editable services selector */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Servicios</Label>
                  {editSelectedServices.size > 0 && (
                    <span className="text-xs text-muted-foreground">{editSelectedServices.size} seleccionados</span>
                  )}
                </div>
                <div className="mt-2 space-y-3 max-h-56 overflow-y-auto border rounded-lg p-3">
                  {Object.entries(editServicesByCategory).map(([category, svcs]) => {
                    const catStyle = CATEGORY_STYLES[category] || { bg: 'bg-accent/30', border: 'border-border/40', selectedBg: 'bg-accent border-primary/40', label: category };
                    return (
                      <div key={category}>
                        <p className="text-xs font-bold text-muted-foreground mb-1.5">{catStyle.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {svcs.map(svc => {
                            const isSelected = editSelectedServices.has(svc.id);
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => toggleEditService(svc.id)}
                                className={`text-left rounded-lg border-2 p-2 transition-all text-xs ${
                                  isSelected ? catStyle.selectedBg + ' shadow-sm' : catStyle.bg + ' ' + catStyle.border + ' hover:shadow-sm'
                                }`}
                              >
                                <p className="font-medium truncate">{svc.title}</p>
                                <p className="text-muted-foreground mt-0.5">${(isSelected ? (editPriceMap.get(svc.id) ?? svc.base_price) : svc.base_price).toLocaleString()}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {availableServices.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Cargando servicios...</p>
                  )}
                </div>
                {editTotalEstimate > 0 && (
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-sm font-medium">Total estimado:</span>
                    <span className="text-sm font-bold">${editTotalEstimate.toLocaleString()} MXN</span>
                  </div>
                )}
              </div>

              {/* Logistics fee toggle - edit mode */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Gastos de operación / arrastre</Label>
                  <Switch checked={editLogisticsFeeEnabled} onCheckedChange={setEditLogisticsFeeEnabled} />
                </div>
                {editLogisticsFeeEnabled && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Monto</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editLogisticsFee}
                      onChange={e => setEditLogisticsFee(e.target.value)}
                      placeholder="Ej. 500"
                      className="h-9"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Editable notes */}
              <div>
                <Label className="text-xs">Notas</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones adicionales..."
                  className="min-h-[60px]"
                />
              </div>

              {/* Edit action buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSaveEdit} disabled={saving} className="gap-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Read-only mode (original view) */}
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

              {dateConflicts.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border-2 border-japitown-orange/40 bg-japitown-orange/10 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-japitown-orange shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-foreground">
                      {dateConflicts.length} {dateConflicts.length === 1 ? 'evento' : 'eventos'} más en esta fecha
                    </p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {dateConflicts.map((c, i) => (
                        <li key={i}>• {c.customer_name} <span className="text-[10px]">({c.status})</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

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
                    {quote.logistics_fee_enabled && (quote.logistics_fee ?? 0) > 0 && (
                      <div className="flex justify-between text-sm bg-japitown-orange/10 rounded-md px-3 py-1.5">
                        <span>Gastos de operación / arrastre</span>
                        <span className="font-medium">${(quote.logistics_fee ?? 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold px-3 pt-1">
                      <span>Total estimado</span>
                      <span>${totalEstimate.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {quote.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notas</Label>
                  <p className="text-sm mt-1 bg-accent/30 rounded-md px-3 py-2">{quote.notes}</p>
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

              {/* PDF Section */}
              <Separator />
              <PdfSection
                quote={quote}
                onPdfGenerated={(url) => onQuoteUpdate?.(quote.id, { pdf_url: url })}
              />

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
            </>
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
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [paymentTotals, setPaymentTotals] = useState<Record<string, number>>({});



  const fetchQuotes = useCallback(async () => {
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching quotes:', error);
    else setQuotes((data || []) as Quote[]);
    setLoading(false);
  }, []);

  const fetchPaymentTotals = useCallback(async () => {
    const { data, error } = await supabase.from('quote_payments').select('quote_id, amount');
    if (error) { console.error('Error fetching payment totals:', error); return; }
    const totals: Record<string, number> = {};
    (data || []).forEach((p: { quote_id: string; amount: number }) => {
      totals[p.quote_id] = (totals[p.quote_id] || 0) + p.amount;
    });
    setPaymentTotals(totals);
  }, []);

  useEffect(() => { fetchQuotes(); fetchPaymentTotals(); }, [fetchQuotes, fetchPaymentTotals]);

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

  const handleQuoteUpdate = (id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    if (selectedQuote?.id === id) setSelectedQuote(prev => prev ? { ...prev, ...updates } : null);
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Cargando pipeline...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <KPIBar quotes={quotes} paymentTotals={paymentTotals} />
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => setShowNewQuote(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Nueva Cotización
          </Button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.key}
            stage={stage}
            quotes={grouped[stage.key]}
            allQuotes={quotes}
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
        onPaymentChange={() => { setPaymentVersion(v => v + 1); fetchPaymentTotals(); }}
        onQuoteUpdate={handleQuoteUpdate}
      />
      <NewQuoteDialog
        open={showNewQuote}
        onClose={() => setShowNewQuote(false)}
        onCreated={fetchQuotes}
      />
    </div>
  );
};

export default AdminKanban;
