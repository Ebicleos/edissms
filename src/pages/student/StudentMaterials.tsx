import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Download, FileText, Search, Loader2, File, FileImage, FileVideo } from 'lucide-react';

interface LearningMaterial {
  id: string;
  title: string;
  subject: string;
  file_url: string;
  file_type: string | null;
  file_size: string | null;
  created_at: string;
}

export default function StudentMaterials() {
  const { userClass } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, [userClass]);

  const fetchMaterials = async () => {
    if (!userClass) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('learning_materials')
        .select('*')
        .eq('class_id', userClass)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load learning materials');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    if (fileType.includes('image')) return FileImage;
    if (fileType.includes('video')) return FileVideo;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const handleDownload = (material: LearningMaterial) => {
    window.open(material.file_url, '_blank');
  };

  const subjects = [...new Set(materials.map(m => m.subject))];

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  if (isLoading) {
    return (
      <MainLayout title="Learning Materials" subtitle="Access study resources and documents">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Learning Materials" subtitle="Access study resources and documents">
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedSubject === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedSubject(null)}
            >
              All
            </Badge>
            {subjects.map(subject => (
              <Badge
                key={subject}
                variant={selectedSubject === subject ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedSubject(subject)}
              >
                {subject}
              </Badge>
            ))}
          </div>
        </div>

        {/* Materials List */}
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No materials available</p>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Check back later for new materials'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map(material => {
              const FileIcon = getFileIcon(material.file_type);
              return (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{material.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {material.subject}
                          </Badge>
                          {material.file_size && (
                            <span className="text-xs">{material.file_size}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
