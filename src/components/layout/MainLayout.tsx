import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { MobileSidebar } from './MobileSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      <div className="md:pl-64">
        <SubscriptionBanner />
        <Header 
          title={title || ''} 
          subtitle={subtitle} 
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
