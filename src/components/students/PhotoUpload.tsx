import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Video, VideoOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (url: string | null) => void;
  studentId?: string;
}

export function PhotoUpload({ currentPhotoUrl, onPhotoChange, studentId }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    await uploadImage(file);
  };

  const uploadImage = async (file: File | Blob) => {
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setIsUploading(true);
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${studentId || Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Store the file path instead of public URL - we'll generate signed URLs when displaying
      onPhotoChange(filePath);
      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload photo', { description: error.message });
      setPreview(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      setShowWebcam(true);
      
      // Wait for dialog to render then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error: any) {
      toast.error('Could not access camera', { 
        description: 'Please ensure camera permissions are granted' 
      });
    }
  };

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  }, [stream]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        stopWebcam();
        await uploadImage(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-3">
      <Label>Student Photo</Label>
      <div className="flex items-start gap-4">
        <div className="relative">
          {preview ? (
            <div className="relative h-32 w-32 rounded-lg overflow-hidden border border-border">
              <img
                src={preview}
                alt="Student photo"
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleRemovePhoto}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="h-32 w-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startWebcam}
            disabled={isUploading}
          >
            <Video className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <p className="text-xs text-muted-foreground">
            Max 5MB, JPG or PNG
          </p>
        </div>
      </div>

      {/* Webcam Dialog */}
      <Dialog open={showWebcam} onOpenChange={(open) => !open && stopWebcam()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={stopWebcam}>
                <VideoOff className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={capturePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
