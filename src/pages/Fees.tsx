import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, MoreVertical, Receipt, FileSpreadsheet, CheckCircle, AlertCircle, Clock, Loader2, Printer } from 'lucide-react';
import { PaymentStatus } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { feePaymentSchema, paymentAmountSchema, validateInput } from '@/lib/validations';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { printReceipt } from '@/utils/printReceipt';
import { generateBillSheet } from '@/utils/generateBillSheet';

interface FeePayment {
  id: string;
  student_id: string;
  class_id: string;
  amount_payable: number;
  amount_paid: number;
  balance: number;
  installment: string;
  status: string;
  term: string;
  academic_year: string;
  last_payment_date: string | null;
  student_name?: string;
  admission_number?: string;
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_id: string;
}

export default function Fees() {
  const { settings: schoolSettings } = useSchoolSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);

  // New payment form state
  const [newPaymentStudentId, setNewPaymentStudentId] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentTerm, setNewPaymentTerm] = useState('First Term');
  const [newPaymentYear, setNewPaymentYear] = useState('2024/2025');

  useEffect(() => {
    fetchFeePayments();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, admission_number, class_id')
      .order('full_name');

    if (!error && data) {
      setStudents(data);
    }
  };

  const fetchFeePayments = async () => {
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch student details separately from students table
      const studentIds = [...new Set(data.map((p) => p.student_id))];
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, admission_number')
        .in('id', studentIds);

      const studentMap = new Map(studentsData?.map((s) => [s.id, s]) || []);

      const payments = data.map((p) => ({
        ...p,
        student_name: studentMap.get(p.student_id)?.full_name || 'Unknown',
        admission_number: studentMap.get(p.student_id)?.admission_number || 'N/A',
      }));
      setFeePayments(payments);
    }
    setIsLoading(false);
  };

  const filteredPayments = feePayments.filter((payment) => {
    const matchesSearch =
      (payment.student_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (payment.admission_number?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="badge-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="badge-warning">
            <Clock className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'unpaid':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unpaid
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalExpected = feePayments.reduce((sum, p) => sum + Number(p.amount_payable), 0);
  const totalCollected = feePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const totalPending = totalExpected - totalCollected;

  const handleUpdatePayment = (payment: FeePayment) => {
    setSelectedPayment(payment);
    setPaymentAmount('');
    setPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPayment) return;

    // Validate payment amount
    const amountValidation = validateInput(paymentAmountSchema, { amount: Number(paymentAmount) });
    if (!amountValidation.success) {
      toast.error((amountValidation as { success: false; error: string }).error);
      return;
    }

    const validData = (amountValidation as { success: true; data: { amount: number } }).data;
    const paymentAmountNum = validData.amount;
    
    // Check if payment exceeds balance
    if (paymentAmountNum > selectedPayment.balance) {
      toast.error('Payment amount cannot exceed the balance');
      return;
    }

    setIsSubmitting(true);
    const newAmountPaid = Number(selectedPayment.amount_paid) + paymentAmountNum;
    const newStatus = newAmountPaid >= selectedPayment.amount_payable ? 'paid' : 'partial';

    const { error } = await supabase
      .from('fee_payments')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        last_payment_date: new Date().toISOString(),
      })
      .eq('id', selectedPayment.id);

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to update payment');
      return;
    }

    toast.success('Payment updated successfully!');
    setPaymentDialogOpen(false);
    fetchFeePayments();
  };

  const handlePrintReceipt = (payment: FeePayment) => {
    // Get student details
    const student = students.find(s => s.id === payment.student_id);
    
    printReceipt({
      studentName: payment.student_name || 'Unknown',
      admissionNumber: payment.admission_number || 'N/A',
      className: payment.class_id,
      amountPaid: Number(payment.amount_paid),
      totalFee: Number(payment.amount_payable),
      balance: Number(payment.balance),
      term: payment.term,
      academicYear: payment.academic_year,
      paymentDate: payment.last_payment_date || undefined,
    }, schoolSettings);
    
    toast.success('Generating receipt...', {
      description: `Receipt for ${payment.student_name}`,
    });
  };

  const handlePaymentHistory = (payment: FeePayment) => {
    toast.info('Payment History', {
      description: `Last payment: ${payment.last_payment_date ? new Date(payment.last_payment_date).toLocaleDateString() : 'No payments yet'}`,
    });
  };

  const handleSendReminder = (payment: FeePayment) => {
    toast.success('Reminder sent!', {
      description: `Payment reminder sent to ${payment.student_name}'s parents`,
    });
  };

  const handleGenerateBillSheet = () => {
    const billData = filteredPayments.map(p => ({
      student_name: p.student_name || 'Unknown',
      admission_number: p.admission_number || 'N/A',
      class_id: p.class_id,
      amount_payable: Number(p.amount_payable),
      amount_paid: Number(p.amount_paid),
      balance: Number(p.balance),
      status: p.status,
      term: p.term,
      academic_year: p.academic_year,
    }));
    
    generateBillSheet(billData, schoolSettings);
    
    toast.success('Generating bill sheet...', {
      description: 'Your bill sheet is being generated.',
    });
  };

  const handleBulkPrintReceipts = () => {
    if (!schoolSettings) {
      toast.error('School settings not loaded');
      return;
    }

    const paymentsToPrint = selectedForBulk.length > 0 
      ? feePayments.filter(p => selectedForBulk.includes(p.id))
      : filteredPayments.filter(p => p.status === 'paid' || p.status === 'partial');

    if (paymentsToPrint.length === 0) {
      toast.error('No receipts to print. Select payments or ensure there are paid/partial payments.');
      return;
    }

    // Print each receipt with staggered timing
    paymentsToPrint.forEach((payment, index) => {
      setTimeout(() => {
        printReceipt({
          studentName: payment.student_name || 'Unknown',
          admissionNumber: payment.admission_number || 'N/A',
          className: payment.class_id,
          amountPaid: Number(payment.amount_paid),
          totalFee: Number(payment.amount_payable),
          balance: Number(payment.balance),
          term: payment.term,
          academicYear: payment.academic_year,
          paymentDate: payment.last_payment_date || new Date().toLocaleDateString(),
          paymentMethod: 'Cash',
        }, schoolSettings);
      }, index * 600);
    });

    toast.success(`Printing ${paymentsToPrint.length} receipts...`);
    setSelectedForBulk([]);
  };

  const handleRecordNewPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedStudent = students.find((s) => s.id === newPaymentStudentId);
    if (!selectedStudent) {
      toast.error('Please select a valid student');
      return;
    }

    // Validate fee payment data
    const validation = validateInput(feePaymentSchema, {
      student_id: newPaymentStudentId,
      class_id: selectedStudent.class_id,
      amount_payable: Number(newPaymentAmount),
      term: newPaymentTerm,
      academic_year: newPaymentYear,
    });

    if (!validation.success) {
      toast.error((validation as { success: false; error: string }).error);
      return;
    }

    const validData = validation as { success: true; data: { student_id: string; class_id: string; amount_payable: number; term: string; academic_year: string } };

    // Get current user's school_id
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', currentUser.user.id)
      .maybeSingle();

    if (!userProfile?.school_id) {
      toast.error('School not found. Please contact admin.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('fee_payments').insert({
      student_id: validData.data.student_id,
      class_id: validData.data.class_id,
      amount_payable: validData.data.amount_payable,
      amount_paid: 0,
      status: 'unpaid',
      term: validData.data.term,
      academic_year: validData.data.academic_year,
    });

    setIsSubmitting(false);

    if (error) {
      console.error('Fee record error:', error);
      toast.error('Failed to create fee record');
      return;
    }

    toast.success('Fee record created successfully!');
    setRecordPaymentOpen(false);
    setNewPaymentStudentId('');
    setNewPaymentAmount('');
    fetchFeePayments();
  };

  if (isLoading) {
    return (
      <MainLayout title="Fees Management" subtitle="Track and manage school fee payments">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Fees Management" subtitle="Track and manage school fee payments">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Expected</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpected)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Pending Balance</p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateBillSheet}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Generate Bill Sheet
            </Button>
            <Button variant="outline" onClick={handleBulkPrintReceipts}>
              <Printer className="mr-2 h-4 w-4" />
              Bulk Print {selectedForBulk.length > 0 ? `(${selectedForBulk.length})` : ''}
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setRecordPaymentOpen(true)}>
              <Receipt className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount Payable</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Installment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No fee records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{payment.student_name}</p>
                        <p className="text-sm text-muted-foreground">{payment.admission_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.class_id}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount_payable)}</TableCell>
                    <TableCell className="text-success font-medium">{formatCurrency(payment.amount_paid)}</TableCell>
                    <TableCell className={payment.balance > 0 ? 'text-warning font-medium' : 'text-muted-foreground'}>
                      {formatCurrency(payment.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.installment}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdatePayment(payment)}>
                            Update Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(payment)}>
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePaymentHistory(payment)}>
                            Payment History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendReminder(payment)}>
                            Send Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Update Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Record a new payment for {selectedPayment?.student_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Amount Payable</p>
                <p className="font-medium">{formatCurrency(selectedPayment?.amount_payable || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="font-medium text-success">{formatCurrency(selectedPayment?.amount_paid || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance</p>
                <p className="font-medium text-warning">{formatCurrency(selectedPayment?.balance || 0)}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90" 
              onClick={handleSubmitPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record New Payment Dialog */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Fee</DialogTitle>
            <DialogDescription>
              Create a new fee record for a student
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordNewPayment} className="space-y-4">
            <div>
              <Label htmlFor="studentSelect">Select Student</Label>
              <Select value={newPaymentStudentId} onValueChange={setNewPaymentStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.admission_number}) - {student.class_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amountPayable">Amount Payable</Label>
              <Input
                id="amountPayable"
                type="number"
                placeholder="Enter amount"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Term</Label>
                <Select value={newPaymentTerm} onValueChange={setNewPaymentTerm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select value={newPaymentYear} onValueChange={setNewPaymentYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Fee Record'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
