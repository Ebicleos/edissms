import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Users, CreditCard, TrendingUp, AlertTriangle, Plus, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalSchools: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  totalRevenue: number;
  trialSchools: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
    totalRevenue: 0,
    trialSchools: 0,
  });
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch schools count
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*');

      const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trialCount = subscriptions?.filter(s => s.status === 'trial').length || 0;
      
      // Calculate expiring in 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const expiringCount = subscriptions?.filter(s => {
        const endDate = new Date(s.end_date);
        return s.status === 'active' && endDate <= sevenDaysFromNow;
      }).length || 0;

      // Calculate total revenue
      const totalRevenue = subscriptions?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

      // Fetch recent schools
      const { data: schools } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalSchools: schoolsCount || 0,
        activeSubscriptions: activeCount,
        expiringSubscriptions: expiringCount,
        totalRevenue,
        trialSchools: trialCount,
      });

      setRecentSchools(schools || []);
    } catch (error: any) {
      toast.error('Failed to load dashboard data', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Schools',
      value: stats.totalSchools,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Trial Schools',
      value: stats.trialSchools,
      icon: School,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringSubscriptions,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Total Revenue',
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <MainLayout title="Super Admin Dashboard" subtitle="Manage schools and subscriptions">
      <div className="space-y-6 animate-fade-in">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={() => navigate('/superadmin/schools')} className="bg-gradient-primary">
            <Building2 className="mr-2 h-4 w-4" />
            Manage Schools
          </Button>
          <Button variant="outline" onClick={() => navigate('/superadmin/subscriptions')}>
            <CreditCard className="mr-2 h-4 w-4" />
            Subscriptions
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Schools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Schools</CardTitle>
                <CardDescription>Latest registered schools</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/superadmin/schools')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : recentSchools.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No schools registered yet</p>
                <Button className="mt-4" onClick={() => navigate('/superadmin/schools')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First School
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSchools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{school.initials || school.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-muted-foreground">{school.email || 'No email'}</p>
                      </div>
                    </div>
                    <Badge variant={school.is_active ? 'default' : 'secondary'}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
