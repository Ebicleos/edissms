import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignatureUploadProps {
  label: string;
  currentUrl: string | null;
  onUploadComplete: (path: string) => void;
  onRemove: () => void;
}

export function SignatureUpload({ label, currentUrl, onUploadComplete, onRemove }: SignatureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicUrl = currentUrl 
    ? supabase.storage.from('school-signatures').getPublicUrl(currentUrl).data.publicUrl 
    : null;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error('File size must be less than 1MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('school-signatures')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload signature');
      setIsUploading(false);
      return;
    }

    onUploadComplete(fileName);
    toast.success('Signature uploaded!');
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div 
          className="w-[180px] h-[70px] border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : publicUrl ? (
            <img src={publicUrl} alt={label} className="h-full w-full object-contain p-1" />
          ) : (
            <div className="text-center text-xs text-muted-foreground">
              <Upload className="h-4 w-4 mx-auto mb-1" />
              Click to upload
            </div>
          )}
        </div>
        {currentUrl && (
          <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <p className="text-xs text-muted-foreground">PNG or JPG, max 1MB. Transparent background recommended.</p>
    </div>
  );
}
