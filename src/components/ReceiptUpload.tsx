import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface ReceiptUploadProps {
  expenseId?: string;
  existingReceiptUrl?: string;
  onUploadComplete: (url: string) => void;
  onDelete?: () => void;
}

export const ReceiptUpload = ({ expenseId, existingReceiptUrl, onUploadComplete, onDelete }: ReceiptUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingReceiptUrl || null);

  const uploadImageBlob = async (blob: Blob, fileName: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/${expenseId || Date.now()}-${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onUploadComplete(filePath);
      toast.success('Receipt uploaded successfully!');
    } catch (error: any) {
      console.error('Receipt upload error:', error);
      toast.error(error.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleCamera = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Camera is only available on mobile devices');
      return;
    }

    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        await uploadImageBlob(blob, `receipt-${Date.now()}.jpg`);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        console.error('Camera error:', error);
        toast.error('Failed to capture photo');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    await uploadImageBlob(file, file.name);
  };

  const handleDelete = async () => {
    if (!existingReceiptUrl) return;

    try {
      const { error } = await supabase.storage
        .from('receipts')
        .remove([existingReceiptUrl]);

      if (error) throw error;

      setPreviewUrl(null);
      onDelete?.();
      toast.success('Receipt deleted');
    } catch (error: any) {
      console.error('Receipt delete error:', error);
      toast.error(error.message || 'Failed to delete receipt');
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Receipt (Optional)</label>
      
      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Receipt" 
            className="w-full max-h-64 object-contain rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {Capacitor.isNativePlatform() && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCamera}
              disabled={uploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
          )}
          
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="receipt-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label 
              htmlFor="receipt-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Click to upload receipt</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
