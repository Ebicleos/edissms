import { ReportCardData } from '@/hooks/useReportCards';
import { useSignedPhotoUrl } from '@/hooks/useSignedPhotoUrl';
import type { TemplateSchoolSettings } from '../ReportCardTemplate';

interface Props {
  data: ReportCardData;
  schoolSettings: TemplateSchoolSettings;
  showAnnualSummary?: boolean;
}

export function CompactTemplate({ data, schoolSettings, showAnnualSummary = true }: Props) {
  const totalScore = data.grades.reduce((sum, g) => sum + g.totalScore, 0);
  const { signedUrl: studentPhotoUrl } = useSignedPhotoUrl(data.photoUrl || null);

  return (
    <div className="bg-white text-black p-4 max-w-[760px] mx-auto print:p-3 print:max-w-full" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '12px' }}>
      <div className="flex items-center gap-3 border-b border-black pb-2 mb-3">
        {schoolSettings.logoUrl && <img src={schoolSettings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />}
        <div className="flex-1">
          <h1 className="text-lg font-bold uppercase leading-tight">{schoolSettings.schoolName || 'School Name'}</h1>
          <p className="text-[11px] italic">{schoolSettings.motto}</p>
          <p className="text-[10px]">{schoolSettings.address} · {schoolSettings.phone} · {schoolSettings.email}</p>
        </div>
        {studentPhotoUrl ? (
          <img src={studentPhotoUrl} alt={data.studentName} className="w-[60px] h-[60px] object-cover border border-black" />
        ) : (
          <div className="w-[60px] h-[60px] border border-black bg-gray-100 flex items-center justify-center text-[9px] text-gray-400">Photo</div>
        )}
      </div>

      <div className="text-center font-bold uppercase mb-2 text-sm">
        {schoolSettings.reportTitle || 'Student Termly Report Card'} — {data.term} Term {data.academicYear}
      </div>

      <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-[11px] border border-black p-2 mb-3">
        <Row label="Name" value={data.studentName} />
        <Row label="Adm No" value={data.admissionNumber} />
        <Row label="Class" value={data.className} />
        <Row label="Gender" value={data.gender} />
        <Row label="Position" value={`${data.classPosition}/${data.totalStudents}`} />
        <Row label="Average" value={data.averageScore.toFixed(2)} />
        <Row label="Attendance" value={`${data.attendancePresent}/${data.attendanceTotal}`} />
        <Row label="Next Term" value={schoolSettings.nextTermBegins || data.nextTermBegins || 'TBA'} />
      </div>

      <table className="w-full border-collapse border border-black mb-3" style={{ fontSize: '11px' }}>
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-1 py-1 text-left">Subject</th>
            <th className="border border-black px-1 py-1 w-10">CA</th>
            <th className="border border-black px-1 py-1 w-10">Exam</th>
            <th className="border border-black px-1 py-1 w-10">Total</th>
            <th className="border border-black px-1 py-1 w-10">Grade</th>
            <th className="border border-black px-1 py-1 w-10">Pos</th>
            <th className="border border-black px-1 py-1 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.grades.map((g, i) => (
            <tr key={i}>
              <td className="border border-black px-1 py-0.5">{g.subjectName}</td>
              <td className="border border-black px-1 py-0.5 text-center">{g.caScore}</td>
              <td className="border border-black px-1 py-0.5 text-center">{g.examScore}</td>
              <td className="border border-black px-1 py-0.5 text-center font-semibold">{g.totalScore}</td>
              <td className="border border-black px-1 py-0.5 text-center font-semibold">{g.grade}</td>
              <td className="border border-black px-1 py-0.5 text-center">{g.subjectPosition}</td>
              <td className="border border-black px-1 py-0.5">{g.remarks}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold">
            <td className="border border-black px-1 py-0.5">Total</td>
            <td className="border border-black px-1 py-0.5 text-center" colSpan={2}>—</td>
            <td className="border border-black px-1 py-0.5 text-center">{totalScore}</td>
            <td className="border border-black px-1 py-0.5 text-center" colSpan={3}>—</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-2 mb-2 text-[11px]">
        <div><span className="font-semibold">Attitude:</span> {data.attitude || '-'}</div>
        <div><span className="font-semibold">Interest:</span> {data.interest || '-'}</div>
        <div><span className="font-semibold">Conduct:</span> {data.conduct || '-'}</div>
      </div>

      <div className="space-y-1 mb-3 text-[11px]">
        <div className="border border-black px-2 py-1"><span className="font-semibold">Class Teacher:</span> {data.teacherRemarks || '-'}</div>
        <div className="border border-black px-2 py-1"><span className="font-semibold">Head Teacher:</span> {data.principalRemarks || '-'}</div>
      </div>

      {data.promotionStatus && (
        <div className="text-center font-bold text-sm mb-3 p-1 border border-black">STATUS: {data.promotionStatus}</div>
      )}

      {showAnnualSummary && data.termSummary && data.termSummary.length > 0 && (
        <table className="w-full border-collapse border border-black mb-3" style={{ fontSize: '11px' }}>
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-1 py-0.5"></th>
              {data.termSummary.map((t, i) => <th key={i} className="border border-black px-1 py-0.5 uppercase">{t.term}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-black px-1 py-0.5 font-semibold">Total</td>{data.termSummary.map((t, i) => <td key={i} className="border border-black px-1 py-0.5 text-center">{t.totalScore}</td>)}</tr>
            <tr><td className="border border-black px-1 py-0.5 font-semibold">Average</td>{data.termSummary.map((t, i) => <td key={i} className="border border-black px-1 py-0.5 text-center">{t.average.toFixed(2)}</td>)}</tr>
            <tr><td className="border border-black px-1 py-0.5 font-semibold">Position</td>{data.termSummary.map((t, i) => <td key={i} className="border border-black px-1 py-0.5 text-center">{t.position}</td>)}</tr>
          </tbody>
        </table>
      )}

      {schoolSettings.footerNote && (
        <p className="text-[10px] italic text-center mb-3">{schoolSettings.footerNote}</p>
      )}

      <div className="grid grid-cols-2 gap-6 mt-4 text-[11px]">
        <div className="text-center">
          {schoolSettings.teacherSignatureUrl && <img src={schoolSettings.teacherSignatureUrl} alt="Teacher" className="h-[40px] mx-auto mb-1 object-contain" />}
          <div className="border-t border-black pt-1">Class Teacher</div>
        </div>
        <div className="text-center">
          {schoolSettings.principalSignatureUrl && <img src={schoolSettings.principalSignatureUrl} alt="Principal" className="h-[40px] mx-auto mb-1 object-contain" />}
          <div className="border-t border-black pt-1">
            {schoolSettings.principalName || 'Proprietor'}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-1">
      <span className="font-semibold">{label}:</span>
      <span className="uppercase truncate">{value}</span>
    </div>
  );
}
