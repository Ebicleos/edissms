-- Create notification_reads table to track per-user read status
CREATE TABLE public.notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable Row Level Security
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own read status
CREATE POLICY "Users can view their own notification reads"
ON public.notification_reads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark notifications as read (insert)
CREATE POLICY "Users can mark notifications as read"
ON public.notification_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own read status
CREATE POLICY "Users can delete their own notification reads"
ON public.notification_reads
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_notification_reads_user_id ON public.notification_reads(user_id);
CREATE INDEX idx_notification_reads_announcement_id ON public.notification_reads(announcement_id);