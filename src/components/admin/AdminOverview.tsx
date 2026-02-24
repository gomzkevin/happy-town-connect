import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CalendarDays, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuoteStats {
  total: number;
  pending: number;
  contacted: number;
  confirmed: number;
  cancelled: number;
  totalRevenue: number;
  recentQuotes: any[];
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

const AdminOverview = () => {
  const [stats, setStats] = useState<QuoteStats>({
    total: 0, pending: 0, contacted: 0, confirmed: 0, cancelled: 0,
    totalRevenue: 0, recentQuotes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!quotes) return;

      const pending = quotes.filter(q => q.status === 'pending').length;
      const contacted = quotes.filter(q => q.status === 'contacted').length;
      const confirmed = quotes.filter(q => q.status === 'confirmed').length;
      const cancelled = quotes.filter(q => q.status === 'cancelled').length;
      const totalRevenue = quotes
        .filter(q => q.status === 'confirmed')
        .reduce((sum, q) => sum + (q.total_estimate || 0), 0);

      setStats({
        total: quotes.length,
        pending,
        contacted,
        confirmed,
        cancelled,
        totalRevenue,
        recentQuotes: quotes.slice(0, 8),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando métricas...</div>;
  }

  const kpis = [
    { label: 'Total Cotizaciones', value: stats.total, icon: FileText, color: 'text-foreground' },
    { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-japitown-orange' },
    { label: 'Confirmadas', value: stats.confirmed, icon: TrendingUp, color: 'text-japitown-green-tag' },
    { label: 'Ingresos Estimados', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-japitown-green-tag' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Pipeline de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {['pending', 'contacted', 'confirmed', 'cancelled'].map((status) => {
              const count = stats[status as keyof QuoteStats] as number;
              return (
                <div key={status} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-card">
                  <Badge variant="outline" className={statusColors[status]}>{statusLabels[status]}</Badge>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Cotizaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentQuotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:shadow-soft transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{quote.customer_name}</p>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[quote.status || 'pending']}`}>
                      {statusLabels[quote.status || 'pending']}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {quote.email} · {quote.child_name ? `Fiesta de ${quote.child_name}` : 'Sin nombre'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-medium">${(quote.total_estimate || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(quote.created_at), 'dd MMM', { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
