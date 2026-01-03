import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface SchoolLogoUploadProps {
  currentLogoUrl?: string | null;
  onUploadComplete: (url: string) => void;
  schoolId?: string;
}

export function SchoolLogoUpload({ currentLogoUrl, onUploadComplete, schoolId }: SchoolLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid file type', { description: 'Please upload a JPG, PNG, or WebP image' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', { description: 'Maximum file size is 2MB' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${schoolId || 'school'}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="School logo preview"
                className="h-full w-full object-contain"
              />
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG or WebP. Max 2MB. Recommended: 200x200px
          </p>
        </div>
      </div>
    </div>
  );
}
