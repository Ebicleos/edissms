import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Download, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function StudentFees() {
  const { user, userClass } = useAuth();
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeePayments();
  }, [user]);

  const fetchFeePayments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeePayments(data);
    }
    setIsLoading(false);
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
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-500">
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

  const handlePayFees = (payment: FeePayment) => {
    toast.info('Payment Gateway', {
      description: 'Online payment integration coming soon. Please visit the school bursary to make payments.',
    });
  };

  const handleDownloadReceipt = (payment: FeePayment) => {
    if (payment.status === 'unpaid') {
      toast.error('No receipt available for unpaid fees');
      return;
    }
    toast.success('Generating receipt...', {
      description: 'Your receipt will be downloaded shortly.',
    });
  };

  const totalPayable = feePayments.reduce((sum, p) => sum + Number(p.amount_payable), 0);
  const totalPaid = feePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const totalBalance = totalPayable - totalPaid;

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
        <div>
          <h1 className="text-3xl font-bold">School Fees</h1>
          <p className="text-muted-foreground">View your fee status and make payments</p>
        </div>

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
              <CardTitle className="text-2xl text-success">{formatCurrency(totalPaid)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding Balance</CardDescription>
              <CardTitle className="text-2xl text-warning">{formatCurrency(totalBalance)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Fee Records */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Fee Records</h2>
          
          {feePayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No fee records found</p>
                <p className="text-sm text-muted-foreground">Contact the school bursary for your fee information.</p>
              </CardContent>
            </Card>
          ) : (
            feePayments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {payment.term} - {payment.academic_year}
                      </CardTitle>
                      <CardDescription>{payment.installment}</CardDescription>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount Payable</p>
                      <p className="font-semibold">{formatCurrency(payment.amount_payable)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount Paid</p>
                      <p className="font-semibold text-success">{formatCurrency(payment.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance</p>
                      <p className={`font-semibold ${payment.balance > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {formatCurrency(payment.balance)}
                      </p>
                    </div>
                  </div>
                  
                  {payment.last_payment_date && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Last payment: {new Date(payment.last_payment_date).toLocaleDateString()}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {payment.status !== 'paid' && (
                      <Button onClick={() => handlePayFees(payment)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => handleDownloadReceipt(payment)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
