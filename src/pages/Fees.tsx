import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, Filter, MoreVertical, Receipt, FileSpreadsheet, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { PaymentStatus } from '@/types';

const feePayments = [
  {
    id: '1',
    studentName: 'Chioma Adeyemi',
    admissionNumber: 'ADM-2025-0001',
    className: 'Primary 5',
    amountPayable: 150000,
    amountPaid: 150000,
    balance: 0,
    installment: 1,
    status: 'paid' as PaymentStatus,
    lastPaymentDate: '2025-01-15',
  },
  {
    id: '2',
    studentName: 'Emeka Okonkwo',
    admissionNumber: 'ADM-2025-0002',
    className: 'JSS 2',
    amountPayable: 180000,
    amountPaid: 100000,
    balance: 80000,
    installment: 2,
    status: 'partial' as PaymentStatus,
    lastPaymentDate: '2025-01-10',
  },
  {
    id: '3',
    studentName: 'Fatima Ibrahim',
    admissionNumber: 'ADM-2025-0003',
    className: 'Nursery 2',
    amountPayable: 100000,
    amountPaid: 0,
    balance: 100000,
    installment: 1,
    status: 'unpaid' as PaymentStatus,
    lastPaymentDate: null,
  },
  {
    id: '4',
    studentName: 'David Okafor',
    admissionNumber: 'ADM-2025-0004',
    className: 'SSS 1',
    amountPayable: 200000,
    amountPaid: 200000,
    balance: 0,
    installment: 1,
    status: 'paid' as PaymentStatus,
    lastPaymentDate: '2025-01-08',
  },
  {
    id: '5',
    studentName: 'Grace Mensah',
    admissionNumber: 'ADM-2025-0005',
    className: 'Primary 3',
    amountPayable: 120000,
    amountPaid: 60000,
    balance: 60000,
    installment: 2,
    status: 'partial' as PaymentStatus,
    lastPaymentDate: '2025-01-05',
  },
];

export default function Fees() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayments = feePayments.filter((payment) => {
    const matchesSearch =
      payment.studentName.toLowerCase().includes(search.toLowerCase()) ||
      payment.admissionNumber.toLowerCase().includes(search.toLowerCase());
    
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

  const getStatusBadge = (status: PaymentStatus) => {
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
    }
  };

  const totalExpected = feePayments.reduce((sum, p) => sum + p.amountPayable, 0);
  const totalCollected = feePayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPending = totalExpected - totalCollected;

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
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Generate Bill Sheet
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90">
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
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{payment.studentName}</p>
                      <p className="text-sm text-muted-foreground">{payment.admissionNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.className}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amountPayable)}</TableCell>
                  <TableCell className="text-success font-medium">{formatCurrency(payment.amountPaid)}</TableCell>
                  <TableCell className={payment.balance > 0 ? 'text-warning font-medium' : 'text-muted-foreground'}>
                    {formatCurrency(payment.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.installment}/3</Badge>
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
                        <DropdownMenuItem>Update Payment</DropdownMenuItem>
                        <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                        <DropdownMenuItem>Payment History</DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
