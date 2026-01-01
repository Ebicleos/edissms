import { Link } from 'react-router-dom';
import { ArrowRight, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const recentStudents = [
  { id: '1', name: 'Chioma Adeyemi', class: 'Primary 5', admissionNumber: 'ADM-2025-0001', date: '2025-01-15' },
  { id: '2', name: 'Emeka Okonkwo', class: 'JSS 2', admissionNumber: 'ADM-2025-0002', date: '2025-01-14' },
  { id: '3', name: 'Fatima Ibrahim', class: 'Nursery 2', admissionNumber: 'ADM-2025-0003', date: '2025-01-13' },
  { id: '4', name: 'David Okafor', class: 'SSS 1', admissionNumber: 'ADM-2025-0004', date: '2025-01-12' },
  { id: '5', name: 'Grace Mensah', class: 'Primary 3', admissionNumber: 'ADM-2025-0005', date: '2025-01-11' },
];

export function RecentStudents() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Admissions</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/students" className="text-primary">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-3">
        {recentStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {student.class}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
