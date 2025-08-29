import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, Upload, Image, Calendar, Settings } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useEvents } from '@/hooks/useEvents';

const AdminDashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { services } = useServices();
  const { events } = useEvents();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
            <TabsTrigger value="services">Gestión de Servicios</TabsTrigger>
            <TabsTrigger value="events">Gestión de Eventos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Servicios</CardTitle>
                <CardDescription>
                  Gestiona los servicios y sus imágenes. Haz clic en un servicio para administrar sus imágenes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <Card key={service.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/servicio/${service.id}`)}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{service.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {service.description.substring(0, 100)}...
                        </p>
                        <Badge variant="outline">{service.category}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Eventos</CardTitle>
                <CardDescription>
                  Gestiona los eventos del portfolio y sus imágenes. Haz clic en un evento para administrar sus imágenes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <Card key={event.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/evento/${event.id}`)}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.description?.substring(0, 100)}...
                        </p>
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{event.location}</Badge>
                          {event.is_featured && (
                            <Badge variant="default">Destacado</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;