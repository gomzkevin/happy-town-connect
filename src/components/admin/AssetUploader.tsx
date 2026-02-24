import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import all icons
import Iconos01 from '@/assets/Iconos-01.png';
import Iconos02 from '@/assets/Iconos-02.png';
import Iconos03 from '@/assets/Iconos-03.png';
import Iconos04 from '@/assets/Iconos-04.png';
import Iconos05 from '@/assets/Iconos-05.png';
import Iconos06 from '@/assets/Iconos-06.png';
import Iconos07 from '@/assets/Iconos-07.png';
import Iconos08 from '@/assets/Iconos-08.png';
import Iconos09 from '@/assets/Iconos-09.png';
import Iconos10 from '@/assets/Iconos-10.png';
import Iconos11 from '@/assets/Iconos-11.png';
import Iconos12 from '@/assets/Iconos-12.png';
import Iconos13 from '@/assets/Iconos-13.png';
import Iconos14 from '@/assets/Iconos-14.png';
import Iconos15 from '@/assets/Iconos-15.png';
import Iconos16 from '@/assets/Iconos-16.png';
import Iconos17 from '@/assets/Iconos-17.png';
import Iconos18 from '@/assets/Iconos-18.png';
import Iconos19 from '@/assets/Iconos-19.png';
import Iconos20 from '@/assets/Iconos-20.png';
import Logo21 from '@/assets/Logo-21.png';
import Logo22 from '@/assets/Logo-22.png';
import Logo23 from '@/assets/Logo-23.png';
import Logo24 from '@/assets/Logo-24.png';
import Logo25 from '@/assets/Logo-25.png';
import LogoOficial from '@/assets/japitown-logo-oficial.png';

interface AssetEntry {
  localUrl: string;
  storagePath: string;
  label: string;
}

const ASSETS: AssetEntry[] = [
  { localUrl: Iconos01, storagePath: 'icons/Iconos-01.png', label: 'Iconos-01 (Pesca)' },
  { localUrl: Iconos02, storagePath: 'icons/Iconos-02.png', label: 'Iconos-02 (SPA)' },
  { localUrl: Iconos03, storagePath: 'icons/Iconos-03.png', label: 'Iconos-03 (Hamburguesería)' },
  { localUrl: Iconos04, storagePath: 'icons/Iconos-04.png', label: 'Iconos-04 (Construcción)' },
  { localUrl: Iconos05, storagePath: 'icons/Iconos-05.png', label: 'Iconos-05 (Supermercado)' },
  { localUrl: Iconos06, storagePath: 'icons/Iconos-06.png', label: 'Iconos-06 (Cafetería)' },
  { localUrl: Iconos07, storagePath: 'icons/Iconos-07.png', label: 'Iconos-07 (Veterinaria)' },
  { localUrl: Iconos08, storagePath: 'icons/Iconos-08.png', label: 'Iconos-08 (Correo)' },
  { localUrl: Iconos09, storagePath: 'icons/Iconos-09.png', label: 'Iconos-09 (Peluquería)' },
  { localUrl: Iconos10, storagePath: 'icons/Iconos-10.png', label: 'Iconos-10 (Decora Cupcake)' },
  { localUrl: Iconos11, storagePath: 'icons/Iconos-11.png', label: 'Iconos-11 (Área Bebés)' },
  { localUrl: Iconos12, storagePath: 'icons/Iconos-12.png', label: 'Iconos-12 (Guardería)' },
  { localUrl: Iconos13, storagePath: 'icons/Iconos-13.png', label: 'Iconos-13 (Espiral)' },
  { localUrl: Iconos14, storagePath: 'icons/Iconos-14.png', label: 'Iconos-14 (Flor)' },
  { localUrl: Iconos15, storagePath: 'icons/Iconos-15.png', label: 'Iconos-15 (Nube)' },
  { localUrl: Iconos16, storagePath: 'icons/Iconos-16.png', label: 'Iconos-16 (Talleres)' },
  { localUrl: Iconos17, storagePath: 'icons/Iconos-17.png', label: 'Iconos-17 (Estrella)' },
  { localUrl: Iconos18, storagePath: 'icons/Iconos-18.png', label: 'Iconos-18 (Decorativo)' },
  { localUrl: Iconos19, storagePath: 'icons/Iconos-19.png', label: 'Iconos-19 (Sol)' },
  { localUrl: Iconos20, storagePath: 'icons/Iconos-20.png', label: 'Iconos-20 (Ola)' },
  { localUrl: Logo21, storagePath: 'logos/Logo-21.png', label: 'Logo-21' },
  { localUrl: Logo22, storagePath: 'logos/Logo-22.png', label: 'Logo-22' },
  { localUrl: Logo23, storagePath: 'logos/Logo-23.png', label: 'Logo-23' },
  { localUrl: Logo24, storagePath: 'logos/Logo-24.png', label: 'Logo-24' },
  { localUrl: Logo25, storagePath: 'logos/Logo-25.png', label: 'Logo-25' },
  { localUrl: LogoOficial, storagePath: 'logos/japitown-logo-oficial.png', label: 'Logo Oficial' },
];

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'skipped';

