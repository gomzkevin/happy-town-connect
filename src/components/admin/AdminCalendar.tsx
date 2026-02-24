import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, DollarSign, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

// Unified event type for calendar display
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

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  confirmed: { dot: 'bg-japitown-green-tag', label: 'Confirmado' },
  tentative: { dot: 'bg-japitown-yellow', label: 'Tentativo' },
  cancelled: { dot: 'bg-destructive', label: 'Cancelado' },
  pending: { dot: 'bg-japitown-yellow', label: 'Pendiente' },
  contacted: { dot: 'bg-japitown-blue', label: 'Contactado' },
  upcoming: { dot: 'bg-secondary', label: 'Próximo' },
  completed: { dot: 'bg-japitown-green', label: 'Realizado' },
};

const SOURCE_LABELS: Record<string, string> = {
  calendar: 'Manual',
  quote: 'Cotización',
};

const AdminCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_date: '',
    event_time: '',
    end_time: '',
    location: '',
    event_type: 'fiesta',
    status: 'confirmed',
    total_amount: '',
    notes: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const [calRes, quoteRes] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', start)
        .lte('event_date', end)
        .order('event_date', { ascending: true }),
      supabase
        .from('quotes')
        .select('*')
        .not('event_date', 'is', null)
        .gte('event_date', start)
        .lte('event_date', end)
        .neq('status', 'cancelled')
        .order('event_date', { ascending: true }),
    ]);

    const calItems: CalendarItem[] = (calRes.data || []).map((e: any) => ({
      id: e.id,
      title: e.customer_name,
      date: e.event_date,
      time: e.event_time,
      endTime: e.end_time,
      location: e.location,
      type: e.event_type,
      status: e.status,
      amount: e.total_amount,
      source: 'calendar' as const,
      email: e.customer_email,
      phone: e.customer_phone,
      notes: e.notes,
    }));

    const quoteItems: CalendarItem[] = (quoteRes.data || []).map((q: any) => ({
      id: q.id,
      title: q.customer_name,
      date: q.event_date,
      time: null,
      endTime: null,
      location: q.location,
      type: q.quote_type === 'onboarding' ? 'fiesta' : 'fiesta',
      status: q.status || 'pending',
      amount: q.total_estimate,
      source: 'quote' as const,
      email: q.email,
      phone: q.phone,
      notes: q.notes,
      childName: q.child_name,
    }));

    // Deduplicate: if a calendar_event has a quote_id, skip that quote
    const calQuoteIds = new Set((calRes.data || []).filter((e: any) => e.quote_id).map((e: any) => e.quote_id));
    const uniqueQuoteItems = quoteItems.filter(q => !calQuoteIds.has(q.id));

    setItems([...calItems, ...uniqueQuoteItems]);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase.from('calendar_events').insert({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        end_time: formData.end_time || null,
        location: formData.location || null,
        event_type: formData.event_type,
        status: formData.status,
        total_amount: formData.total_amount ? parseInt(formData.total_amount) : null,
        notes: formData.notes || null,
      });

      if (error) throw error;
      toast({ title: 'Evento creado', description: 'El evento se agregó al calendario' });
      setShowForm(false);
      setFormData({
        customer_name: '', customer_email: '', customer_phone: '',
        event_date: '', event_time: '', end_time: '', location: '',
        event_type: 'fiesta', status: 'confirmed', total_amount: '', notes: '',
      });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-bold">Calendario de Eventos</h3>
        <Button size="sm" onClick={() => {
          setFormData(prev => ({ ...prev, event_date: format(new Date(), 'yyyy-MM-dd') }));
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Evento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
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
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} className="h-20" />;
              const dayEvts = getItemsForDay(day);
              const today = isToday(day);
              const selected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`h-20 p-1.5 rounded-lg text-left transition-colors relative flex flex-col ${
                    today ? 'bg-secondary/10' : ''
                  } ${selected ? 'ring-2 ring-secondary' : ''} hover:bg-accent/50`}
                >
                  <span className={`text-xs font-medium ${today ? 'text-secondary font-bold' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvts.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-1 overflow-hidden flex-1">
                      {dayEvts.slice(0, 2).map((e) => (
                        <div key={e.id} className="flex items-center gap-1 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_STYLES[e.status]?.dot || 'bg-primary'}`} />
                          <span className="text-[9px] truncate text-muted-foreground leading-tight">
                            {e.title}
                          </span>
                        </div>
                      ))}
                      {dayEvts.length > 2 && (
                        <span className="text-[8px] text-muted-foreground pl-2.5">+{dayEvts.length - 2} más</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDay && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-display capitalize">
                {format(selectedDay, "EEEE dd 'de' MMMM", { locale: es })}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setFormData(prev => ({ ...prev, event_date: format(selectedDay, 'yyyy-MM-dd') }));
                setShowForm(true);
              }}>
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin eventos este día</p>
            ) : (
              <div className="space-y-2">
                {dayItems.map((item) => {
                  const style = STATUS_STYLES[item.status] || STATUS_STYLES.confirmed;
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border bg-card">
                      <div className={`w-1.5 h-full min-h-[40px] rounded-full shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          {item.childName && (
                            <span className="text-xs text-muted-foreground">🎂 {item.childName}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {item.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.time.slice(0, 5)}{item.endTime ? ` - ${item.endTime.slice(0, 5)}` : ''}
                            </span>
                          )}
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </span>
                          )}
                          {item.amount && item.amount > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${item.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-muted-foreground/70 truncate">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="text-[9px]">{style.label}</Badge>
                        <Badge variant="secondary" className="text-[9px]">{SOURCE_LABELS[item.source]}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <Input value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="mt-1" placeholder="Notas adicionales..." />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateEvent}
              disabled={!formData.customer_name || !formData.event_date}
            >
              Crear Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
