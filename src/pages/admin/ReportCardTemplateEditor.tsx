import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageGradientHeader } from '@/components/ui/page-gradient-header';
import { SignatureUpload } from '@/components/settings/SignatureUpload';
import { ReportCardTemplate, type ReportCardTemplateId, type TemplateSchoolSettings } from '@/components/reports/ReportCardTemplate';
import type { ReportCardData } from '@/hooks/useReportCards';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESETS: { id: ReportCardTemplateId; name: string; description: string }[] = [
  { id: 'classic', name: 'Classic', description: 'Traditional layout with bordered tables — best for printing.' },
  { id: 'modern', name: 'Modern', description: 'Card-style sections with accent colors — clean and contemporary.' },
  { id: 'compact', name: 'Compact', description: 'Tight spacing optimized to fit on a single page.' },
];

const SAMPLE_DATA: ReportCardData = {
  studentId: 'sample',
  studentName: 'Adaeze Okonkwo',
  admissionNumber: 'EDS/2024/001',
  classId: 'jss1',
  className: 'JSS 1',
  gender: 'Female',
  term: 'First',
  academicYear: '2025/2026',
  grades: [
    { subjectName: 'Mathematics', caScore: 28, examScore: 56, totalScore: 84, grade: 'A', subjectPosition: 2, remarks: 'Excellent' },
    { subjectName: 'English Language', caScore: 25, examScore: 50, totalScore: 75, grade: 'B+', subjectPosition: 4, remarks: 'Very Good' },
    { subjectName: 'Basic Science', caScore: 22, examScore: 48, totalScore: 70, grade: 'B', subjectPosition: 5, remarks: 'Good' },
    { subjectName: 'Social Studies', caScore: 24, examScore: 45, totalScore: 69, grade: 'C', subjectPosition: 6, remarks: 'Credit' },
    { subjectName: 'Civic Education', caScore: 27, examScore: 53, totalScore: 80, grade: 'A', subjectPosition: 3, remarks: 'Excellent' },
  ],
  totalMarks: 378,
  averageScore: 75.6,
  classPosition: 3,
  totalStudents: 28,
  attendancePresent: 58,
  attendanceTotal: 60,
  attitude: 'Cheerful',
  interest: 'Highly Interested',
  conduct: 'Excellent',
  teacherRemarks: 'A diligent student who continues to improve.',
  principalRemarks: 'Keep up the great work.',
  promotionStatus: 'PROMOTED',
  termSummary: [
    { term: 'first', totalScore: 378, average: 75.6, position: 3 },
    { term: 'second', totalScore: 0, average: 0, position: 0 },
    { term: 'third', totalScore: 0, average: 0, position: 0 },
  ],
};

