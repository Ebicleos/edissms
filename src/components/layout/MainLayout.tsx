import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { MobileSidebar } from './MobileSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <SubscriptionBanner />
        <Header 
          title={title || ''} 
          subtitle={subtitle} 
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main 
          className={cn(
            "flex-1 p-3 sm:p-4 md:p-6",
            // Bottom padding for mobile nav + safe area
            "pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6",
            // Touch-friendly scrolling
            "touch-scroll"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
