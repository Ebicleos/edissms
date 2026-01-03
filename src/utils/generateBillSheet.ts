import { SchoolSettings } from '@/hooks/useSchoolSettings';

interface FeeRecord {
  student_name: string;
  admission_number: string;
  class_id: string;
  amount_payable: number;
  amount_paid: number;
  balance: number;
  status: string;
  term: string;
  academic_year: string;
}

export function generateBillSheet(
  feeRecords: FeeRecord[],
  schoolSettings: SchoolSettings,
  filters?: {
    className?: string;
    term?: string;
    status?: string;
  }
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalExpected = feeRecords.reduce((sum, r) => sum + Number(r.amount_payable), 0);
  const totalCollected = feeRecords.reduce((sum, r) => sum + Number(r.amount_paid), 0);
  const totalBalance = feeRecords.reduce((sum, r) => sum + Number(r.balance), 0);

  const generatedDate = new Date().toLocaleDateString();
  const generatedTime = new Date().toLocaleTimeString();

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill Sheet - ${schoolSettings.school_name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: #fff;
          color: #333;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #1e40af;
        }
        .header h1 {
          color: #1e40af;
          font-size: 22px;
          margin-bottom: 5px;
        }
        .header p {
          color: #666;
        }
        .meta-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
        }
        .meta-info div {
          font-size: 11px;
        }
        .summary-cards {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .summary-card {
          flex: 1;
          background: #f0f9ff;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #bfdbfe;
        }
        .summary-card.collected {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .summary-card.balance {
          background: #fef2f2;
          border-color: #fecaca;
        }
        .summary-card h3 {
          font-size: 18px;
          color: #1e40af;
        }
        .summary-card.collected h3 { color: #16a34a; }
        .summary-card.balance h3 { color: #dc2626; }
        .summary-card p {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          text-align: left;
        }
        th {
          background: #1e40af;
          color: white;
          font-weight: 600;
          font-size: 11px;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        tr:hover {
          background: #f0f9ff;
        }
        .status-paid {
          background: #dcfce7;
          color: #166534;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
        }
        .status-partial {
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
        }
        .status-unpaid {
          background: #fee2e2;
          color: #991b1b;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
        }
        .amount-positive { color: #16a34a; font-weight: 600; }
        .amount-negative { color: #dc2626; font-weight: 600; }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          font-size: 10px;
          color: #666;
        }
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          text-align: center;
          width: 30%;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 10px;
        }
        @media print {
          body { padding: 10px; font-size: 10px; }
          th, td { padding: 6px 8px; }
          .summary-card h3 { font-size: 14px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${schoolSettings.school_name}</h1>
        <p>${schoolSettings.motto || 'Excellence in Education'}</p>
        <h2 style="margin-top: 10px; color: #333;">FEE COLLECTION BILL SHEET</h2>
      </div>

      <div class="meta-info">
        <div>
          <strong>Generated:</strong> ${generatedDate} at ${generatedTime}
        </div>
        <div>
          <strong>Academic Year:</strong> ${schoolSettings.academic_year}
        </div>
        <div>
          <strong>Term:</strong> ${schoolSettings.term}
        </div>
        <div>
          <strong>Total Students:</strong> ${feeRecords.length}
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <h3>${formatCurrency(totalExpected)}</h3>
          <p>Total Expected</p>
        </div>
        <div class="summary-card collected">
          <h3>${formatCurrency(totalCollected)}</h3>
          <p>Total Collected</p>
        </div>
        <div class="summary-card balance">
          <h3>${formatCurrency(totalBalance)}</h3>
          <p>Outstanding Balance</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>S/N</th>
            <th>Student Name</th>
            <th>Adm. No.</th>
            <th>Class</th>
            <th>Amount Payable</th>
            <th>Amount Paid</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${feeRecords.map((record, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${record.student_name}</td>
              <td>${record.admission_number}</td>
              <td>${record.class_id}</td>
              <td>${formatCurrency(record.amount_payable)}</td>
              <td class="amount-positive">${formatCurrency(record.amount_paid)}</td>
              <td class="${record.balance > 0 ? 'amount-negative' : ''}">${formatCurrency(record.balance)}</td>
              <td>
                <span class="status-${record.status}">${record.status.toUpperCase()}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f1f5f9;">
            <td colspan="4" style="text-align: right;">TOTAL:</td>
            <td>${formatCurrency(totalExpected)}</td>
            <td class="amount-positive">${formatCurrency(totalCollected)}</td>
            <td class="amount-negative">${formatCurrency(totalBalance)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Prepared By</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Accounts Officer</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Principal</div>
        </div>
      </div>

      <div class="footer">
        <p>${schoolSettings.school_name} - ${schoolSettings.address || ''}</p>
        <p>${schoolSettings.phone ? `Tel: ${schoolSettings.phone}` : ''} ${schoolSettings.email ? `| Email: ${schoolSettings.email}` : ''}</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}
