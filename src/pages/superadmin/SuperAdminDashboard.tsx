import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Users, CreditCard, TrendingUp, AlertTriangle, Plus, School, Shield, Settings, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { EmojiStatCard } from '@/components/dashboard/EmojiStatCard';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalSchools: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  totalRevenue: number;
  trialSchools: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
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
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*');

      const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trialCount = subscriptions?.filter(s => s.status === 'trial').length || 0;
      
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const expiringCount = subscriptions?.filter(s => {
        const endDate = new Date(s.end_date);
        return s.status === 'active' && endDate <= sevenDaysFromNow;
      }).length || 0;

      const totalRevenue = subscriptions?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

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

  return (
    <MainLayout>
      <div className="space-y-5 md:space-y-6 animate-fade-in">
        {/* Welcome Card */}
        <WelcomeCard
          name={profile?.full_name || 'Super Admin'}
          role="Super Admin"
          subtitle="Platform Overview"
          emoji="🛡️"
          variant="purple"
        />

        {/* Stats Grid - 2x2 on mobile, row on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <EmojiStatCard emoji="🏫" value={stats.totalSchools} label="Schools" variant="blue" />
          <EmojiStatCard emoji="✅" value={stats.activeSubscriptions} label="Active" variant="green" />
          <EmojiStatCard emoji="🆓" value={stats.trialSchools} label="Trial" variant="purple" />
          <EmojiStatCard emoji="⚠️" value={stats.expiringSubscriptions} label="Expiring" variant="orange" />
          <EmojiStatCard 
            emoji="💰" 
            value={`₦${stats.totalRevenue.toLocaleString()}`} 
            label="Revenue" 
            variant="green" 
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base md:text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <ActionCard title="Schools" icon={Building2} path="/superadmin/schools" variant="blue" compact />
            <ActionCard title="Subscriptions" icon={CreditCard} path="/superadmin/subscriptions" variant="green" compact />
            <ActionCard title="Users" icon={Users} path="/superadmin/users" variant="purple" compact />
            <ActionCard title="Audit Logs" icon={FileText} path="/superadmin/audit-logs" variant="orange" compact />
            <ActionCard title="System Settings" icon={Settings} path="/superadmin/settings" variant="cyan" compact />
            <ActionCard title="Platform Users" icon={Shield} path="/superadmin/users" variant="pink" compact />
          </div>
        </div>

        {/* Recent Schools */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/30 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">Recent Schools</CardTitle>
                <CardDescription className="text-xs md:text-sm">Latest registered schools</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/superadmin/schools')} className="text-xs md:text-sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : recentSchools.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No schools registered yet</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/superadmin/schools')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First School
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSchools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary text-sm md:text-base">{school.initials || school.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{school.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{school.email || 'No email'}</p>
                      </div>
                    </div>
                    <Badge variant={school.is_active ? 'default' : 'secondary'} className="text-xs flex-shrink-0 ml-2">
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
