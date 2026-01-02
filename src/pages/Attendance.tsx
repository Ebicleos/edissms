import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CLASS_LIST_DETAILED, AttendanceStatus } from '@/types';
import { Check, X, Clock, AlertCircle, Save, CalendarDays } from 'lucide-react';

const mockStudents = [
  { id: '1', name: 'Chioma Adeyemi', admissionNumber: 'ADM-2025-0001' },
  { id: '2', name: 'Emeka Okonkwo', admissionNumber: 'ADM-2025-0002' },
  { id: '3', name: 'Fatima Ibrahim', admissionNumber: 'ADM-2025-0003' },
  { id: '4', name: 'David Okafor', admissionNumber: 'ADM-2025-0004' },
  { id: '5', name: 'Grace Mensah', admissionNumber: 'ADM-2025-0005' },
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const getStatusIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Check className="h-5 w-5 text-success" />;
      case 'absent':
        return <X className="h-5 w-5 text-destructive" />;
      case 'late':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'excused':
        return <AlertCircle className="h-5 w-5 text-info" />;
      default:
        return null;
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;

  return (
    <MainLayout title="Attendance" subtitle="Mark and track student attendance">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Calendar and Class Selection */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Select Date
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">Select Class</h3>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LIST_DETAILED.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            {selectedClass && (
              <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-foreground">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Present</span>
                    <Badge className="badge-success">{presentCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Absent</span>
                    <Badge variant="destructive">{absentCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Late</span>
                    <Badge className="badge-warning">{lateCount}</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Attendance Table */}
          <div className="lg:col-span-3">
            {selectedClass ? (
              <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {CLASS_LIST_DETAILED.find((c) => c.id === selectedClass)?.name} Attendance
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate?.toLocaleDateString('en-NG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Save className="mr-2 h-4 w-4" />
                    Save Attendance
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Excused</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.admissionNumber}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                            className={attendance[student.id] === 'present' ? 'bg-success hover:bg-success/90' : ''}
                            onClick={() => handleAttendanceChange(student.id, 'present')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant={attendance[student.id] === 'late' ? 'default' : 'outline'}
                            className={attendance[student.id] === 'late' ? 'bg-warning hover:bg-warning/90' : ''}
                            onClick={() => handleAttendanceChange(student.id, 'late')}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant={attendance[student.id] === 'excused' ? 'default' : 'outline'}
                            className={attendance[student.id] === 'excused' ? 'bg-info hover:bg-info/90' : ''}
                            onClick={() => handleAttendanceChange(student.id, 'excused')}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusIcon(attendance[student.id])}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 p-12 shadow-sm text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Class</h3>
                <p className="text-muted-foreground">
                  Choose a class from the dropdown to start marking attendance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
