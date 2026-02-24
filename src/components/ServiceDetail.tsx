import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Check, Clock, Users, MapPin, Calendar, Upload, Trash2 } from "lucide-react";
import { useServices as useServicesContext } from "@/contexts/ServicesContext";
import { useServices } from "@/hooks/useServices";
import { useServiceImages } from "@/hooks/useServiceImages";
import { useImageMutations } from "@/hooks/useImageMutations";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ConfirmDialog } from "./admin/ConfirmDialog";
import { useState, useRef } from "react";

import icono01 from "@/assets/Iconos-01.png";
import icono02 from "@/assets/Iconos-02.png";
import icono03 from "@/assets/Iconos-03.png";
import icono04 from "@/assets/Iconos-04.png";
import icono05 from "@/assets/Iconos-05.png";
import icono06 from "@/assets/Iconos-06.png";
import icono07 from "@/assets/Iconos-07.png";
import icono08 from "@/assets/Iconos-08.png";
import icono09 from "@/assets/Iconos-09.png";
import icono10 from "@/assets/Iconos-10.png";
import icono11 from "@/assets/Iconos-11.png";
import icono12 from "@/assets/Iconos-12.png";

const serviceIconMap: Record<string, string> = {
  pesca: icono01,
  caballetes: icono02,
  hamburgueseria: icono03,
  boliche: icono04,
  supermercado: icono05,
  spa: icono06,
  veterinaria: icono07,
  "decora-cupcake": icono08,
  "haz-pulsera": icono09,
  yesitos: icono10,
  construccion: icono11,
  guarderia: icono12,
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addService, selectedServices } = useServicesContext();
  const { services } = useServices();
  const { images, loading: imagesLoading, uploadImage, refetch } = useServiceImages(id);
  const { deleteServiceImage } = useImageMutations();
  const { isAdmin } = useAuth();
  const { openOnboarding } = useOnboarding();
  const [isAdded, setIsAdded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, imageId: '', imageUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteImage = async () => {
    try {
      await deleteServiceImage(deleteDialog.imageId, deleteDialog.imageUrl);
      refetch();
      setDeleteDialog({ open: false, imageId: '', imageUrl: '' });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const service = services.find(s => s.id === id);

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-4 text-foreground">Servicio no encontrado</h1>
          <Button variant="outline" onClick={() => navigate('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const isSelected = selectedServices.some(item => item.service.id === service.id);
  const isCreativeWorkshop = service.category === "Talleres Creativos";
  const badgeClasses = isCreativeWorkshop
    ? "bg-japitown-green-tag/20 text-foreground border-japitown-green-tag/40"
    : "bg-japitown-blue/20 text-foreground border-japitown-blue/40";

  const handleAddService = () => {
    addService(service);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      await uploadImage(file, `${service.title} - Image`);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const iconSrc = serviceIconMap[service.id];

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
          Volver
        </Button>
      </div>

      {/* Hero section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start gap-6 mb-10">
          <div className="w-20 h-20 rounded-2xl bg-accent/60 flex items-center justify-center flex-shrink-0">
            <img src={iconSrc} alt={service.title} className="w-14 h-14 object-contain" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className={`${badgeClasses} rounded-full text-xs`}>
                {service.category}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
              {service.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {service.description}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="rounded-2xl overflow-hidden bg-card shadow-soft">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-display font-bold text-foreground">Galería</h2>
                {isAdmin && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="gap-2 rounded-full">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Subiendo...' : 'Subir'}
                    </Button>
                  </>
                )}
              </div>

              {imagesLoading ? (
                <div className="aspect-video bg-accent/30 flex items-center justify-center">
                  <p className="text-muted-foreground">Cargando...</p>
                </div>
              ) : images.length > 0 ? (
                <div>
                  <div className="aspect-video relative overflow-hidden group">
                    <img
                      src={images[selectedImageIndex]?.image_url}
                      alt={images[selectedImageIndex]?.alt_text || service.title}
                      className="w-full h-full object-cover"
                    />
                    {isAdmin && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="sm" className="rounded-full" onClick={() => setDeleteDialog({ open: true, imageId: images[selectedImageIndex]?.id, imageUrl: images[selectedImageIndex]?.image_url })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex ? 'border-secondary shadow-md' : 'border-border hover:border-secondary/50'
                          }`}
                        >
                          <img src={image.image_url} alt={image.alt_text || `Imagen ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-accent/30 flex items-center justify-center">
                  <div className="text-center">
                    <img src={iconSrc} alt={service.title} className="h-24 w-24 object-contain mx-auto mb-4 opacity-40" />
                    <p className="text-muted-foreground">No hay imágenes disponibles</p>
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="rounded-2xl bg-card shadow-soft p-6">
                <h2 className="font-display font-bold text-foreground mb-4">¿Qué incluye?</h2>
                <ul className="space-y-3">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-japitown-green-tag/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-foreground" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: "Duración", value: service.duration || '2 horas' },
                { icon: Users, label: "Participantes", value: `Hasta ${service.max_participants || 8} niños` },
                { icon: Calendar, label: "Edad", value: service.age_range || '4-12 años' },
                { icon: MapPin, label: "Espacio", value: service.space_requirements || 'Estándar' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-card shadow-soft p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-lg font-display font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-card shadow-soft p-6 sticky top-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Solicitar Cotización</h3>
              <p className="text-sm text-muted-foreground mb-5">El precio varía según el número de niños y servicios seleccionados.</p>

              <div className="space-y-3">
                <Button
                  onClick={handleAddService}
                  className="w-full gap-2 rounded-full"
                  variant={isSelected ? "secondary" : "hero"}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <><Check className="h-4 w-4" /> ¡Agregado!</>
                  ) : isSelected ? (
                    <><Plus className="h-4 w-4" /> Agregar Otro</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Agregar a Cotización</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/#servicios')}
                  className="w-full rounded-full"
                >
                  Ver Todos los Servicios
                </Button>
              </div>

              {selectedServices.length > 0 && (
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedServices.length} servicio{selectedServices.length > 1 ? 's' : ''} seleccionado{selectedServices.length > 1 ? 's' : ''}
                  </p>
                  {selectedServices.length >= 3 && (
                    <Button variant="hero" className="w-full rounded-full" onClick={openOnboarding}>
                      Solicitar Cotización
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Eliminar Imagen"
        description="¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteImage}
        variant="destructive"
      />
    </div>
  );
};

export default ServiceDetail;
