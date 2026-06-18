import { ReportCardData } from '@/hooks/useReportCards';
import { useSignedPhotoUrl } from '@/hooks/useSignedPhotoUrl';
import type { TemplateSchoolSettings } from '../ReportCardTemplate';

interface Props {
  data: ReportCardData;
  schoolSettings: TemplateSchoolSettings;
  showAnnualSummary?: boolean;
}

export function ModernTemplate({ data, schoolSettings, showAnnualSummary = true }: Props) {
  const totalScore = data.grades.reduce((sum, g) => sum + g.totalScore, 0);
  const { signedUrl: studentPhotoUrl } = useSignedPhotoUrl(data.photoUrl || null);

  return (
    <div
      className="bg-white text-slate-900 p-8 max-w-[820px] mx-auto print:p-6 print:max-w-full"
      style={{ fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif' }}
    >
      {/* Header bar */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white p-6 mb-6 flex items-center gap-5">
        {schoolSettings.logoUrl && (
          <img src={schoolSettings.logoUrl} alt="School Logo" className="w-20 h-20 object-contain rounded-xl bg-white/95 p-1.5" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {schoolSettings.schoolName || 'School Name'}
          </h1>
          <p className="text-sm opacity-90 italic">{schoolSettings.motto || 'Motto'}</p>
          {schoolSettings.tagline && <p className="text-xs opacity-80 mt-1">{schoolSettings.tagline}</p>}
          <p className="text-xs opacity-80 mt-1">{schoolSettings.address}</p>
          <p className="text-xs opacity-80">{schoolSettings.phone} · {schoolSettings.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold uppercase tracking-widest text-indigo-700">
          {schoolSettings.reportTitle || 'Student Termly Report Card'}
        </h2>
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold uppercase">
          {data.term} Term · {data.academicYear}
        </span>
      </div>

      {/* Student card */}
      <div className="flex gap-5 mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex-shrink-0">
          {studentPhotoUrl ? (
            <img src={studentPhotoUrl} alt={data.studentName} className="w-[90px] h-[90px] object-cover rounded-lg ring-2 ring-indigo-200" />
          ) : (
            <div className="w-[90px] h-[90px] rounded-lg bg-white ring-2 ring-indigo-200 flex items-center justify-center text-slate-400 text-xs">Photo</div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label="Student Name" value={data.studentName} />
          <Field label="Admission No." value={data.admissionNumber} />
          <Field label="Class" value={data.className} />
          <Field label="Gender" value={data.gender} />
          <Field label="Position" value={`${data.classPosition} / ${data.totalStudents}`} />
          <Field label="Average" value={data.averageScore.toFixed(2)} />
          <Field label="Attendance" value={`${data.attendancePresent} / ${data.attendanceTotal}`} />
          <Field label="Next Term" value={schoolSettings.nextTermBegins || data.nextTermBegins || 'TBA'} />
        </div>
      </div>

      {/* Grades */}
      <div className="rounded-xl overflow-hidden border border-slate-200 mb-6">
        <table className="w-full text-sm">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="p-3 text-left font-semibold">Subject</th>
              <th className="p-3 text-center font-semibold">C/A</th>
              <th className="p-3 text-center font-semibold">Exam</th>
              <th className="p-3 text-center font-semibold">Total</th>
              <th className="p-3 text-center font-semibold">Grade</th>
              <th className="p-3 text-center font-semibold">Pos.</th>
              <th className="p-3 text-left font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.grades.map((g, i) => (
              <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                <td className="p-3 font-medium">{g.subjectName}</td>
                <td className="p-3 text-center">{g.caScore}</td>
                <td className="p-3 text-center">{g.examScore}</td>
                <td className="p-3 text-center font-bold text-indigo-700">{g.totalScore}</td>
                <td className="p-3 text-center font-bold">{g.grade}</td>
                <td className="p-3 text-center">{g.subjectPosition}</td>
                <td className="p-3 text-slate-600">{g.remarks}</td>
              </tr>
            ))}
            <tr className="bg-indigo-50 font-bold">
              <td className="p-3">Total</td>
              <td className="p-3 text-center" colSpan={2}>—</td>
              <td className="p-3 text-center text-indigo-700">{totalScore}</td>
              <td className="p-3 text-center" colSpan={3}>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Attitude', value: data.attitude },
          { label: 'Interest', value: data.interest },
          { label: 'Conduct', value: data.conduct },
        ].map((b) => (
          <div key={b.label} className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-slate-500">{b.label}</div>
            <div className="font-semibold uppercase">{b.value || '-'}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6 text-sm">
        <Remark title="Class Teacher" body={data.teacherRemarks} />
        <Remark title="Head Teacher" body={data.principalRemarks} />
      </div>

      {data.promotionStatus && (
        <div className="text-center font-bold mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800">
          STATUS: {data.promotionStatus}
        </div>
      )}

      {showAnnualSummary && data.termSummary && data.termSummary.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-2 text-indigo-700 uppercase text-sm tracking-wider">Annual Summary</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left"></th>
                  {data.termSummary.map((t, i) => <th key={i} className="p-2 uppercase">{t.term}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-2 font-semibold">Total Score</td>{data.termSummary.map((t, i) => <td key={i} className="p-2 text-center">{t.totalScore}</td>)}</tr>
                <tr className="bg-slate-50"><td className="p-2 font-semibold">Average</td>{data.termSummary.map((t, i) => <td key={i} className="p-2 text-center">{t.average.toFixed(2)}</td>)}</tr>
                <tr><td className="p-2 font-semibold">Position</td>{data.termSummary.map((t, i) => <td key={i} className="p-2 text-center">{t.position}</td>)}</tr>
              </tbody>
            </table>
          </div>
          {schoolSettings.footerNote && (
            <p className="text-xs italic mt-2 text-center text-slate-500">{schoolSettings.footerNote}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-12 mt-10 text-sm">
        <SignatureBlock url={schoolSettings.teacherSignatureUrl} label="Class Teacher's Signature" />
        <SignatureBlock
          url={schoolSettings.principalSignatureUrl}
          label={schoolSettings.principalName ? `${schoolSettings.principalName}'s Signature` : "Proprietor's Signature"}
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="font-semibold uppercase">{value}</span>
    </div>
  );
}

function Remark({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs uppercase tracking-wider text-slate-500">{title}'s Remarks</div>
      <div className="mt-1 uppercase">{body || '-'}</div>
    </div>
  );
}

function SignatureBlock({ url, label }: { url?: string; label: string }) {
  return (
    <div className="text-center">
      {url && <img src={url} alt={label} className="h-[50px] w-auto mx-auto mb-1 object-contain" />}
      <div className="border-t border-slate-400 pt-1">{label}</div>
    </div>
  );
}
