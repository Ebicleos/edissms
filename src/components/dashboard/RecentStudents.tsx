import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CLASS_LIST_DETAILED } from '@/types';

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
    <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-foreground text-sm sm:text-base">Recent Admissions</h3>
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 sm:px-3">
          <Link to="/students" className="text-primary text-xs sm:text-sm">
            View all <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <UserCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No students found</p>
          </div>
        ) : (
          recentStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 active:bg-muted/60 transition-colors touch-manipulation"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base truncate">{student.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">{student.admissionNumber}</p>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs sm:hidden">
                    {student.class}
                  </Badge>
                </div>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                {student.class}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
