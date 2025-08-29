import { useParams, Link } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useEventImages } from '@/hooks/useEventImages';
import { useImageMutations } from '@/hooks/useImageMutations';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from './admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, Calendar, MapPin, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { events, loading: eventsLoading } = useEvents();
  const { images, loading: imagesLoading, uploadImage, refetch, uploadFeaturedImage, deleteFeaturedImage } = useEventImages(id || '');
  const { deleteEventImage } = useImageMutations();
  const { isAdmin } = useAuth();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, imageId: '', imageUrl: '', isFeatured: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteImage = async () => {
    try {
      if (deleteDialog.isFeatured) {
        await deleteFeaturedImage(id!, deleteDialog.imageUrl);
        window.location.reload(); // Refresh to show updated featured image
      } else {
        await deleteEventImage(deleteDialog.imageId, deleteDialog.imageUrl);
        refetch();
      }
      setDeleteDialog({ open: false, imageId: '', imageUrl: '', isFeatured: false });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      setUploadingFeatured(true);
      await uploadFeaturedImage(file, id);
      toast.success('Imagen destacada actualizada exitosamente');
      window.location.reload(); // Refresh to show new featured image
    } catch (error) {
      toast.error('Error al subir la imagen destacada');
      console.error('Upload error:', error);
    } finally {
      setUploadingFeatured(false);
      if (featuredInputRef.current) {
        featuredInputRef.current.value = '';
      }
    }
  };

  if (!id || eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando evento...</h2>
        </div>
      </div>
    );
  }

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Evento no encontrado</h2>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha por confirmar';
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  const getServiceColor = (service: string) => {
    const colors = {
      'Decoración': 'bg-purple-100 text-purple-800 border-purple-200',
      'Animación': 'bg-green-100 text-green-800 border-green-200',
      'Catering': 'bg-orange-100 text-orange-800 border-orange-200',
      'Música': 'bg-blue-100 text-blue-800 border-blue-200',
      'Fotografía': 'bg-pink-100 text-pink-800 border-pink-200',
      'Mesa de dulces': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[service as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      await uploadImage(file);
      toast.success('Imagen subida exitosamente');
    } catch (error) {
      toast.error('Error al subir la imagen');
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al portfolio
              </Button>
            </Link>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">{event.title}</h1>
              {event.description && (
                <p className="text-xl text-muted-foreground mb-6">{event.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 mb-6">
                {event.event_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.guest_count && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span>{event.guest_count} invitados</span>
                  </div>
                )}
              </div>

              {event.services && event.services.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Servicios incluidos:</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.services.map((service, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className={getServiceColor(service)}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Featured Image */}
            <div className="lg:order-first">
              {event.featured_image_url ? (
                <div className="relative group">
                  <img
                    src={event.featured_image_url}
                    alt={event.title}
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                  />
                  {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <input
                        type="file"
                        ref={featuredInputRef}
                        onChange={handleFeaturedImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => featuredInputRef.current?.click()}
                        disabled={uploadingFeatured}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          imageId: '', 
                          imageUrl: event.featured_image_url!, 
                          isFeatured: true 
                        })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : isAdmin ? (
                <div className="w-full h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No hay imagen destacada</p>
                    <input
                      type="file"
                      ref={featuredInputRef}
                      onChange={handleFeaturedImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      onClick={() => featuredInputRef.current?.click()}
                      disabled={uploadingFeatured}
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFeatured ? 'Subiendo...' : 'Agregar imagen destacada'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Galería de Imágenes</CardTitle>
                <CardDescription>
                  Todas las fotos de este evento
                </CardDescription>
              </div>
              {isAdmin && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {imagesLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando imágenes...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No hay imágenes disponibles para este evento</p>
                {isAdmin && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir primera imagen
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="group relative">
                    <img
                      src={image.image_url}
                      alt={image.caption || event.title}
                      className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    />
                    {isAdmin && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({ 
                            open: true, 
                            imageId: image.id, 
                            imageUrl: image.image_url, 
                            isFeatured: false 
                          })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm">{image.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={deleteDialog.isFeatured ? "Eliminar Imagen Destacada" : "Eliminar Imagen"}
        description={deleteDialog.isFeatured 
          ? "¿Estás seguro de que quieres eliminar la imagen destacada? Esta acción no se puede deshacer." 
          : "¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer."}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteImage}
        variant="destructive"
      />
    </div>
  );
};

export default EventDetail;