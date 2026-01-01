import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Upload, FileText, ClipboardList, Download, Eye, Clock, Users } from 'lucide-react';

const exams = [
  {
    id: '1',
    title: 'Mid-Term Mathematics',
    subject: 'Mathematics',
    class: 'Primary 5',
    date: '2025-01-20',
    duration: '2 hours',
    totalQuestions: 50,
    status: 'scheduled',
    submissions: 0,
    totalStudents: 35,
  },
  {
    id: '2',
    title: 'First Term English',
    subject: 'English Language',
    class: 'JSS 2',
    date: '2025-01-18',
    duration: '1.5 hours',
    totalQuestions: 40,
    status: 'active',
    submissions: 28,
    totalStudents: 42,
  },
  {
    id: '3',
    title: 'Science Quiz',
    subject: 'Science',
    class: 'Nursery 3',
    date: '2025-01-15',
    duration: '30 minutes',
    totalQuestions: 20,
    status: 'completed',
    submissions: 25,
    totalStudents: 25,
  },
];

const assignments = [
  {
    id: '1',
    title: 'Essay Writing',
    subject: 'English Language',
    class: 'SSS 1',
    dueDate: '2025-01-25',
    submissions: 18,
    totalStudents: 40,
    status: 'open',
  },
  {
    id: '2',
    title: 'Algebra Practice',
    subject: 'Mathematics',
    class: 'Primary 6',
    dueDate: '2025-01-22',
    submissions: 30,
    totalStudents: 35,
    status: 'open',
  },
  {
    id: '3',
    title: 'Biology Diagrams',
    subject: 'Biology',
    class: 'SSS 2',
    dueDate: '2025-01-10',
    submissions: 38,
    totalStudents: 38,
    status: 'closed',
  },
];

export default function Exams() {
  return (
    <MainLayout title="Exams & Assignments" subtitle="Manage exams, assignments, and results">
      <div className="space-y-6 animate-fade-in">
        <Tabs defaultValue="exams" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="exams" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Exams
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <Download className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Questions
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            </div>
          </div>

          <TabsContent value="exams" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <Card key={exam.id} className="card-hover">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge
                        variant={
                          exam.status === 'completed'
                            ? 'secondary'
                            : exam.status === 'active'
                            ? 'default'
                            : 'outline'
                        }
                        className={
                          exam.status === 'active'
                            ? 'bg-success text-success-foreground'
                            : ''
                        }
                      >
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{exam.class}</Badge>
                    </div>
                    <CardTitle className="mt-2">{exam.title}</CardTitle>
                    <CardDescription>{exam.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {exam.duration}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {exam.totalQuestions} Questions
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {exam.submissions}/{exam.totalStudents} Submissions
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button size="sm" className="flex-1 bg-gradient-primary">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="card-hover">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge
                        variant={assignment.status === 'closed' ? 'secondary' : 'default'}
                        className={assignment.status === 'open' ? 'bg-success text-success-foreground' : ''}
                      >
                        {assignment.status === 'open' ? 'Open' : 'Closed'}
                      </Badge>
                      <Badge variant="outline">{assignment.class}</Badge>
                    </div>
                    <CardTitle className="mt-2">{assignment.title}</CardTitle>
                    <CardDescription>{assignment.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(assignment.dueDate).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {assignment.submissions}/{assignment.totalStudents} Submitted
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button size="sm" className="flex-1 bg-gradient-secondary">
                        Grade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <div className="bg-card rounded-xl border border-border/50 p-12 shadow-sm text-center">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Generate Report Cards</h3>
              <p className="text-muted-foreground mb-6">
                Select a class and term to generate and download student report cards
              </p>
              <Button className="bg-gradient-primary hover:opacity-90">
                Generate Reports
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
