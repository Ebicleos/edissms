import { MainLayout } from '@/components/layout/MainLayout';
import { BulkReportCardGenerator } from '@/components/reports/BulkReportCardGenerator';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';

export default function ReportCards() {
  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <PageGradientHeader emoji="🏆" title="Report Cards" subtitle="Generate and manage student report cards" gradient="from-amber-500/10 via-orange-500/5 to-rose-500/5" />
        <BulkReportCardGenerator />
      </div>
    </MainLayout>
  );
}
