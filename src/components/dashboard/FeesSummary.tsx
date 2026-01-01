import { Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function FeesSummary() {
  const totalExpected = 25000000;
  const collected = 18500000;
  const pending = totalExpected - collected;
  const percentage = (collected / totalExpected) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Fees Collection</h3>
        <span className="text-sm text-muted-foreground">2024/2025 Term 2</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Collection Progress</span>
            <span className="text-sm font-medium text-foreground">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-success/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">Collected</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(collected)}</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning font-medium">Pending</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(pending)}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Expected</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalExpected)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
