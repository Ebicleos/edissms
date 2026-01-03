import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Building2, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  initials: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    initials: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
    } catch (error: any) {
      toast.error('Failed to load schools', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required');
      return;
    }

    try {
      if (editingSchool) {
        const { error } = await supabase
          .from('schools')
          .update({
            name: formData.name,
            code: formData.code,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            initials: formData.initials || null,
          })
          .eq('id', editingSchool.id);

        if (error) throw error;
        toast.success('School updated successfully');
      } else {
        const { error } = await supabase
          .from('schools')
          .insert({
            name: formData.name,
            code: formData.code,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            initials: formData.initials || null,
          });

        if (error) throw error;
        toast.success('School created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSchools();
    } catch (error: any) {
      toast.error('Failed to save school', { description: error.message });
    }
  };

  const handleToggleActive = async (school: School) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_active: !school.is_active })
        .eq('id', school.id);

      if (error) throw error;
      
      setSchools(schools.map(s => 
        s.id === school.id ? { ...s, is_active: !s.is_active } : s
      ));
      toast.success(school.is_active ? 'School deactivated' : 'School activated');
    } catch (error: any) {
      toast.error('Failed to update school', { description: error.message });
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      initials: school.initials || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (school: School) => {
    if (!confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', school.id);

      if (error) throw error;
      
      setSchools(schools.filter(s => s.id !== school.id));
      toast.success('School deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete school', { description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      initials: '',
    });
    setEditingSchool(null);
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout title="School Management" subtitle="Manage all registered schools">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
                <DialogDescription>
                  {editingSchool ? 'Update school information' : 'Register a new school in the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter school name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">School Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SCH001"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="school@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="School address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initials">School Initials</Label>
                  <Input
                    id="initials"
                    value={formData.initials}
                    onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase().slice(0, 4) })}
                    placeholder="e.g., SMS"
                    maxLength={4}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingSchool ? 'Update School' : 'Create School'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Schools Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No schools match your search' : 'No schools registered yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary text-sm">
                              {school.initials || school.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{school.name}</p>
                            {school.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {school.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{school.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {school.email && (
                            <p className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {school.email}
                            </p>
                          )}
                          {school.phone && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {school.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={school.is_active}
                            onCheckedChange={() => handleToggleActive(school)}
                          />
                          <Badge variant={school.is_active ? 'default' : 'secondary'}>
                            {school.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(school)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(school)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
