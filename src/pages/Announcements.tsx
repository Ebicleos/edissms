import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Megaphone, Edit, Trash2, AlertCircle, Bell, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { announcementSchema, validateInput } from '@/lib/validations';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event';
  target_audience: 'all' | 'teachers' | 'students' | 'parents';
  is_published: boolean;
  publish_date: string | null;
  expiry_date: string | null;
  created_at: string;
  created_by: string | null;
}

export default function Announcements() {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'general' | 'urgent' | 'event'>('general');
  const [targetAudience, setTargetAudience] = useState<'all' | 'teachers' | 'students' | 'parents'>('all');
  const [isPublished, setIsPublished] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data as Announcement[]);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('general');
    setTargetAudience('all');
    setIsPublished(false);
    setExpiryDate('');
    setSelectedAnnouncement(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setType(announcement.type);
    setTargetAudience(announcement.target_audience);
    setIsPublished(announcement.is_published);
    setExpiryDate(announcement.expiry_date || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input using schema
    const validation = validateInput(announcementSchema, {
      title,
      content,
      type,
      target_audience: targetAudience,
      is_published: isPublished,
      expiry_date: expiryDate || null,
    });

    if (validation.success === false) {
      toast.error(validation.error);
      return;
    }

    const validatedData = validation.data;
    setIsSubmitting(true);

    const announcementData = {
      title: validatedData.title,
      content: validatedData.content,
      type: validatedData.type,
      target_audience: validatedData.target_audience,
      is_published: validatedData.is_published,
      expiry_date: validatedData.expiry_date,
      publish_date: isPublished ? new Date().toISOString() : null,
      created_by: user?.id,
      school_id: profile?.school_id,
    };

    let error;
    if (selectedAnnouncement) {
      ({ error } = await supabase
        .from('announcements')
        .update(announcementData)
        .eq('id', selectedAnnouncement.id));
    } else {
      ({ error } = await supabase.from('announcements').insert(announcementData));
    }

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to save announcement');
      return;
    }

    toast.success(selectedAnnouncement ? 'Announcement updated!' : 'Announcement created!');
    setDialogOpen(false);
    resetForm();
    fetchAnnouncements();
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', selectedAnnouncement.id);

    if (error) {
      toast.error('Failed to delete announcement');
      return;
    }

    toast.success('Announcement deleted');
    setDeleteDialogOpen(false);
    setSelectedAnnouncement(null);
    fetchAnnouncements();
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    const { error } = await supabase
      .from('announcements')
      .update({ 
        is_published: !announcement.is_published,
        publish_date: !announcement.is_published ? new Date().toISOString() : null,
      })
      .eq('id', announcement.id);

    if (error) {
      toast.error('Failed to update announcement');
      return;
    }

    toast.success(announcement.is_published ? 'Announcement unpublished' : 'Announcement published');
    fetchAnnouncements();
  };

  const getTypeBadge = (announcementType: string) => {
    switch (announcementType) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'event':
        return <Badge className="bg-blue-500">Event</Badge>;
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'teachers':
        return <Badge variant="outline" className="ml-2">Teachers</Badge>;
      case 'students':
        return <Badge variant="outline" className="ml-2">Students</Badge>;
      case 'parents':
        return <Badge variant="outline" className="ml-2">Parents</Badge>;
      default:
        return <Badge variant="outline" className="ml-2">Everyone</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-content">
        <PageGradientHeader emoji="📢" title="Announcements" subtitle="Create and manage school-wide announcements" gradient="from-orange-500/10 via-rose-500/5 to-pink-500/5" />
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">{announcements.length} announcement(s)</span>
          </div>
          <Button onClick={handleOpenCreate} className="bg-gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Announcements List */}
        <div className="grid gap-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first announcement to communicate with the school community.
                </p>
                <Button onClick={handleOpenCreate}>Create Announcement</Button>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className={announcement.type === 'urgent' ? 'border-destructive' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(announcement.type)}
                      {getAudienceIcon(announcement.target_audience)}
                      {announcement.is_published ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(announcement)}>
                        <Bell className={`h-4 w-4 ${announcement.is_published ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(announcement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{announcement.title}</CardTitle>
                  <CardDescription>
                    {format(new Date(announcement.created_at), 'PPP')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>
              {selectedAnnouncement ? 'Update the announcement details.' : 'Create a new announcement for the school community.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                required
              />
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement..."
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'general' | 'urgent' | 'event')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as 'all' | 'teachers' | 'students' | 'parents')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="teachers">Teachers Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="parents">Parents Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Publish Now</p>
                <p className="text-sm text-muted-foreground">Make this announcement visible immediately</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : selectedAnnouncement ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedAnnouncement?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
