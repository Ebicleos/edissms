import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Plus, Search, Mail, Phone, BookOpen, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const teachers = [
  {
    id: '1',
    fullName: 'Mrs. Adaobi Nwankwo',
    email: 'adaobi.nwankwo@school.edu',
    phone: '+234 801 234 5678',
    subject: 'Mathematics',
    classes: ['Primary 5', 'Primary 6'],
    avatar: 'AN',
  },
  {
    id: '2',
    fullName: 'Mr. Chukwuemeka Obi',
    email: 'chukwuemeka.obi@school.edu',
    phone: '+234 802 345 6789',
    subject: 'English Language',
    classes: ['JSS 1', 'JSS 2', 'JSS 3'],
    avatar: 'CO',
  },
  {
    id: '3',
    fullName: 'Mrs. Fatima Bello',
    email: 'fatima.bello@school.edu',
    phone: '+234 803 456 7890',
    subject: 'Science',
    classes: ['Nursery 2', 'Nursery 3'],
    avatar: 'FB',
  },
  {
    id: '4',
    fullName: 'Mr. Emmanuel Adekunle',
    email: 'emmanuel.adekunle@school.edu',
    phone: '+234 804 567 8901',
    subject: 'Physics',
    classes: ['SSS 1', 'SSS 2', 'SSS 3'],
    avatar: 'EA',
  },
  {
    id: '5',
    fullName: 'Mrs. Grace Okoro',
    email: 'grace.okoro@school.edu',
    phone: '+234 805 678 9012',
    subject: 'Biology',
    classes: ['SSS 1', 'SSS 2'],
    avatar: 'GO',
  },
  {
    id: '6',
    fullName: 'Mr. Ibrahim Mohammed',
    email: 'ibrahim.mohammed@school.edu',
    phone: '+234 806 789 0123',
    subject: 'Chemistry',
    classes: ['SSS 2', 'SSS 3'],
    avatar: 'IM',
  },
];

export default function Teachers() {
  const [search, setSearch] = useState('');

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.fullName.toLowerCase().includes(search.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Teachers" subtitle={`${teachers.length} teaching staff`}>
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-foreground">{teacher.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{teacher.fullName}</h3>
                      <Badge variant="secondary" className="mt-1">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {teacher.subject}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem>Assign Classes</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{teacher.phone}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Assigned Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.classes.map((cls) => (
                      <Badge key={cls} variant="outline" className="text-xs">
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
