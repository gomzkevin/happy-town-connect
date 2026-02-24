import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string;
  status: string;
  total_amount: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean | null;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-japitown-green-tag',
  tentative: 'bg-japitown-yellow',
  cancelled: 'bg-destructive',
};

const AdminCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', start)
        .lte('event_date', end)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

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
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({ title: 'Error', description: 'No se pudo crear el evento', variant: 'destructive' });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad beginning of month
  const startDow = getDay(monthStart); // 0=Sunday
  const paddedDays: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...days,
  ];

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.event_date), day));
  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

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
              if (!day) return <div key={`pad-${i}`} className="h-16" />;
              const dayEvts = getEventsForDay(day);
              const today = isToday(day);
              const selected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`h-16 p-1 rounded-lg text-left transition-colors relative ${
                    today ? 'bg-secondary/10 font-bold' : ''
                  } ${selected ? 'ring-2 ring-secondary' : ''} hover:bg-accent/50`}
                >
                  <span className={`text-xs ${today ? 'text-secondary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvts.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap">
                      {dayEvts.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={`w-full h-1.5 rounded-full ${statusColors[e.status] || 'bg-primary'}`}
                        />
                      ))}
                      {dayEvts.length > 2 && (
                        <span className="text-[8px] text-muted-foreground">+{dayEvts.length - 2}</span>
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
              <CardTitle className="text-sm font-display">
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
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin eventos este día</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                    <div className={`w-2 h-10 rounded-full ${statusColors[event.status] || 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.event_time ? event.event_time.slice(0, 5) : 'Sin hora'}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{event.event_type}</Badge>
                  </div>
                ))}
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
