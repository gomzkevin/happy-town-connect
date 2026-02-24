import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useEventImages } from '@/hooks/useEventImages';
import { useImageMutations } from '@/hooks/useImageMutations';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from './admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, Calendar, MapPin, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
        window.location.reload();
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
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen debe ser menor a 5MB'); return; }
    try {
      setUploadingFeatured(true);
      await uploadFeaturedImage(file, id);
      toast.success('Imagen destacada actualizada');
      window.location.reload();
    } catch (error) {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingFeatured(false);
      if (featuredInputRef.current) featuredInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen debe ser menor a 5MB'); return; }
    try {
      setUploadingImage(true);
      await uploadImage(file);
      toast.success('Imagen subida');
    } catch (error) {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!id || eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-display">Cargando evento...</p>
      </div>
    );
  }

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold mb-4 text-foreground">Evento no encontrado</h2>
          <Link to="/">
            <Button variant="outline" className="rounded-full gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio
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

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(searchParams.get('from') === 'admin' ? '/admin' : '/')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {searchParams.get('from') === 'admin' ? 'Volver al panel' : 'Volver'}
        </Button>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-10">
          {/* Featured Image */}
          <div className="order-2 lg:order-1">
            {event.featured_image_url ? (
              <div className="relative group rounded-2xl overflow-hidden shadow-soft">
                <img
                  src={event.featured_image_url}
                  alt={event.title}
                  className="w-full h-80 lg:h-96 object-cover"
                />
                {isAdmin && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <input type="file" ref={featuredInputRef} onChange={handleFeaturedImageUpload} accept="image/*" className="hidden" />
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => featuredInputRef.current?.click()} disabled={uploadingFeatured}>
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-full" onClick={() => setDeleteDialog({ open: true, imageId: '', imageUrl: event.featured_image_url!, isFeatured: true })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : isAdmin ? (
              <div className="w-full h-80 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-accent/30">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-muted-foreground mb-4">No hay imagen destacada</p>
                  <input type="file" ref={featuredInputRef} onChange={handleFeaturedImageUpload} accept="image/*" className="hidden" />
                  <Button onClick={() => featuredInputRef.current?.click()} disabled={uploadingFeatured} variant="outline" className="rounded-full gap-2">
                    <Upload className="w-4 h-4" />
                    {uploadingFeatured ? 'Subiendo...' : 'Agregar imagen'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-80 rounded-2xl bg-accent/30 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="order-1 lg:order-2">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">{event.description}</p>
            )}

            <div className="space-y-3 mb-6">
              {event.event_date && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>{formatDate(event.event_date)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{event.location}</span>
                </div>
              )}
              {event.guest_count && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>{event.guest_count} invitados</span>
                </div>
              )}
            </div>

            {event.services && event.services.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Servicios incluidos</h3>
                <div className="flex flex-wrap gap-2">
                  {event.services.map((service, index) => (
                    <Badge key={index} variant="outline" className="rounded-full border-border text-foreground">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="rounded-2xl bg-card shadow-soft overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-border">
            <div>
              <h2 className="font-display font-bold text-foreground">Galería</h2>
              <p className="text-sm text-muted-foreground">Fotos del evento</p>
            </div>
            {isAdmin && (
              <>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} variant="outline" className="rounded-full gap-2">
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? 'Subiendo...' : 'Subir'}
                </Button>
              </>
            )}
          </div>

          <div className="p-5">
            {imagesLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando imágenes...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-4">No hay imágenes disponibles</p>
                {isAdmin && (
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} variant="outline" className="rounded-full gap-2">
                    <Upload className="w-4 h-4" /> Subir primera imagen
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((image) => (
                  <div key={image.id} className="group relative rounded-xl overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.caption || event.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isAdmin && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="destructive" className="rounded-full" onClick={() => setDeleteDialog({ open: true, imageId: image.id, imageUrl: image.image_url, isFeatured: false })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 text-background p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs">{image.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={deleteDialog.isFeatured ? "Eliminar Imagen Destacada" : "Eliminar Imagen"}
        description="¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteImage}
        variant="destructive"
      />
    </div>
  );
};

export default EventDetail;
