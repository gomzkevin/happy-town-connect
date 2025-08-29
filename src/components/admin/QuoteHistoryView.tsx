import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuoteHistory } from '@/hooks/useQuoteHistory';
import { Loader2, History, Mail, FileText, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'email_sent':
      return <Mail className="h-4 w-4" />;
    case 'pdf_generated':
      return <FileText className="h-4 w-4" />;
    case 'whatsapp_sent':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case 'email_sent':
      return 'Email enviado';
    case 'pdf_generated':
      return 'PDF generado';
    case 'whatsapp_sent':
      return 'WhatsApp enviado';
    default:
      return actionType;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const QuoteHistoryView: React.FC = () => {
  const { history, isLoading, error } = useQuoteHistory();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Error al cargar el historial de cotizaciones
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Cotizaciones
        </CardTitle>
        <CardDescription>
          Registro detallado de todos los emails, PDFs y notificaciones enviadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay historial disponible
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getActionIcon(entry.action_type)}
                  {getStatusIcon(entry.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {getActionLabel(entry.action_type)}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(entry.status)}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Para:</span>
                      <span className="truncate">{entry.recipient}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cotización:</span>
                      <span>{entry.quote_id}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Fecha:</span>
                      <span>
                        {format(new Date(entry.created_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    
                    {entry.error_message && (
                      <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <span className="font-medium">Error:</span> {entry.error_message}
                      </div>
                    )}
                    
                    {entry.metadata && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                          Ver detalles técnicos
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};