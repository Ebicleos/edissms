import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Play, Download, Clock, Users, Calendar, Plus, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CLASS_LIST_DETAILED } from '@/types';
import { format } from 'date-fns';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

interface OnlineClass {
  id: string;
  title: string;
  subject: string | null;
  class_id: string;
  start_time: string;
  end_time: string | null;
  meeting_url: string | null;
  status: string | null;
  teacher_id: string | null;
  teacher_name?: string;
}

interface LearningMaterial {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  file_url: string;
  file_type: string | null;
  file_size: string | null;
  created_at: string;
}

export default function OnlineClasses() {
  const { role, user, userClass } = useAuth();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveClasses, setLiveClasses] = useState<OnlineClass[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  
  // Form states
  const [classTitle, setClassTitle] = useState('');
  const [classSubject, setClassSubject] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialSubject, setMaterialSubject] = useState('');
  const [materialClass, setMaterialClass] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);

  const isTeacherOrAdmin = role === 'admin' || role === 'teacher';

  useEffect(() => {
    fetchData();
  }, [userClass, role]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Build query based on role
      let classQuery = supabase
        .from('online_classes')
        .select('*')
        .order('start_time', { ascending: true });

      // For students, filter by their class
      if (role === 'student' && userClass) {
        classQuery = classQuery.eq('class_id', userClass);
      }

      const { data: classesData, error: classesError } = await classQuery;
      if (classesError) throw classesError;

      // Fetch teacher names for the classes
      if (classesData && classesData.length > 0) {
        const teacherIds = [...new Set(classesData.filter(c => c.teacher_id).map(c => c.teacher_id))];
        const { data: teachersData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);

        const teacherMap = new Map(teachersData?.map(t => [t.id, t.full_name]) || []);
        
        const classesWithTeachers = classesData.map(c => ({
          ...c,
          teacher_name: c.teacher_id ? teacherMap.get(c.teacher_id) || 'Unknown' : 'N/A',
        }));
        setLiveClasses(classesWithTeachers);
      } else {
        setLiveClasses([]);
      }

      // Fetch learning materials
      let materialsQuery = supabase
        .from('learning_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (role === 'student' && userClass) {
        materialsQuery = materialsQuery.eq('class_id', userClass);
      }

      const { data: materialsData, error: materialsError } = await materialsQuery;
      if (materialsError) throw materialsError;
      setMaterials(materialsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = (cls: OnlineClass) => {
    if (cls.meeting_url) {
      window.open(cls.meeting_url, '_blank');
    } else {
      toast.info(`Joining "${cls.title}"...`, {
        description: 'Video conferencing will open shortly.',
      });
    }
  };

  const handleViewDetails = (cls: OnlineClass) => {
    toast.info(`Class: ${cls.title}`, {
      description: `${cls.subject || 'No subject'} - ${cls.class_id}`,
    });
  };

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classTitle || !selectedClassId || !startTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('online_classes').insert({
        title: classTitle,
        subject: classSubject || null,
        class_id: selectedClassId,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        meeting_url: meetingUrl || null,
        teacher_id: user?.id,
        status: 'scheduled',
      });

      if (error) throw error;

      toast.success('Class scheduled successfully!');
      setScheduleOpen(false);
      setClassTitle('');
      setClassSubject('');
      setSelectedClassId('');
      setStartTime('');
      setEndTime('');
      setMeetingUrl('');
      fetchData();
    } catch (error) {
      console.error('Error scheduling class:', error);
      toast.error('Failed to schedule class');
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!materialTitle || !materialSubject || !materialClass) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let fileUrl = '';
      let fileType = '';
      let fileSize = '';

      if (materialFile) {
        const filePath = `${Date.now()}_${materialFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('learning-materials')
          .upload(filePath, materialFile);

        if (uploadError) throw uploadError;
        fileUrl = filePath;
        fileType = materialFile.type;
        fileSize = `${(materialFile.size / (1024 * 1024)).toFixed(2)} MB`;
      }

      const { error } = await supabase.from('learning_materials').insert({
        title: materialTitle,
        subject: materialSubject,
        class_id: materialClass,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        uploaded_by: user?.id,
      });

      if (error) throw error;

      toast.success('Material uploaded successfully!');
      setUploadOpen(false);
      setMaterialTitle('');
      setMaterialSubject('');
      setMaterialClass('');
      setMaterialFile(null);
      fetchData();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material');
    }
  };

  const handleDownload = async (material: LearningMaterial) => {
    try {
      if (material.file_url.startsWith('http')) {
        window.open(material.file_url, '_blank');
      } else {
        const { data, error } = await supabase.storage
          .from('learning-materials')
          .createSignedUrl(material.file_url, 3600);

        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      }
      toast.success(`Downloading "${material.title}"...`);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download file');
    }
  };

  const getClassStatus = (cls: OnlineClass) => {
    const now = new Date();
    const startTime = new Date(cls.start_time);
    const endTime = cls.end_time ? new Date(cls.end_time) : null;

    if (endTime && now > endTime) return 'ended';
    if (now >= startTime && (!endTime || now <= endTime)) return 'live';
    return 'scheduled';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        <PageGradientHeader emoji="🎥" title="Online Classes" subtitle="Live classes, lessons, and learning materials" gradient="from-cyan-500/10 via-blue-500/5 to-primary/5" />
        {/* Live Classes Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Today's Classes</h2>
            {isTeacherOrAdmin && (
              <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Class</DialogTitle>
                    <DialogDescription>
                      Fill in the details to schedule a new online class.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleScheduleClass} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Class Title *</Label>
                      <Input 
                        id="title" 
                        value={classTitle}
                        onChange={(e) => setClassTitle(e.target.value)}
                        placeholder="e.g., Mathematics - Algebra" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input 
                        id="subject" 
                        value={classSubject}
                        onChange={(e) => setClassSubject(e.target.value)}
                        placeholder="e.g., Mathematics" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class">Class/Grade *</Label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_LIST_DETAILED.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
                      <Input 
                        id="meetingUrl" 
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        placeholder="https://meet.google.com/..." 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time *</Label>
                        <Input 
                          id="startTime" 
                          type="datetime-local" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input 
                          id="endTime" 
                          type="datetime-local"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                      Schedule Class
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {liveClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No classes scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveClasses.map((cls) => {
                const status = getClassStatus(cls);
                return (
                  <Card key={cls.id} className="card-hover overflow-hidden">
                    <div className={`h-2 ${status === 'live' ? 'bg-gradient-accent' : status === 'ended' ? 'bg-muted' : 'bg-primary'}`} />
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge
                          variant={status === 'live' ? 'default' : 'outline'}
                          className={status === 'live' ? 'bg-success animate-pulse' : ''}
                        >
                          {status === 'live' ? '🔴 Live Now' : status === 'ended' ? 'Ended' : 'Scheduled'}
                        </Badge>
                        <Badge variant="secondary">{cls.class_id}</Badge>
                      </div>
                      <CardTitle className="mt-2">{cls.title}</CardTitle>
                      <CardDescription>{cls.teacher_name || cls.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(cls.start_time), 'h:mm a')}
                          {cls.end_time && ` - ${format(new Date(cls.end_time), 'h:mm a')}`}
                        </div>
                      </div>
                      <Button
                        onClick={() => status === 'live' ? handleJoinClass(cls) : handleViewDetails(cls)}
                        className={`w-full ${
                          status === 'live'
                            ? 'bg-gradient-accent hover:opacity-90'
                            : 'bg-gradient-primary hover:opacity-90'
                        }`}
                        disabled={status === 'ended'}
                      >
                        {status === 'live' ? (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Join Class
                          </>
                        ) : (
                          <>
                            <Calendar className="mr-2 h-4 w-4" />
                            View Details
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Learning Materials Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Learning Materials</h2>
            {isTeacherOrAdmin && (
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Learning Material</DialogTitle>
                    <DialogDescription>
                      Upload a document or video for students to access.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUploadMaterial} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="materialTitle">Title *</Label>
                      <Input 
                        id="materialTitle" 
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                        placeholder="e.g., Mathematics Workbook" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="materialSubject">Subject *</Label>
                      <Input 
                        id="materialSubject" 
                        value={materialSubject}
                        onChange={(e) => setMaterialSubject(e.target.value)}
                        placeholder="e.g., Mathematics" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="materialClass">Class/Grade *</Label>
                      <Select value={materialClass} onValueChange={setMaterialClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_LIST_DETAILED.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">File</Label>
                      <Input 
                        id="file" 
                        type="file" 
                        onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                      Upload Material
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {materials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No learning materials available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="divide-y divide-border">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {material.file_type?.includes('video') ? (
                          <Play className="h-6 w-6 text-primary" />
                        ) : (
                          <FileText className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{material.title}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{material.subject}</span>
                          <span>•</span>
                          <span>{material.class_id}</span>
                          {material.file_size && (
                            <>
                              <span>•</span>
                              <span>{material.file_size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(material)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
