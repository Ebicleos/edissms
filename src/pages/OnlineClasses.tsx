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
import { Video, Play, Download, Clock, Users, Calendar, Plus, FileText } from 'lucide-react';

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
  return (
    <MainLayout title="Online Classes" subtitle="Live classes, lessons, and learning materials">
      <div className="space-y-8 animate-fade-in">
        {/* Live Classes Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Today's Classes</h2>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Class
            </Button>
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
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
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
                  <Button variant="outline" size="sm">
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
