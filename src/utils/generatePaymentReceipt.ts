import { format } from 'date-fns';
import { escapeHtml } from '@/utils/sanitize';

interface ReceiptData {
  type: 'fee' | 'subscription';
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  logoUrl?: string;
  studentName?: string;
  className?: string;
  admissionNumber?: string;
  amount: number;
  reference: string;
  paymentDate: Date;
  term?: string;
  academicYear?: string;
  planType?: string;
  description?: string;
}

export const generatePaymentReceipt = (data: ReceiptData) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Generate initials safely from escaped school name
  const schoolInitials = data.schoolName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2);

  const logoHtml = data.logoUrl 
    ? `<img src="${escapeHtml(data.logoUrl)}" alt="School Logo" style="height: 80px; width: auto; object-fit: contain;" />`
    : `<div style="height: 80px; width: 80px; background: linear-gradient(135deg, #7c3aed, #a78bfa); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
        ${escapeHtml(schoolInitials)}
      </div>`;

  const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
        .receipt { max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center; }
        .logo { margin-bottom: 15px; display: flex; justify-content: center; }
        .school-name { font-size: 20px; font-weight: 700; margin-bottom: 5px; }
        .school-address { font-size: 12px; opacity: 0.9; }
        .receipt-title { margin-top: 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; }
        .body { padding: 30px; }
        .success-icon { text-align: center; margin-bottom: 20px; }
        .success-icon svg { width: 60px; height: 60px; color: #10b981; }
        .amount { text-align: center; margin-bottom: 30px; }
        .amount-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .amount-value { font-size: 36px; font-weight: 700; color: #1a1a1a; margin-top: 5px; }
        .details { border-top: 1px solid #eee; padding-top: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .detail-label { color: #666; font-size: 14px; }
        .detail-value { font-weight: 600; color: #1a1a1a; font-size: 14px; text-align: right; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; }
        .footer p { font-size: 11px; color: #888; margin-bottom: 5px; }
        .footer .date { font-size: 12px; color: #666; font-weight: 500; }
        @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">${logoHtml}</div>
          <div class="school-name">${escapeHtml(data.schoolName)}</div>
          ${data.schoolAddress ? `<div class="school-address">${escapeHtml(data.schoolAddress)}</div>` : ''}
          ${data.schoolPhone || data.schoolEmail ? `<div class="school-address">${[data.schoolPhone, data.schoolEmail].filter(Boolean).map(v => escapeHtml(v)).join(' | ')}</div>` : ''}
          <div class="receipt-title">Payment Receipt</div>
        </div>
        <div class="body">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="amount">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">${formatCurrency(data.amount)}</div>
          </div>
          <div class="details">
            ${data.type === 'fee' ? `
              <div class="detail-row">
                <span class="detail-label">Student Name</span>
                <span class="detail-value">${escapeHtml(data.studentName) || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Admission No.</span>
                <span class="detail-value">${escapeHtml(data.admissionNumber) || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Class</span>
                <span class="detail-value">${escapeHtml(data.className) || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Term</span>
                <span class="detail-value">${escapeHtml(data.term) || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Academic Year</span>
                <span class="detail-value">${escapeHtml(data.academicYear) || '-'}</span>
              </div>
            ` : `
              <div class="detail-row">
                <span class="detail-label">Plan Type</span>
                <span class="detail-value" style="text-transform: capitalize;">${escapeHtml(data.planType) || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${escapeHtml(data.description) || 'Subscription Payment'}</span>
              </div>
            `}
            <div class="detail-row">
              <span class="detail-label">Reference</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${escapeHtml(data.reference)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date</span>
              <span class="detail-value">${format(data.paymentDate, 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>
        </div>
        <div class="footer">
          <p class="date">Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
          <p>Thank you for your payment!</p>
          <p>This is a computer-generated receipt.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
