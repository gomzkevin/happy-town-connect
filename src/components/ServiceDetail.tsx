import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Check, Clock, Users, MapPin, Calendar, Star, Upload, X, Trash2 } from "lucide-react";
import { useServices as useServicesContext } from "@/contexts/ServicesContext";
import { useServices } from "@/hooks/useServices";
import { useServiceImages } from "@/hooks/useServiceImages";
import { useImageMutations } from "@/hooks/useImageMutations";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "./admin/ConfirmDialog";
import { useState, useRef } from "react";
import * as LucideIcons from "lucide-react";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addService, selectedServices } = useServicesContext();
  const { services } = useServices();
  const { images, loading: imagesLoading, uploadImage, refetch } = useServiceImages(id);
  const { deleteServiceImage } = useImageMutations();
  const { isAdmin } = useAuth();
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

  const openDeleteDialog = (imageId: string, imageUrl: string) => {
    setDeleteDialog({ open: true, imageId, imageUrl });
  };

  const service = services.find(s => s.id === id);
  const IconComponent = service ? (LucideIcons as any)[service.icon] || LucideIcons.Star : LucideIcons.Star;
  
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Servicio no encontrado</h1>
          <Button onClick={() => navigate('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const isSelected = selectedServices.some(item => item.service.id === service.id);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Estaciones de Juego":
        return "bg-primary/10 text-primary";
      case "Talleres Creativos":
        return "bg-secondary/10 text-secondary";
      case "Gastronomía":
        return "bg-accent/10 text-accent";
      case "Servicios Profesionales":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(searchParams.get('from') === 'admin' ? '/admin' : '/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{service.title}</h1>
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Galería de Imágenes</CardTitle>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {imagesLoading ? (
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <div>Cargando imágenes...</div>
                  </div>
                ) : images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="aspect-video relative overflow-hidden group">
                      <img
                        src={images[selectedImageIndex]?.image_url}
                        alt={images[selectedImageIndex]?.alt_text || service.title}
                        className="w-full h-full object-cover"
                      />
                      {isAdmin && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(images[selectedImageIndex]?.id, images[selectedImageIndex]?.image_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnail Grid */}
                    {images.length > 1 && (
                      <div className="flex gap-2 p-4 overflow-x-auto">
                        {images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              index === selectedImageIndex
                                ? 'border-primary shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <img
                              src={image.image_url}
                              alt={image.alt_text || `Imagen ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <div className="text-center">
                      <IconComponent className="h-24 w-24 text-primary/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay imágenes disponibles</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Sube la primera imagen de este servicio
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {service.description}
                </p>
                
                {/* Features */}
                {service.features && service.features.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      Incluye
                    </h3>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Service Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Duración
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-primary">
                        {service.duration || '2 horas'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Participantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-primary">
                        Hasta {service.max_participants || 8} niños
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Edad Recomendada
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-primary">
                        {service.age_range || '4-12 años'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Espacio Requerido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-primary">
                        {service.space_requirements || 'Espacio estándar'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{service.price}</CardTitle>
                  <span className="text-sm text-muted-foreground">MXN por fiesta</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleAddService}
                  className="w-full gap-2"
                  variant={isSelected ? "secondary" : "default"}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      ¡Agregado!
                    </>
                  ) : isSelected ? (
                    <>
                      <Plus className="h-4 w-4" />
                      Agregar Otro
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Agregar a Cotización
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/#servicios')}
                    className="w-full"
                  >
                    Ver Todos los Servicios
                  </Button>
                </div>
              </CardContent>
            </Card>
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