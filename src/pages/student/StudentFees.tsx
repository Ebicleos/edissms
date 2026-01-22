import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, Loader2, CheckCircle, AlertCircle, Clock, Printer, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/printReceipt';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { formatClassName } from '@/lib/formatClassName';

interface FeePayment {
  id: string;
  amount_payable: number;
  amount_paid: number;
  balance: number;
  status: string;
  term: string;
  academic_year: string;
  installment: string;
  last_payment_date: string | null;
  class_id: string;
}

export default function StudentFees() {
  const { user, profile } = useAuth();
  const { studentRecord, studentId, isLoading: studentLoading } = useStudentRecord();
  // Pass student's school_id to get correct school settings
  const { settings: schoolSettings } = useSchoolSettings(studentRecord?.school_id);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchFeePayments();
      
      // Check for payment callback
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const trxref = urlParams.get('trxref');
      
      if (reference || trxref) {
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
        toast.success('Payment received!', {
          description: 'Your payment is being processed. Please refresh in a moment to see the updated balance.',
        });
        // Refetch after a delay to allow webhook processing
        setTimeout(() => fetchFeePayments(), 3000);
      }
    } else if (!studentLoading) {
      setIsLoading(false);
    }
  }, [studentId, studentLoading]);

  const fetchFeePayments = async () => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', studentId)
        .order('academic_year', { ascending: false })
        .order('term', { ascending: false });

      if (error) {
        console.error('Fee payments fetch error:', error);
        setLoadError('Unable to load fee records. Please contact the school admin.');
        throw error;
      }
      setFeePayments(data || []);
    } catch (error) {
      console.error('Error fetching fee payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchFeePayments();
      toast.success('Fee records refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

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
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Unpaid</Badge>;
    }
  };

  const handlePayFees = async (feePayment: FeePayment) => {
    if (feePayment.balance <= 0) {
      toast.info('This fee is already fully paid');
      return;
    }

    setPayingFeeId(feePayment.id);

    try {
      // Generate a unique reference
      const reference = `FEE-${feePayment.id.slice(0, 8)}-${Date.now()}`;

      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user?.id)
        .single();

      if (!profile?.email) {
        toast.error('Unable to get your email address');
        return;
      }

      // Initialize Paystack payment
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          email: profile.email,
          amount: feePayment.balance,
          reference,
          metadata: {
            fee_payment_id: feePayment.id,
            student_id: user?.id,
            student_name: profile.full_name,
            callback_url: window.location.origin + '/student/fees',
          },
        },
      });

      if (error) throw error;

      if (data?.success && data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data?.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setPayingFeeId(null);
    }
  };

  const handleDownloadReceipt = (feePayment: FeePayment) => {
    if (feePayment.status === 'unpaid') {
      toast.error('No payment has been made yet');
      return;
    }

    if (!schoolSettings || !profile) {
      toast.error('Unable to generate receipt. Missing data.');
      return;
    }

    // Format class name properly
    const formattedClassName = feePayment.class_id 
      ? formatClassName(feePayment.class_id) 
      : 'N/A';

    printReceipt({
      studentName: studentRecord?.full_name || profile?.full_name || 'Student',
      admissionNumber: studentRecord?.admission_number || 'N/A',
      className: formattedClassName,
      amountPaid: Number(feePayment.amount_paid),
      totalFee: Number(feePayment.amount_payable),
      balance: Number(feePayment.balance),
      term: feePayment.term,
      academicYear: feePayment.academic_year,
      paymentDate: feePayment.last_payment_date || new Date().toLocaleDateString(),
      paymentMethod: 'Online Payment',
    }, schoolSettings);

    toast.success('Receipt generated and sent to print');
  };

  // Calculate totals
  const totalPayable = feePayments.reduce((sum, fp) => sum + Number(fp.amount_payable), 0);
  const totalPaid = feePayments.reduce((sum, fp) => sum + Number(fp.amount_paid), 0);
  const totalBalance = feePayments.reduce((sum, fp) => sum + Number(fp.balance), 0);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">School Fees</h1>
            <p className="text-muted-foreground">View and pay your school fees online</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Error State */}
        {loadError && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{loadError}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payable</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalPayable)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-2xl text-green-600">{formatCurrency(totalPaid)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding Balance</CardDescription>
              <CardTitle className="text-2xl text-destructive">{formatCurrency(totalBalance)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Fee Records */}
        {feePayments.length === 0 && !loadError ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fee records found</p>
              <p className="text-sm mt-2">If you believe this is an error, please contact the school administration.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feePayments.map((fee) => (
              <Card key={fee.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{fee.term}</h3>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{fee.academic_year}</span>
                        {getStatusBadge(fee.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fee.installment}
                      </p>
                      {fee.last_payment_date && (
                        <p className="text-xs text-muted-foreground">
                          Last payment: {new Date(fee.last_payment_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Payable</p>
                          <p className="font-semibold">{formatCurrency(Number(fee.amount_payable))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-semibold text-green-600">{formatCurrency(Number(fee.amount_paid))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="font-semibold text-destructive">{formatCurrency(Number(fee.balance))}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {fee.status !== 'paid' && (
                          <Button 
                            onClick={() => handlePayFees(fee)}
                            disabled={payingFeeId === fee.id}
                          >
                            {payingFeeId === fee.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CreditCard className="h-4 w-4 mr-2" />
                            )}
                            Pay Now
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={() => handleDownloadReceipt(fee)}
                          disabled={fee.status === 'unpaid'}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
