import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Eye, Phone, Mail, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

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
}

const statusColors: Record<string, string> = {
  pending: 'bg-japitown-yellow/20 text-foreground border-japitown-yellow/40',
  contacted: 'bg-japitown-blue/20 text-foreground border-japitown-blue/40',
  confirmed: 'bg-japitown-green-tag/20 text-foreground border-japitown-green-tag/40',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/40',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const statusOptions = ['pending', 'contacted', 'confirmed', 'cancelled'];

const AdminCRM = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;

      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast({ title: 'Estado actualizado', description: `Cotización marcada como "${statusLabels[newStatus]}"` });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const filtered = quotes.filter(q => {
    const matchesSearch = !searchTerm ||
      q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.child_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando cotizaciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o festejado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filtered.length} cotizaciones encontradas</p>

      {/* Quote list */}
      <div className="space-y-2">
        {filtered.map((quote) => (
          <Card
            key={quote.id}
            className="hover:shadow-soft transition-shadow cursor-pointer"
            onClick={() => setSelectedQuote(quote)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{quote.customer_name}</p>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[quote.status || 'pending']}`}>
                      {statusLabels[quote.status || 'pending']}
                    </Badge>
                    {quote.source && (
                      <Badge variant="outline" className="text-[10px]">
                        {quote.source === 'onboarding' ? 'Wizard' : 'Servicios'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {quote.child_name && <span>🎂 {quote.child_name}</span>}
                    {quote.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(quote.event_date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    )}
                    {quote.children_count && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {quote.children_count} niños
                      </span>
                    )}
                    <span>${(quote.total_estimate || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={quote.status || 'pending'}
                    onValueChange={(v) => {
                      updateQuoteStatus(quote.id, v);
                    }}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quote detail dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Detalle de Cotización</DialogTitle>
            <DialogDescription>Información completa de la solicitud</DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[selectedQuote.status || 'pending']}>
                  {statusLabels[selectedQuote.status || 'pending']}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selectedQuote.created_at), "dd MMMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Cliente</Label>
                  <p className="font-medium text-sm">{selectedQuote.customer_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Festejado</Label>
                  <p className="font-medium text-sm">{selectedQuote.child_name || '-'}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${selectedQuote.email}`} className="text-secondary hover:underline">{selectedQuote.email}</a>
                </div>
                {selectedQuote.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedQuote.phone}`} className="hover:underline">{selectedQuote.phone}</a>
                  </div>
                )}
                {selectedQuote.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedQuote.location}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-accent/50 text-center">
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium text-sm">
                    {selectedQuote.event_date
                      ? format(new Date(selectedQuote.event_date), 'dd MMM', { locale: es })
                      : '-'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-accent/50 text-center">
                  <p className="text-xs text-muted-foreground">Niños</p>
                  <p className="font-medium text-sm">{selectedQuote.children_count || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/50 text-center">
                  <p className="text-xs text-muted-foreground">Estimado</p>
                  <p className="font-medium text-sm">${(selectedQuote.total_estimate || 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedQuote.preferences && selectedQuote.preferences.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Preferencias</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedQuote.preferences.map(p => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status update */}
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">Cambiar estado</Label>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedQuote.status === s ? 'default' : 'outline'}
                      className="text-xs"
                      onClick={() => updateQuoteStatus(selectedQuote.id, s)}
                    >
                      {statusLabels[s]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCRM;
