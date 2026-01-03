import { SchoolSettings } from '@/hooks/useSchoolSettings';

interface ReceiptData {
  studentName: string;
  admissionNumber: string;
  className: string;
  guardianName?: string;
  phoneContact?: string;
  amountPaid: number;
  totalFee: number;
  balance: number;
  term: string;
  academicYear: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export function printReceipt(data: ReceiptData, schoolSettings: SchoolSettings) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const receiptDate = data.paymentDate ? new Date(data.paymentDate).toLocaleDateString() : new Date().toLocaleDateString();
  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt - ${data.studentName}</title>
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
        }
        .receipt {
          max-width: 400px;
          margin: 0 auto;
          border: 2px solid #1e40af;
          padding: 20px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #ccc;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .header h1 {
          color: #1e40af;
          font-size: 20px;
          margin-bottom: 5px;
        }
        .header p {
          color: #666;
          font-size: 12px;
        }
        .receipt-number {
          background: #f0f9ff;
          padding: 8px;
          border-radius: 4px;
          text-align: center;
          margin-bottom: 15px;
          font-size: 12px;
        }
        .receipt-number strong {
          color: #1e40af;
        }
        .section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13px;
        }
        .row .label {
          color: #666;
        }
        .row .value {
          font-weight: 500;
        }
        .amount-section {
          background: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          margin-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          border-top: 2px solid #1e40af;
          padding-top: 10px;
          margin-top: 10px;
        }
        .balance {
          color: ${data.balance > 0 ? '#dc2626' : '#16a34a'};
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px dashed #ccc;
          font-size: 11px;
          color: #666;
        }
        .signature-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          text-align: center;
          width: 45%;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 30px;
          padding-top: 5px;
          font-size: 11px;
        }
        @media print {
          body { padding: 0; }
          .receipt { border: 1px solid #333; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>${schoolSettings.school_name}</h1>
          <p>${schoolSettings.motto || 'Excellence in Education'}</p>
          ${schoolSettings.address ? `<p>${schoolSettings.address}</p>` : ''}
          ${schoolSettings.phone ? `<p>Tel: ${schoolSettings.phone}</p>` : ''}
        </div>
        
        <div class="receipt-number">
          <strong>PAYMENT RECEIPT</strong><br/>
          Receipt No: ${receiptNumber} | Date: ${receiptDate}
        </div>

        <div class="section">
          <div class="section-title">Student Information</div>
          <div class="row">
            <span class="label">Name:</span>
            <span class="value">${data.studentName}</span>
          </div>
          <div class="row">
            <span class="label">Admission No:</span>
            <span class="value">${data.admissionNumber}</span>
          </div>
          <div class="row">
            <span class="label">Class:</span>
            <span class="value">${data.className}</span>
          </div>
          ${data.guardianName ? `
          <div class="row">
            <span class="label">Guardian:</span>
            <span class="value">${data.guardianName}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="row">
            <span class="label">Academic Year:</span>
            <span class="value">${data.academicYear}</span>
          </div>
          <div class="row">
            <span class="label">Term:</span>
            <span class="value">${data.term}</span>
          </div>
          ${data.paymentMethod ? `
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${data.paymentMethod}</span>
          </div>
          ` : ''}
          ${data.transactionRef ? `
          <div class="row">
            <span class="label">Transaction Ref:</span>
            <span class="value">${data.transactionRef}</span>
          </div>
          ` : ''}
        </div>

        <div class="amount-section">
          <div class="row">
            <span class="label">Total Fee:</span>
            <span class="value">${formatCurrency(data.totalFee)}</span>
          </div>
          <div class="row">
            <span class="label">Amount Paid:</span>
            <span class="value" style="color: #16a34a;">${formatCurrency(data.amountPaid)}</span>
          </div>
          <div class="total-row">
            <span>Balance:</span>
            <span class="balance">${formatCurrency(data.balance)}</span>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Received By</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">School Stamp</div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>This is a computer-generated receipt.</p>
          ${schoolSettings.email ? `<p>Email: ${schoolSettings.email}</p>` : ''}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}
