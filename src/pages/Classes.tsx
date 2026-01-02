import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CLASS_LIST_DETAILED } from '@/types';
import { useStudents } from '@/hooks/useStudents';
import { Users, GraduationCap, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AddClassDialog } from '@/components/classes/AddClassDialog';

const levelColors: Record<string, string> = {
  'Early Years': 'bg-pink-100 text-pink-700 border-pink-200',
  'Nursery': 'bg-purple-100 text-purple-700 border-purple-200',
  'Primary': 'bg-blue-100 text-blue-700 border-blue-200',
  'Junior Secondary': 'bg-green-100 text-green-700 border-green-200',
  'Senior Secondary': 'bg-amber-100 text-amber-700 border-amber-200',
};

const levelIcons: Record<string, string> = {
  'Early Years': '🎒',
  'Nursery': '🧒',
  'Primary': '📚',
  'Junior Secondary': '🎓',
  'Senior Secondary': '🏆',
};

export default function Classes() {
  const { getStudentsByClass } = useStudents();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Group classes by level
  const groupedClasses = CLASS_LIST_DETAILED.reduce((acc, cls) => {
    if (!acc[cls.level]) {
      acc[cls.level] = [];
    }
    acc[cls.level].push({
      ...cls,
      studentCount: getStudentsByClass(cls.id).length,
    });
    return acc;
  }, {} as Record<string, Array<typeof CLASS_LIST_DETAILED[0] & { studentCount: number }>>);

  return (
    <MainLayout title="Classes" subtitle="Manage all school classes and levels">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {CLASS_LIST_DETAILED.length} Classes
            </Badge>
            <Badge variant="outline" className="text-sm">
              5 Levels
            </Badge>
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* Classes by Level */}
        {Object.entries(groupedClasses).map(([level, classes]) => (
          <div key={level} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{levelIcons[level]}</span>
              <h2 className="text-xl font-semibold text-foreground">{level}</h2>
              <Badge variant="outline" className={levelColors[level]}>
                {classes.length} {classes.length === 1 ? 'class' : 'classes'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  to={`/students?class=${cls.id}`}
                  className="group bg-card rounded-xl border border-border/50 p-5 shadow-sm card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="font-semibold text-lg text-foreground mb-1">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{level}</p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {cls.studentCount} {cls.studentCount === 1 ? 'student' : 'students'}
                    </span>
                  </div>

                  {cls.studentCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(4, cls.studentCount) }).map((_, i) => (
                          <div
                            key={i}
                            className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center"
                          >
                            <span className="text-xs text-muted-foreground">{i + 1}</span>
                          </div>
                        ))}
                        {cls.studentCount > 4 && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">+{cls.studentCount - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AddClassDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
      />
    </MainLayout>
  );
}
