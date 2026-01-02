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
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : recentStudents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No students found</p>
        ) : (
          recentStudents.map((student) => (
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
          ))
        )}
      </div>
    </div>
  );
}
