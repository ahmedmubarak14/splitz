import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReceiptUploadProps {
  expenseId?: string;
  existingReceiptUrl?: string;
  onUploadComplete: (url: string) => void;
  onDelete?: () => void;
}

export const ReceiptUpload = ({ expenseId, existingReceiptUrl, onUploadComplete, onDelete }: ReceiptUploadProps) => {
  const { t } = useTranslation();
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
      toast.success(t('camera.receiptDeleted'));
    } catch (error: any) {
      console.error('Receipt upload error:', error);
      toast.error(error.message || t('camera.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('camera.uploadFailed'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('camera.uploadFailed'));
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
      toast.success(t('camera.receiptDeleted'));
    } catch (error: any) {
      console.error('Receipt delete error:', error);
      toast.error(error.message || t('camera.deleteFailed'));
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{t('camera.receiptOptional')}</label>
      
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
                  <p className="text-sm text-muted-foreground">{t('camera.uploading')}</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('camera.clickToUpload')}</p>
                    <p className="text-xs text-muted-foreground">{t('camera.fileTypeHint')}</p>
                  </div>
                </>
              )}
            </label>
        </div>
      )}
    </div>
  );
};
