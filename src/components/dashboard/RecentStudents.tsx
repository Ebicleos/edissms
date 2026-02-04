import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Sparkles } from 'lucide-react';
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

const avatarGradients = [
  'bg-gradient-to-br from-primary to-purple text-white',
  'bg-gradient-to-br from-secondary to-coral text-white',
  'bg-gradient-to-br from-accent to-lime text-white',
  'bg-gradient-to-br from-info to-cyan text-white',
  'bg-gradient-to-br from-pink to-purple text-white',
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
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="section-heading flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          Recent Admissions
        </h3>
        <Button variant="ghost" size="sm" asChild className="h-9 px-3 rounded-xl hover:bg-primary/10 group">
          <Link to="/students" className="text-primary text-sm font-semibold">
            View all <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="list-item animate-pulse">
                <div className="h-11 w-11 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="empty-state py-10">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">No students found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add your first student to get started</p>
          </div>
        ) : (
          recentStudents.map((student, index) => (
            <div
              key={student.id}
              className="list-item group cursor-pointer hover:shadow-md"
            >
              <div className={cn(
                "h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg",
                avatarGradients[index % avatarGradients.length]
              )}>
                {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm sm:text-base truncate">{student.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{student.admissionNumber}</p>
                  <Badge className="text-[10px] sm:text-xs sm:hidden font-semibold bg-primary/10 text-primary border-primary/20">
                    {student.class}
                  </Badge>
                </div>
              </div>
              <Badge className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-primary/10 to-purple/10 text-primary border-primary/20">
                {student.class}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
