import { MainLayout } from '@/components/layout/MainLayout';
import { BulkReportCardGenerator } from '@/components/reports/BulkReportCardGenerator';

export default function ReportCards() {
  return (
    <MainLayout 
      title="Report Cards" 
      subtitle="Generate and manage student report cards"
    >
      <div className="animate-fade-in">
        <BulkReportCardGenerator />
      </div>
    </MainLayout>
  );
}
