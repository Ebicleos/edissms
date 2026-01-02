import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Play, Download, Clock, Users, Calendar, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

const liveClasses = [
  {
    id: '1',
    title: 'Mathematics - Algebra',
    teacher: 'Mrs. Adaobi Nwankwo',
    class: 'Primary 5',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    status: 'live',
    participants: 32,
  },
  {
    id: '2',
    title: 'English Language - Grammar',
    teacher: 'Mr. Chukwuemeka Obi',
    class: 'JSS 2',
    startTime: '11:30 AM',
    endTime: '12:30 PM',
    status: 'scheduled',
    participants: 0,
  },
  {
    id: '3',
    title: 'Science - Plant Biology',
    teacher: 'Mrs. Fatima Bello',
    class: 'Nursery 3',
    startTime: '02:00 PM',
    endTime: '02:30 PM',
    status: 'scheduled',
    participants: 0,
  },
];

const materials = [
  {
    id: '1',
    title: 'Mathematics Workbook - Week 3',
    subject: 'Mathematics',
    class: 'Primary 5',
    type: 'PDF',
    size: '2.5 MB',
    uploadedAt: '2025-01-15',
  },
  {
    id: '2',
    title: 'English Vocabulary List',
    subject: 'English Language',
    class: 'JSS 2',
    type: 'PDF',
    size: '1.2 MB',
    uploadedAt: '2025-01-14',
  },
  {
    id: '3',
    title: 'Science Lab Video - Experiment 1',
    subject: 'Science',
    class: 'SSS 1',
    type: 'Video',
    size: '150 MB',
    uploadedAt: '2025-01-13',
  },
];

export default function OnlineClasses() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleJoinClass = (classTitle: string) => {
    toast.success(`Joining "${classTitle}"...`, {
      description: 'Video conferencing will open shortly.',
    });
  };

  const handleViewDetails = (classTitle: string) => {
    toast.info(`Viewing details for "${classTitle}"`, {
      description: 'Class details will be displayed here.',
    });
  };

  const handleScheduleClass = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Class scheduled successfully!');
    setScheduleOpen(false);
  };

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Material uploaded successfully!');
    setUploadOpen(false);
  };

  const handleDownload = (materialTitle: string) => {
    toast.success(`Downloading "${materialTitle}"...`, {
      description: 'Your download will start shortly.',
    });
  };

  return (
    <MainLayout title="Online Classes" subtitle="Live classes, lessons, and learning materials">
      <div className="space-y-8 animate-fade-in">
        {/* Live Classes Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Today's Classes</h2>
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
                    <Label htmlFor="title">Class Title</Label>
                    <Input id="title" placeholder="e.g., Mathematics - Algebra" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class/Grade</Label>
                    <Input id="class" placeholder="e.g., Primary 5" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" type="time" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" type="time" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                    Schedule Class
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveClasses.map((cls) => (
              <Card key={cls.id} className="card-hover overflow-hidden">
                <div className={`h-2 ${cls.status === 'live' ? 'bg-gradient-accent' : 'bg-muted'}`} />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge
                      variant={cls.status === 'live' ? 'default' : 'outline'}
                      className={cls.status === 'live' ? 'bg-success animate-pulse' : ''}
                    >
                      {cls.status === 'live' ? '🔴 Live Now' : 'Scheduled'}
                    </Badge>
                    <Badge variant="secondary">{cls.class}</Badge>
                  </div>
                  <CardTitle className="mt-2">{cls.title}</CardTitle>
                  <CardDescription>{cls.teacher}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {cls.startTime} - {cls.endTime}
                    </div>
                    {cls.status === 'live' && (
                      <div className="flex items-center gap-2 text-success">
                        <Users className="h-4 w-4" />
                        {cls.participants} joined
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => cls.status === 'live' ? handleJoinClass(cls.title) : handleViewDetails(cls.title)}
                    className={`w-full ${
                      cls.status === 'live'
                        ? 'bg-gradient-accent hover:opacity-90'
                        : 'bg-gradient-primary hover:opacity-90'
                    }`}
                  >
                    {cls.status === 'live' ? (
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
            ))}
          </div>
        </section>

        {/* Learning Materials Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Learning Materials</h2>
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
                    <Label htmlFor="materialTitle">Title</Label>
                    <Input id="materialTitle" placeholder="e.g., Mathematics Workbook" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="e.g., Mathematics" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="materialClass">Class/Grade</Label>
                    <Input id="materialClass" placeholder="e.g., Primary 5" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input id="file" type="file" required />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                    Upload Material
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {material.type === 'Video' ? (
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
                        <span>{material.class}</span>
                        <span>•</span>
                        <span>{material.size}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(material.title)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
