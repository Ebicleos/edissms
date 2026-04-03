import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, CreditCard, Calendar, AlertTriangle, Check } from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';

interface Subscription {
  id: string;
  school_id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_reference: string | null;
  max_students: number;
  max_teachers: number;
  created_at: string;
  school?: {
    name: string;
    code: string;
  };
}

interface School {
  id: string;
  name: string;
  code: string;
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    school_id: '',
    plan_type: 'termly',
    amount: '',
    payment_reference: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subscriptions with school info
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch schools for the form
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name, code')
        .order('name');

      if (schoolsError) throw schoolsError;

      // Manually join school data
      const subsWithSchools = (subsData || []).map(sub => ({
        ...sub,
        school: schoolsData?.find(s => s.id === sub.school_id)
      }));

      setSubscriptions(subsWithSchools);
      setSchools(schoolsData || []);
    } catch (error: any) {
      toast.error('Failed to load data', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.school_id || !formData.plan_type || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date();
    const endDate = formData.plan_type === 'yearly' 
      ? addMonths(startDate, 12)
      : addMonths(startDate, 4); // Termly = 4 months

    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          school_id: formData.school_id,
          plan_type: formData.plan_type,
          status: 'active',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          amount: parseFloat(formData.amount),
          payment_reference: formData.payment_reference || null,
        });

      if (error) throw error;
      
      toast.success('Subscription created successfully');
      setIsDialogOpen(false);
      setFormData({ school_id: '', plan_type: 'termly', amount: '', payment_reference: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create subscription', { description: error.message });
    }
  };

  const handleUpdateStatus = async (subscription: Subscription, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscription.id);

      if (error) throw error;
      
      setSubscriptions(subscriptions.map(s => 
        s.id === subscription.id ? { ...s, status: newStatus } : s
      ));
      toast.success(`Subscription ${newStatus}`);
    } catch (error: any) {
      toast.error('Failed to update subscription', { description: error.message });
    }
  };

  const handleRenew = async (subscription: Subscription) => {
    const startDate = new Date();
    const endDate = subscription.plan_type === 'yearly' 
      ? addMonths(startDate, 12)
      : addMonths(startDate, 4);

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        })
        .eq('id', subscription.id);

      if (error) throw error;
      
      toast.success('Subscription renewed successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to renew subscription', { description: error.message });
    }
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const isExpiringSoon = new Date(endDate) <= addDays(new Date(), 7);
    
    switch (status) {
      case 'active':
        return isExpiringSoon ? (
          <Badge className="bg-orange-500">Expiring Soon</Badge>
        ) : (
          <Badge className="bg-green-500">Active</Badge>
        );
      case 'trial':
        return <Badge className="bg-purple-500">Trial</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.school?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.school?.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout title="Subscription Management" subtitle="Manage school subscriptions and billing">
      <div className="page-content">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-60"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subscription</DialogTitle>
                <DialogDescription>
                  Add a new subscription for a school
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School *</Label>
                  <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map(school => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_type">Plan Type *</Label>
                    <Select value={formData.plan_type} onValueChange={(value) => setFormData({ ...formData, plan_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="termly">Termly (4 months)</SelectItem>
                        <SelectItem value="yearly">Yearly (12 months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₦) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_reference">Payment Reference</Label>
                  <Input
                    id="payment_reference"
                    value={formData.payment_reference}
                    onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                    placeholder="Transaction ID or reference"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    Create Subscription
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' ? 'No subscriptions match your filters' : 'No subscriptions yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.school?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{sub.school?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {sub.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sub.status, sub.end_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(sub.start_date), 'MMM d, yyyy')}</span>
                          <span>→</span>
                          <span>{format(new Date(sub.end_date), 'MMM d, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        ₦{sub.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {sub.status === 'expired' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenew(sub)}
                            >
                              Renew
                            </Button>
                          )}
                          {sub.status === 'trial' && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleUpdateStatus(sub, 'active')}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Activate
                            </Button>
                          )}
                          {sub.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(sub, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
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
