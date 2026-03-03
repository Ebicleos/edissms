import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, CreditCard, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { EmojiStatCard } from '@/components/dashboard/EmojiStatCard';
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
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Card */}
        <WelcomeCard
          name={profile?.full_name || 'Super Admin'}
          role="Super Admin"
          subtitle="Platform Overview"
          emoji="🛡️"
          variant="purple"
        />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => navigate('/superadmin/schools')} 
            className="bg-gradient-to-r from-[hsl(270,85%,55%)] to-[hsl(300,75%,50%)] hover:from-[hsl(270,85%,50%)] hover:to-[hsl(300,75%,45%)] text-white shadow-lg gap-2"
          >
            <Building2 className="h-4 w-4" />
            Manage Schools
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/superadmin/subscriptions')}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Subscriptions
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <EmojiStatCard emoji="🏫" value={stats.totalSchools} label="Total Schools" variant="blue" />
          <EmojiStatCard emoji="✅" value={stats.activeSubscriptions} label="Active Subs" variant="green" />
          <EmojiStatCard emoji="🧪" value={stats.trialSchools} label="Trial Schools" variant="purple" />
          <EmojiStatCard emoji="⚠️" value={stats.expiringSubscriptions} label="Expiring Soon" variant="orange" />
          <EmojiStatCard 
            emoji="💰" 
            value={`₦${stats.totalRevenue.toLocaleString()}`} 
            label="Total Revenue" 
            variant="cyan" 
          />
        </div>

        {/* Recent Schools */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/30 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  🏢 Recent Schools
                </CardTitle>
                <CardDescription>Latest registered schools</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/superadmin/schools')}
                className="gap-1 text-xs"
              >
                View All <ChevronRight className="h-3 w-3" />
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(270,85%,60%/0.15)] to-[hsl(230,85%,55%/0.1)] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏫</span>
                </div>
                <p className="text-muted-foreground font-medium">No schools registered yet</p>
                <Button className="mt-4 gap-2" onClick={() => navigate('/superadmin/schools')}>
                  <Plus className="h-4 w-4" />
                  Add First School
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSchools.map((school) => (
                  <div 
                    key={school.id} 
                    className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-[hsl(270,85%,55%/0.15)] to-[hsl(230,85%,55%/0.1)] flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-sm text-[hsl(270,80%,50%)]">
                          {school.initials || school.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{school.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{school.email || 'No email'}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={school.is_active ? 'default' : 'secondary'}
                      className={school.is_active 
                        ? 'bg-[hsl(155,75%,45%/0.15)] text-[hsl(155,75%,35%)] border-[hsl(155,75%,45%/0.3)]' 
                        : ''
                      }
                    >
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
