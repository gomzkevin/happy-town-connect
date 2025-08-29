import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, Upload, Image, Calendar, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useEvents } from '@/hooks/useEvents';
import { useServiceMutations } from '@/hooks/useServiceMutations';
import { useEventMutations } from '@/hooks/useEventMutations';
import { ServiceForm } from './ServiceForm';
import { EventForm } from './EventForm';
import { ConfirmDialog } from './ConfirmDialog';
import { CompanySettingsForm } from './CompanySettingsForm';
import { NotificationSettingsForm } from './NotificationSettingsForm';
import { QuoteHistoryView } from './QuoteHistoryView';

const AdminDashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { services, refetch: refetchServices } = useServices();
  const { events, refetch: refetchEvents } = useEvents();
  const { createService, updateService, deleteService, loading: serviceMutationLoading } = useServiceMutations();
  const { createEvent, updateEvent, deleteEvent, loading: eventMutationLoading } = useEventMutations();
  
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: '', title: '' });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateService = async (serviceData) => {
    try {
      await createService(serviceData);
      setShowServiceForm(false);
      refetchServices();
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleUpdateService = async (serviceData) => {
    try {
      await updateService(editingService.id, serviceData);
      setEditingService(null);
      setShowServiceForm(false);
      refetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent(eventData);
      setShowEventForm(false);
      refetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleUpdateEvent = async (eventData) => {
    try {
      await updateEvent(editingEvent.id, eventData);
      setEditingEvent(null);
      setShowEventForm(false);
      refetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.type === 'service') {
        await deleteService(deleteDialog.id);
        refetchServices();
      } else if (deleteDialog.type === 'event') {
        await deleteEvent(deleteDialog.id);
        refetchEvents();
      }
      setDeleteDialog({ open: false, type: '', id: '', title: '' });
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openDeleteDialog = (type, id, title) => {
    setDeleteDialog({ open: true, type, id, title });
  };

  const editService = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Acceso Denegado</CardTitle>
            <CardDescription className="text-center">
              No tienes permisos de administrador para acceder a esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show forms
  if (showServiceForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ServiceForm
          onSubmit={editingService ? handleUpdateService : handleCreateService}
          onCancel={() => {
            setShowServiceForm(false);
            setEditingService(null);
          }}
          initialData={editingService}
          loading={serviceMutationLoading}
        />
      </div>
    );
  }

  if (showEventForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <EventForm
          onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          initialData={editingEvent}
          loading={eventMutationLoading}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Panel de Administración</h1>
            <Badge variant="secondary">
              <Settings className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground">
                servicios disponibles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                eventos en portfolio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imágenes</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                gestión de medios
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Activo</div>
              <p className="text-xs text-muted-foreground">
                sistema operativo
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-4">
          <TabsList>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestión de Servicios</h3>
              <Button onClick={() => setShowServiceForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Servicio
              </Button>
            </div>
            <div className="grid gap-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{service.title}</h3>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{service.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Precio: {service.price}</span>
                          <span>Duración: {service.duration}</span>
                          <span>Participantes: {service.max_participants}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editService(service)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/servicio/${service.id}`)}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Imágenes
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openDeleteDialog('service', service.id, service.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestión de Eventos</h3>
              <Button onClick={() => setShowEventForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Evento
              </Button>
            </div>
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          {event.is_featured && <Badge>Destacado</Badge>}
                        </div>
                        <p className="text-muted-foreground text-sm">{event.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Fecha: {event.event_date}</span>
                          <span>Ubicación: {event.location}</span>
                          <span>Invitados: {event.guest_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editEvent(event)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/evento/${event.id}`)}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Imágenes
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openDeleteDialog('event', event.id, event.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <CompanySettingsForm />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettingsForm />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <QuoteHistoryView />
          </TabsContent>
        </Tabs>
        
        <ConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          title={`Eliminar ${deleteDialog.type === 'service' ? 'Servicio' : 'Evento'}`}
          description={`¿Estás seguro de que quieres eliminar "${deleteDialog.title}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDeleteConfirm}
          variant="destructive"
        />
      </main>
    </div>
  );
};

export default AdminDashboard;