export default function ReportCardTemplateEditor() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<ReportCardTemplateId>('classic');
  const [reportTitle, setReportTitle] = useState('STUDENT TERMLY REPORT CARD');
  const [tagline, setTagline] = useState('');
  const [footerNote, setFooterNote] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState<string | null>(null);
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState('');
  const [motto, setMotto] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.school_id]);

  const fetchSettings = async () => {
    setIsLoading(true);
    let query = supabase.from('school_settings').select('*');
    if (profile?.school_id) query = query.eq('school_id', profile.school_id);
    const { data } = await query.limit(1).maybeSingle();
    if (data) {
      const d = data as any;
      setSettingsId(d.id);
      setTemplateId((d.report_card_template_id as ReportCardTemplateId) || 'classic');
      setReportTitle(d.report_card_title || 'STUDENT TERMLY REPORT CARD');
      setFooterNote(d.report_card_footer_note || '');
      setTagline(d.report_card_tagline || '');
      setPrincipalName(d.principal_name || '');
      setClosingDate(d.closing_date || '');
      setNextTermBegins(d.next_term_begins || '');
      setTeacherSignatureUrl(d.teacher_signature_url || null);
      setPrincipalSignatureUrl(d.principal_signature_url || null);
      setSchoolName(d.school_name || '');
      setMotto(d.motto || '');
      setAddress(d.address || '');
      setPhone(d.phone || '');
      setEmail(d.email || '');
      setLogoUrl(d.logo_url || null);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settingsId) {
      toast.error('School settings not found');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('school_settings')
      .update({
        report_card_template_id: templateId,
        report_card_title: reportTitle,
        report_card_footer_note: footerNote,
        report_card_tagline: tagline,
        principal_name: principalName,
        closing_date: closingDate || null,
        next_term_begins: nextTermBegins || null,
        teacher_signature_url: teacherSignatureUrl,
        principal_signature_url: principalSignatureUrl,
      } as any)
      .eq('id', settingsId);

    setIsSaving(false);
    if (error) {
      toast.error('Failed to save template');
      return;
    }
    toast.success('Report card template saved');
  };

  const previewSettings: TemplateSchoolSettings = useMemo(() => {
    const logoPublic = logoUrl
      ? supabase.storage.from('school-logos').getPublicUrl(logoUrl).data.publicUrl
      : undefined;
    const teacherSigPublic = teacherSignatureUrl
      ? supabase.storage.from('school-signatures').getPublicUrl(teacherSignatureUrl).data.publicUrl
      : undefined;
    const principalSigPublic = principalSignatureUrl
      ? supabase.storage.from('school-signatures').getPublicUrl(principalSignatureUrl).data.publicUrl
      : undefined;
    return {
      schoolName: schoolName || 'Your School',
      motto: motto || 'Excellence in Education',
      address,
      phone,
      email,
      logoUrl: logoPublic,
      principalName,
      closingDate,
      nextTermBegins,
      teacherSignatureUrl: teacherSigPublic,
      principalSignatureUrl: principalSigPublic,
      templateId,
      reportTitle,
      footerNote,
      tagline,
    };
  }, [schoolName, motto, address, phone, email, logoUrl, principalName, closingDate, nextTermBegins, teacherSignatureUrl, principalSignatureUrl, templateId, reportTitle, footerNote, tagline]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageGradientHeader
          emoji="📄"
          title="Report Card Template"
          subtitle="Pick a design and customize what appears on every report card."
          gradient="from-indigo-500/15 to-sky-500/15"
        />


        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary hover:opacity-90">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Design Preset</CardTitle>
                <CardDescription>Choose the layout used for printed report cards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PRESETS.map((p) => {
                  const active = templateId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTemplateId(p.id)}
                      className={cn(
                        'w-full text-left rounded-lg border p-3 transition-all',
                        active ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                        </div>
                        {active && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Text shown on every report card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportTitle">Report Title</Label>
                  <Input id="reportTitle" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="tagline">Header Tagline (optional)</Label>
                  <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Affiliated to WAEC" />
                </div>
                <div>
                  <Label htmlFor="footerNote">Footer Note</Label>
                  <Textarea id="footerNote" rows={3} value={footerNote} onChange={(e) => setFooterNote(e.target.value)} />
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="principalName">Principal / Proprietor Name</Label>
                    <Input id="principalName" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="closingDate">Closing Date</Label>
                      <Input id="closingDate" type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="nextTermBegins">Next Term Begins</Label>
                      <Input id="nextTermBegins" type="date" value={nextTermBegins} onChange={(e) => setNextTermBegins(e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signatures</CardTitle>
                <CardDescription>Optional signature images (PNG with transparent background recommended).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SignatureUpload
                  label="Class Teacher's Signature"
                  currentUrl={teacherSignatureUrl}
                  onUploadComplete={(p) => setTeacherSignatureUrl(p)}
                  onRemove={() => setTeacherSignatureUrl(null)}
                />
                <SignatureUpload
                  label="Principal/Proprietor's Signature"
                  currentUrl={principalSignatureUrl}
                  onUploadComplete={(p) => setPrincipalSignatureUrl(p)}
                  onRemove={() => setPrincipalSignatureUrl(null)}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Live preview · sample student data
            </div>
            <div className="border rounded-lg bg-muted/30 p-4 overflow-auto max-h-[calc(100vh-180px)]">
              <ReportCardTemplate data={SAMPLE_DATA} schoolSettings={previewSettings} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
