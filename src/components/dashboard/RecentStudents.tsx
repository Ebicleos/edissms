import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CLASS_LIST_DETAILED } from '@/types';
import { cn } from '@/lib/utils';

interface RecentStudent {
  id: string;
  name: string;
  class: string;
  admissionNumber: string;
}

const getClassName = (classId: string): string => {
  const cls = CLASS_LIST_DETAILED.find(c => c.id === classId);
  return cls?.name || classId;
};

const avatarColors = [
  'bg-primary/15 text-primary',
  'bg-secondary/15 text-secondary',
  'bg-accent/15 text-accent',
  'bg-info/15 text-info',
  'bg-warning/15 text-warning',
];

export function RecentStudents() {
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, class_id, admission_number')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent students:', error);
        setRecentStudents([]);
      } else {
        setRecentStudents(
          (data || []).map((s) => ({
            id: s.id,
            name: s.full_name,
            class: getClassName(s.class_id),
            admissionNumber: s.admission_number,
          }))
        );
      }
      setIsLoading(false);
    };

    fetchRecentStudents();
  }, []);

  return (
    <div className="content-card">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="section-heading flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          Recent Admissions
        </h3>
        <Button variant="ghost" size="sm" asChild className="h-9 px-3 rounded-xl hover:bg-primary/10">
          <Link to="/students" className="text-primary text-sm font-medium">
            View all <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="list-item animate-pulse">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="empty-state py-8">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Users className="empty-state-icon h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No students found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add your first student to get started</p>
          </div>
        ) : (
          recentStudents.map((student, index) => (
            <div
              key={student.id}
              className="list-item group cursor-pointer"
            >
              <div className={cn(
                "h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm transition-transform duration-200 group-hover:scale-105",
                avatarColors[index % avatarColors.length]
              )}>
                {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm sm:text-base truncate">{student.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{student.admissionNumber}</p>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs sm:hidden font-medium">
                    {student.class}
                  </Badge>
                </div>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-medium px-2.5 py-1">
                {student.class}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}