import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, UserCog, ShieldCheck, Users, GraduationCap, Loader2, Mail, Trash2, Edit, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit } from '@/lib/auditLog';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

type AppRole = 'admin' | 'teacher' | 'student';

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
  school_id: string | null;
}

export default function UserManagement() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  
  // Dialog states
  const [sendResetEmailOpen, setSendResetEmailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('user-management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchUsers())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    
    // Fetch user roles with profiles for the same school
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, school_id');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      setIsLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at, school_id');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setIsLoading(false);
      return;
    }

    // Merge data - only include users from the same school
    const userMap = new Map(rolesData.map((r) => [r.user_id, { role: r.role, school_id: r.school_id }]));
    const mergedUsers: UserRecord[] = profilesData
      .filter((p) => {
        const roleInfo = userMap.get(p.id);
        // Include users from the same school or users without a school
        return roleInfo && (roleInfo.school_id === profile?.school_id || !roleInfo.school_id);
      })
      .map((p) => {
        const roleInfo = userMap.get(p.id);
        return {
          id: p.id,
          email: p.email || '',
          full_name: p.full_name,
          role: roleInfo?.role as AppRole,
          created_at: p.created_at || '',
          school_id: p.school_id,
        };
      });

    setUsers(mergedUsers);
    setIsLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSendResetEmail = async () => {
    if (!selectedUser || !selectedUser.email) {
      toast.error('User does not have an email address');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to send reset email', { description: error.message });
      return;
    }

    await logAudit({
      action: 'send_password_reset',
      entityType: 'user',
      entityId: selectedUser.id,
      newData: { email: selectedUser.email },
    });

    toast.success('Password reset email sent!', {
      description: `A reset link has been sent to ${selectedUser.email}`,
    });
    setSendResetEmailOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId: selectedUser.id },
    });

    setIsSubmitting(false);

    if (error || !data?.success) {
      toast.error('Failed to delete user', { description: error?.message || data?.error });
      return;
    }

    toast.success('User deleted successfully');
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName })
      .eq('id', selectedUser.id);

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to update user', { description: error.message });
      return;
    }

    await logAudit({
      action: 'update_user',
      entityType: 'user',
      entityId: selectedUser.id,
      oldData: { full_name: selectedUser.full_name },
      newData: { full_name: editName },
    });

    toast.success('User updated successfully');
    setEditDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', selectedUser.id);

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to change role', { description: error.message });
      return;
    }

    await logAudit({
      action: 'change_role',
      entityType: 'user',
      entityId: selectedUser.id,
      oldData: { role: selectedUser.role },
      newData: { role: newRole },
    });

    toast.success('Role updated successfully');
    setRoleDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const openEditDialog = (u: UserRecord) => {
    setSelectedUser(u);
    setEditName(u.full_name);
    setEditDialogOpen(true);
  };

  const openRoleDialog = (u: UserRecord) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setRoleDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive">Admin</Badge>;
      case 'teacher':
        return <Badge className="bg-info">Teacher</Badge>;
      case 'student':
        return <Badge className="bg-success">Student</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4" />;
      case 'student':
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-content">
        <PageGradientHeader emoji="🛡️" title="User Management" subtitle="Manage all system users and reset passwords" gradient="from-primary/10 via-accent/5 to-emerald-500/5" />
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldCheck className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <GraduationCap className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</p>
                <p className="text-sm text-muted-foreground">Teachers</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="student">Students</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getRoleIcon(u.role)}
                        </div>
                        <div>
                          <p className="font-medium">{u.full_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email || 'No email'}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(u)}
                          disabled={u.id === user?.id}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRoleDialog(u)}
                          disabled={u.id === user?.id}
                          title="Change role"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(u);
                            setSendResetEmailOpen(true);
                          }}
                          disabled={!u.email || u.id === user?.id}
                          title="Send reset link"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(u);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={u.id === user?.id || u.role === 'admin'}
                          title="Delete user"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Send Reset Email Confirmation */}
      <AlertDialog open={sendResetEmailOpen} onOpenChange={setSendResetEmailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Password Reset Email?</AlertDialogTitle>
            <AlertDialogDescription>
              A password reset link will be sent to <strong>{selectedUser?.email}</strong>.
              They will be able to set a new password using this link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendResetEmail} 
              disabled={isSubmitting}
              className="bg-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? 
              This action cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
