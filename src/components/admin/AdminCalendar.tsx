import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, DollarSign, Mail, Phone, PartyPopper, Briefcase, GraduationCap, CalendarDays, Users, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface CalendarItem {
  id: string;
  title: string;
  date: string;
  time: string | null;
  endTime: string | null;
  location: string | null;
  type: string;
  status: string;
  amount: number | null;
  source: 'calendar' | 'quote';
  email: string | null;
  phone: string | null;
  notes: string | null;
  childName?: string | null;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; dot: string; text: string; label: string }> = {
  confirmed: { bg: 'bg-japitown-green-tag/10', border: 'border-l-japitown-green-tag', dot: 'bg-japitown-green-tag', text: 'text-japitown-green-tag', label: 'Confirmado' },
  tentative: { bg: 'bg-japitown-yellow/10', border: 'border-l-japitown-yellow', dot: 'bg-japitown-yellow', text: 'text-japitown-yellow', label: 'Tentativo' },
  cancelled: { bg: 'bg-destructive/10', border: 'border-l-destructive', dot: 'bg-destructive', text: 'text-destructive', label: 'Cancelado' },
  pending: { bg: 'bg-japitown-yellow/10', border: 'border-l-japitown-yellow', dot: 'bg-japitown-yellow', text: 'text-japitown-yellow', label: 'Pendiente' },
  contacted: { bg: 'bg-japitown-blue/10', border: 'border-l-japitown-blue', dot: 'bg-japitown-blue', text: 'text-japitown-blue', label: 'Contactado' },
  upcoming: { bg: 'bg-secondary/10', border: 'border-l-secondary', dot: 'bg-secondary', text: 'text-secondary', label: 'Próximo' },
  completed: { bg: 'bg-japitown-green/10', border: 'border-l-japitown-green', dot: 'bg-japitown-green', text: 'text-japitown-green', label: 'Realizado' },
};

const TYPE_CONFIG: Record<string, { icon: typeof PartyPopper; label: string }> = {
  fiesta: { icon: PartyPopper, label: 'Fiesta' },
  evento_corporativo: { icon: Briefcase, label: 'Corporativo' },
  escolar: { icon: GraduationCap, label: 'Escolar' },
  otro: { icon: CalendarDays, label: 'Otro' },
};

const AdminCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    event_date: '', event_time: '', end_time: '', location: '',
    event_type: 'fiesta', status: 'confirmed', total_amount: '', notes: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const [calRes, quoteRes] = await Promise.all([
      supabase.from('calendar_events').select('*').gte('event_date', start).lte('event_date', end).order('event_date', { ascending: true }),
      supabase.from('quotes').select('*').not('event_date', 'is', null).gte('event_date', start).lte('event_date', end).neq('status', 'cancelled').order('event_date', { ascending: true }),
    ]);

    const calItems: CalendarItem[] = (calRes.data || []).map((e: any) => ({
      id: e.id, title: e.customer_name, date: e.event_date, time: e.event_time, endTime: e.end_time,
      location: e.location, type: e.event_type, status: e.status, amount: e.total_amount,
      source: 'calendar' as const, email: e.customer_email, phone: e.customer_phone, notes: e.notes,
    }));

    const quoteItems: CalendarItem[] = (quoteRes.data || []).map((q: any) => ({
      id: q.id, title: q.customer_name, date: q.event_date, time: null, endTime: null,
      location: q.location, type: 'fiesta', status: q.status || 'pending', amount: q.total_estimate,
      source: 'quote' as const, email: q.email, phone: q.phone, notes: q.notes, childName: q.child_name,
    }));

    const calQuoteIds = new Set((calRes.data || []).filter((e: any) => e.quote_id).map((e: any) => e.quote_id));
    const uniqueQuoteItems = quoteItems.filter(q => !calQuoteIds.has(q.id));

    setItems([...calItems, ...uniqueQuoteItems]);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase.from('calendar_events').insert({
        customer_name: formData.customer_name, customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null, event_date: formData.event_date,
        event_time: formData.event_time || null, end_time: formData.end_time || null,
        location: formData.location || null, event_type: formData.event_type, status: formData.status,
        total_amount: formData.total_amount ? parseInt(formData.total_amount) : null, notes: formData.notes || null,
      });
      if (error) throw error;
      toast({ title: 'Evento creado', description: 'El evento se agregó al calendario' });
      setShowForm(false);
      setFormData({ customer_name: '', customer_email: '', customer_phone: '', event_date: '', event_time: '', end_time: '', location: '', event_type: 'fiesta', status: 'confirmed', total_amount: '', notes: '' });
      fetchAll();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({ title: 'Error', description: 'No se pudo crear el evento', variant: 'destructive' });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const paddedDays: (Date | null)[] = [...Array(startDow).fill(null), ...days];

  const getItemsForDay = (day: Date) => items.filter(e => isSameDay(new Date(e.date + 'T12:00:00'), day));
  const dayItems = selectedDay ? getItemsForDay(selectedDay) : [];

  // Monthly summary
  const totalEvents = items.length;
  const confirmedCount = items.filter(i => i.status === 'confirmed').length;
  const totalRevenue = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold">Calendario</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Eventos y cotizaciones programadas</p>
        </div>
        <Button size="sm" onClick={() => {
          setFormData(prev => ({ ...prev, event_date: format(new Date(), 'yyyy-MM-dd') }));
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Evento
        </Button>
      </div>

      {/* Monthly summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Eventos del mes', value: String(totalEvents), icon: CalendarDays },
          { label: 'Confirmados', value: String(confirmedCount), icon: Users },
          { label: 'Ingresos estimados', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
        ].map(kpi => (
          <Card key={kpi.label} className="shadow-soft">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</p>
                <p className="text-base font-bold font-display">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar + Day detail side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Calendar grid */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-display capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-px bg-border/40 rounded-lg overflow-hidden">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} className="h-24 bg-card/50" />;
                const dayEvts = getItemsForDay(day);
                const today = isToday(day);
                const selected = selectedDay && isSameDay(day, selectedDay);
                const past = isPast(day) && !today;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`h-24 p-1.5 text-left transition-all flex flex-col bg-card relative group
                      ${today ? 'bg-secondary/5' : ''}
                      ${selected ? 'ring-2 ring-secondary ring-inset z-10' : ''}
                      ${past ? 'opacity-60' : ''}
                      hover:bg-accent/40
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs leading-none ${
                        today
                          ? 'bg-secondary text-secondary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold'
                          : 'font-medium text-foreground'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvts.length > 0 && (
                        <span className="text-[9px] text-muted-foreground font-medium bg-muted rounded-full w-4 h-4 flex items-center justify-center">
                          {dayEvts.length}
                        </span>
                      )}
                    </div>

                    {dayEvts.length > 0 && (
                      <div className="flex flex-col gap-[3px] overflow-hidden flex-1">
                        {dayEvts.slice(0, 3).map((e) => {
                          const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.confirmed;
                          return (
                            <div
                              key={e.id}
                              className={`rounded px-1.5 py-[1px] text-[9px] font-medium truncate leading-tight border-l-2 ${cfg.bg} ${cfg.border}`}
                            >
                              {e.time ? `${e.time.slice(0, 5)} ` : ''}{e.title}
                            </div>
                          );
                        })}
                        {dayEvts.length > 3 && (
                          <span className="text-[8px] text-muted-foreground font-medium pl-1">+{dayEvts.length - 3} más</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/40">
              {Object.entries(STATUS_CONFIG).filter(([k]) => ['confirmed', 'pending', 'contacted', 'upcoming', 'completed'].includes(k)).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day detail panel */}
        <div className="space-y-3">
          {selectedDay ? (
            <>
              <Card className="shadow-soft">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-display capitalize">
                        {format(selectedDay, "EEEE", { locale: es })}
                      </CardTitle>
                      <p className="text-lg font-display font-bold">
                        {format(selectedDay, "dd 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      setFormData(prev => ({ ...prev, event_date: format(selectedDay, 'yyyy-MM-dd') }));
                      setShowForm(true);
                    }}>
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {dayItems.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="py-10 text-center">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sin eventos este día</p>
                    <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => {
                      setFormData(prev => ({ ...prev, event_date: format(selectedDay, 'yyyy-MM-dd') }));
                      setShowForm(true);
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Crear evento
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                dayItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.confirmed;
                  const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.otro;
                  const TypeIcon = typeInfo.icon;

                  return (
                    <Card
                      key={item.id}
                      className={`shadow-soft border-l-4 ${cfg.border} cursor-pointer hover:shadow-hover transition-shadow`}
                      onClick={() => setSelectedEvent(item)}
                    >
                      <CardContent className="p-4 space-y-2.5">
                        {/* Top row: name + badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-display font-bold text-sm truncate">{item.title}</p>
                            {item.childName && (
                              <p className="text-xs text-muted-foreground mt-0.5">🎂 Fiesta de {item.childName}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="outline" className={`text-[9px] ${cfg.bg} ${cfg.text} border-0`}>
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                          {item.time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-secondary" />
                              <span>{item.time.slice(0, 5)}{item.endTime ? ` – ${item.endTime.slice(0, 5)}` : ''}</span>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-japitown-orange" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <TypeIcon className="h-3.5 w-3.5 text-japitown-blue" />
                            <span>{typeInfo.label}</span>
                          </div>
                          {item.amount && item.amount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-japitown-green-tag" />
                              <span className="font-medium text-foreground">${item.amount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Source tag */}
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="secondary" className="text-[9px] gap-1">
                            {item.source === 'quote' ? <FileText className="h-2.5 w-2.5" /> : <CalendarDays className="h-2.5 w-2.5" />}
                            {item.source === 'quote' ? 'Cotización' : 'Manual'}
                          </Badge>
                          {item.notes && (
                            <p className="text-[10px] text-muted-foreground/60 truncate flex-1">{item.notes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </>
          ) : (
            <Card className="shadow-soft">
              <CardContent className="py-16 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Selecciona un día</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Haz clic en un día del calendario para ver sus eventos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        {selectedEvent && (() => {
          const cfg = STATUS_CONFIG[selectedEvent.status] || STATUS_CONFIG.confirmed;
          const typeInfo = TYPE_CONFIG[selectedEvent.type] || TYPE_CONFIG.otro;
          const TypeIcon = typeInfo.icon;
          return (
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                    <TypeIcon className={`h-4 w-4 ${cfg.text}`} />
                  </div>
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.text} border-0`}>
                      {cfg.label}
                    </Badge>
                    <span className="text-xs capitalize">
                      {format(new Date(selectedEvent.date + 'T12:00:00'), "EEEE dd 'de' MMMM yyyy", { locale: es })}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {selectedEvent.childName && (
                  <div className="bg-accent/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Festejado</p>
                    <p className="font-display font-bold text-sm">🎂 {selectedEvent.childName}</p>
                  </div>
                )}

                <div className="space-y-2.5">
                  {selectedEvent.time && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-secondary shrink-0" />
                      <span>{selectedEvent.time.slice(0, 5)}{selectedEvent.endTime ? ` – ${selectedEvent.endTime.slice(0, 5)}` : ''}</span>
                    </div>
                  )}
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-japitown-orange shrink-0" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  {selectedEvent.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${selectedEvent.email}`} className="text-secondary hover:underline truncate">{selectedEvent.email}</a>
                    </div>
                  )}
                  {selectedEvent.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`tel:${selectedEvent.phone}`} className="hover:underline">{selectedEvent.phone}</a>
                    </div>
                  )}
                </div>

                {(selectedEvent.amount && selectedEvent.amount > 0) && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between bg-accent/50 rounded-lg p-3">
                      <span className="text-xs text-muted-foreground">Monto total</span>
                      <span className="font-display font-bold text-base">${selectedEvent.amount.toLocaleString()}</span>
                    </div>
                  </>
                )}

                {selectedEvent.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">Notas</Label>
                      <p className="text-sm mt-1 text-foreground/80">{selectedEvent.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* Create event dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Nuevo Evento</DialogTitle>
            <DialogDescription>Agrega un evento al calendario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Nombre del cliente *</Label>
              <Input value={formData.customer_name} onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Email</Label>
                <Input type="email" value={formData.customer_email} onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Teléfono</Label>
                <Input value={formData.customer_phone} onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">Fecha *</Label>
                <Input type="date" value={formData.event_date} onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Hora inicio</Label>
                <Input type="time" value={formData.event_time} onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Hora fin</Label>
                <Input type="time" value={formData.end_time} onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Ubicación</Label>
              <Input value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData(prev => ({ ...prev, event_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiesta">Fiesta</SelectItem>
                    <SelectItem value="evento_corporativo">Corporativo</SelectItem>
                    <SelectItem value="escolar">Escolar</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Monto total</Label>
                <Input type="number" value={formData.total_amount} onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))} className="mt-1" placeholder="$0" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Notas</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="mt-1 resize-none" rows={2} placeholder="Notas adicionales..." />
            </div>
            <Button className="w-full" onClick={handleCreateEvent} disabled={!formData.customer_name || !formData.event_date}>
              Crear Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
