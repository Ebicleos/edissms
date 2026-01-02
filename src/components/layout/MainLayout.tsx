import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        {title && <Header title={title} subtitle={subtitle} />}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
