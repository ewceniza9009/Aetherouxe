import { useState } from 'react';
import {
  useRewardCatalog,
  useRewardBalance,
  useRewardLedger,
  useRedeemReward,
} from '@/hooks/use-rewards';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@elite-realty/shared-ui/components/ui';
import { Gift, Coins, History, CheckCircle, ArrowRight } from 'lucide-react';

export default function RewardsPage() {
  const { data: catalog, isLoading: catalogLoading } = useRewardCatalog();
  const { data: balanceData, isLoading: balanceLoading } = useRewardBalance();
  const { data: ledger, isLoading: ledgerLoading } = useRewardLedger();
  const redeemReward = useRedeemReward();

  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  const balance = balanceData?.balance ?? 0;

  const handleRedeem = (id: string) => {
    redeemReward.mutate(id, {
      onSuccess: () => {
        setSelectedReward(null);
      },
    });
  };

  if (catalogLoading || balanceLoading || ledgerLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">Loading rewards...</div>
    );
  }

  const selectedItem = catalog?.find((item: any) => item.id === selectedReward);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">
            Resident Rewards
          </h1>
          <p className="text-muted-foreground text-indigo-600/80 dark:text-indigo-300/80">
            Earn points and redeem exclusive benefits
          </p>
        </div>
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-white shadow-lg w-full md:w-auto">
          <CardContent className="flex items-center gap-4 py-4 px-6">
            <div className="bg-white/20 p-3 rounded-full">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-indigo-100 text-sm font-medium">Available Points</p>
              <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <Gift className="h-5 w-5 text-indigo-500" /> Reward Catalog
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {catalog?.map((item: any) => (
              <Card
                key={item.id}
                className="group hover:border-indigo-300 hover:shadow-md transition-all duration-300 cursor-default bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-indigo-100 dark:border-indigo-900"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-900 dark:text-indigo-200">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between mt-auto">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    <Coins className="mr-1 h-3 w-3" /> {item.pointsCost} pts
                  </Badge>
                  <Button
                    size="sm"
                    variant={balance >= item.pointsCost ? 'default' : 'outline'}
                    className={
                      balance >= item.pointsCost
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : ''
                    }
                    disabled={balance < item.pointsCost}
                    onClick={() => setSelectedReward(item.id)}
                  >
                    Redeem
                  </Button>
                </CardContent>
              </Card>
            ))}
            {catalog?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                No rewards available at the moment.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <History className="h-5 w-5 text-indigo-500" /> Points History
          </h2>
          <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-indigo-50 dark:divide-indigo-900/20 max-h-[500px] overflow-y-auto">
                {ledger?.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="p-4 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {entry.notes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-bold flex items-center ${entry.transactionType === 'earned' ? 'text-emerald-600' : 'text-rose-500'}`}
                    >
                      {entry.transactionType === 'earned' ? '+' : '-'}
                      {entry.points}
                    </div>
                  </div>
                ))}
                {ledger?.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No points history yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedReward} onOpenChange={(open) => !open && setSelectedReward(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem <strong>{selectedItem?.pointsCost} points</strong> for{' '}
              <strong>{selectedItem?.title}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg my-4">
            <div className="text-center">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                New Balance will be
              </p>
              <div className="flex items-center justify-center gap-3 text-2xl font-bold">
                <span className="text-slate-400 line-through">{balance}</span>
                <ArrowRight className="h-5 w-5 text-indigo-400" />
                <span className="text-indigo-700 dark:text-indigo-300">
                  {balance - (selectedItem?.pointsCost ?? 0)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setSelectedReward(null)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => selectedReward && handleRedeem(selectedReward)}
              disabled={redeemReward.isPending}
            >
              {redeemReward.isPending ? 'Redeeming...' : 'Confirm Redemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
