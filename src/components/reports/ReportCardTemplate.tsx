import { ReportCardData } from '@/hooks/useReportCards';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { CompactTemplate } from './templates/CompactTemplate';

export type ReportCardTemplateId = 'classic' | 'modern' | 'compact';

export interface TemplateSchoolSettings {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  principalName?: string;
  closingDate?: string;
  nextTermBegins?: string;
  teacherSignatureUrl?: string;
  principalSignatureUrl?: string;
  templateId?: ReportCardTemplateId;
  reportTitle?: string;
  footerNote?: string;
  tagline?: string;
}

interface ReportCardTemplateProps {
  data: ReportCardData;
  schoolSettings: TemplateSchoolSettings;
  showAnnualSummary?: boolean;
}

export function ReportCardTemplate(props: ReportCardTemplateProps) {
  const id = props.schoolSettings.templateId || 'classic';
  if (id === 'modern') return <ModernTemplate {...props} />;
  if (id === 'compact') return <CompactTemplate {...props} />;
  return <ClassicTemplate {...props} />;
}
