import { ReportCardData } from '@/hooks/useReportCards';

interface ReportCardTemplateProps {
  data: ReportCardData;
  schoolSettings: {
    schoolName: string;
    motto: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    principalName?: string;
    closingDate?: string;
    nextTermBegins?: string;
  };
  showAnnualSummary?: boolean;
}

export function ReportCardTemplate({ 
  data, 
  schoolSettings,
  showAnnualSummary = true 
}: ReportCardTemplateProps) {
  // Calculate totals
  const totalCa = data.grades.reduce((sum, g) => sum + g.caScore, 0);
  const totalExam = data.grades.reduce((sum, g) => sum + g.examScore, 0);
  const totalScore = data.grades.reduce((sum, g) => sum + g.totalScore, 0);

  return (
    <div className="bg-white text-black p-6 max-w-[800px] mx-auto print:p-4 print:max-w-full" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          {schoolSettings.logoUrl && (
            <img 
              src={schoolSettings.logoUrl} 
              alt="School Logo" 
              className="w-16 h-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {schoolSettings.schoolName || 'School Name'}
            </h1>
            <p className="text-sm italic">{schoolSettings.motto || 'Motto'}</p>
          </div>
        </div>
        <p className="text-sm">{schoolSettings.address}</p>
        <p className="text-sm">Contact: {schoolSettings.phone}; {schoolSettings.email}</p>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-center mb-4 underline">
        STUDENT TERMLY REPORT CARD
      </h2>

      {/* Student Info Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-4 border border-black p-3">
        <div className="flex">
          <span className="font-semibold w-32">Student Name:</span>
          <span className="uppercase">{data.studentName}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-36">Next term begins:</span>
          <span>{schoolSettings.nextTermBegins || data.nextTermBegins || 'TBA'}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">Admission No.:</span>
          <span>{data.admissionNumber}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-36">Attendance:</span>
          <span>{data.attendancePresent} out of {data.attendanceTotal}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">Class/Form:</span>
          <span className="uppercase">{data.className}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-36">Number in Class:</span>
          <span>{data.totalStudents}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">Gender:</span>
          <span className="uppercase">{data.gender}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-36">Position in Class:</span>
          <span>{data.classPosition}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">Term:</span>
          <span className="uppercase">{data.term} TERM</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-36">Average Score:</span>
          <span>{data.averageScore.toFixed(2)}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">Closing Date:</span>
          <span>{schoolSettings.closingDate || data.closingDate || ''}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-32">Academic Year:</span>
          <span>{data.academicYear}</span>
        </div>
      </div>

      {/* Grades Table */}
      <table className="w-full border-collapse border border-black text-sm mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black p-2 text-left">Subjects</th>
            <th className="border border-black p-2 text-center w-12">C/A</th>
            <th className="border border-black p-2 text-center w-12">Exam</th>
            <th className="border border-black p-2 text-center w-12">Total</th>
            <th className="border border-black p-2 text-center w-12">Grade</th>
            <th className="border border-black p-2 text-center w-16">Subject Position</th>
            <th className="border border-black p-2 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.grades.map((grade, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-black p-2">{grade.subjectName}</td>
              <td className="border border-black p-2 text-center">{grade.caScore}</td>
              <td className="border border-black p-2 text-center">{grade.examScore}</td>
              <td className="border border-black p-2 text-center font-semibold">{grade.totalScore}</td>
              <td className="border border-black p-2 text-center font-semibold">{grade.grade}</td>
              <td className="border border-black p-2 text-center">{grade.subjectPosition}</td>
              <td className="border border-black p-2">{grade.remarks}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="bg-gray-300 font-bold">
            <td className="border border-black p-2">Total</td>
            <td className="border border-black p-2 text-center">{totalCa}</td>
            <td className="border border-black p-2 text-center">{totalExam}</td>
            <td className="border border-black p-2 text-center">{totalScore}</td>
            <td className="border border-black p-2 text-center">-</td>
            <td className="border border-black p-2 text-center">-</td>
            <td className="border border-black p-2">-</td>
          </tr>
        </tbody>
      </table>

      {/* Attitude, Interest, Conduct */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex">
          <span className="font-semibold">Attitude:</span>
          <span className="ml-2 uppercase">{data.attitude || '-'}</span>
        </div>
        <div className="flex">
          <span className="font-semibold">Interest:</span>
          <span className="ml-2 uppercase">{data.interest || '-'}</span>
        </div>
        <div className="flex">
          <span className="font-semibold">Conduct:</span>
          <span className="ml-2 uppercase">{data.conduct || '-'}</span>
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="border border-black p-2">
          <span className="font-semibold">Class Teacher's Remarks:</span>
          <span className="ml-2 uppercase">{data.teacherRemarks || '-'}</span>
        </div>
        <div className="border border-black p-2">
          <span className="font-semibold">Head Teacher's Remarks:</span>
          <span className="ml-2 uppercase">{data.principalRemarks || '-'}</span>
        </div>
      </div>

      {/* Promotion Status */}
      {data.promotionStatus && (
        <div className="text-center font-bold text-lg mb-4 p-2 bg-green-100 border-2 border-green-500 rounded">
          STATUS: {data.promotionStatus}
        </div>
      )}

      {/* Annual Summary */}
      {showAnnualSummary && data.termSummary && data.termSummary.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-center mb-2 underline">STUDENT'S ANNUAL REPORT SUMMARY</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2"></th>
                {data.termSummary.map((term, i) => (
                  <th key={i} className="border border-black p-2">{term.term.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-semibold">TOTAL SCORE</td>
                {data.termSummary.map((term, i) => (
                  <td key={i} className="border border-black p-2 text-center">{term.totalScore}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold">AVERAGE</td>
                {data.termSummary.map((term, i) => (
                  <td key={i} className="border border-black p-2 text-center">{term.average.toFixed(2)}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold">CLASS POSITION</td>
                {data.termSummary.map((term, i) => (
                  <td key={i} className="border border-black p-2 text-center">{term.position}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="text-xs italic mt-1 text-center">
            NB: DO NOT JUDGE YOUR CHILD/CHILDREN PERFORMANCE BASED ON POSITION BUT ON AVERAGE
          </p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
        <div className="text-center">
          <div className="border-t border-black pt-1 mx-8">
            Class Teacher's Signature
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-1 mx-8">
            {schoolSettings.principalName ? `${schoolSettings.principalName}'s Signature` : "Proprietor's Signature"}
          </div>
        </div>
      </div>
    </div>
  );
}