const AssetUploader: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<string, UploadStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const completedCount = Object.values(statuses).filter(s => s === 'success' || s === 'skipped').length;

  const handleUploadAll = async () => {
    setUploading(true);
    setProgress(0);
    const newStatuses: Record<string, UploadStatus> = {};
    const newErrors: Record<string, string> = {};

    for (let i = 0; i < ASSETS.length; i++) {
      const asset = ASSETS[i];
      newStatuses[asset.storagePath] = 'uploading';
      setStatuses({ ...newStatuses });

      try {
        // Fetch the imported asset URL to get the blob
        const res = await fetch(asset.localUrl);
        const blob = await res.blob();

        const { error } = await supabase.storage
          .from('japitown-assets')
          .upload(asset.storagePath, blob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (error) {
          newStatuses[asset.storagePath] = 'error';
          newErrors[asset.storagePath] = error.message;
        } else {
          newStatuses[asset.storagePath] = 'success';
        }
      } catch (err: any) {
        newStatuses[asset.storagePath] = 'error';
        newErrors[asset.storagePath] = err.message || 'Unknown error';
      }

      setStatuses({ ...newStatuses });
      setErrors({ ...newErrors });
      setProgress(((i + 1) / ASSETS.length) * 100);
    }

    setUploading(false);
  };

  const statusIcon = (status?: UploadStatus) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'skipped': return <Badge variant="secondary" className="text-xs">Ya existe</Badge>;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Assets al Storage
        </CardTitle>
        <CardDescription>
          Herramienta temporal para subir los íconos y logos al bucket <code>japitown-assets</code> de Supabase Storage.
          Una vez completada la subida, esta pestaña se puede eliminar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={handleUploadAll} disabled={uploading} variant="warm">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo... ({completedCount}/{ASSETS.length})
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Todos los Assets ({ASSETS.length})
              </>
            )}
          </Button>
          {completedCount > 0 && !uploading && (
            <Badge variant="outline">{completedCount}/{ASSETS.length} completados</Badge>
          )}
        </div>

        {uploading && <Progress value={progress} className="h-2" />}

        <div className="grid gap-2 max-h-96 overflow-y-auto">
          {ASSETS.map((asset) => (
            <div
              key={asset.storagePath}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <img src={asset.localUrl} alt={asset.label} className="h-8 w-8 object-contain" />
              <span className="text-sm flex-1">{asset.label}</span>
              <code className="text-xs text-muted-foreground">{asset.storagePath}</code>
              {statusIcon(statuses[asset.storagePath])}
              {errors[asset.storagePath] && (
                <span className="text-xs text-destructive">{errors[asset.storagePath]}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetUploader;
