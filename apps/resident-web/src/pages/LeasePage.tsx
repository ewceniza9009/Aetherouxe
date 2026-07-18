import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Separator } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@elite-realty/shared-ui/components/ui";
import {
  FileText,
  Calculator,
  Home,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMyLease, useLeasePayments } from "@/hooks/use-leases";
import {
  useMyMortgageScenarios,
  useGenerateScenario,
  type MortgageScenario,
} from "@/hooks/use-mortgage";

export default function LeasePage() {
  const navigate = useNavigate();
  const { data: lease, isLoading: leaseLoading } = useMyLease();
  const { data: payments, isLoading: paymentsLoading } = useLeasePayments(lease?.id ?? "");

  const {
    data: scenariosData,
    isLoading: scenariosLoading,
    refetch: refetchScenarios,
  } = useMyMortgageScenarios(lease?.id);
  const generateScenario = useGenerateScenario();

  const [exploreOpen, setExploreOpen] = useState(false);
  const [homePrice, setHomePrice] = useState("350000");
  const [downPayment, setDownPayment] = useState("20");
  const [interestRate, setInterestRate] = useState("6.5");
  const [term, setTerm] = useState("360");

  const scenarios = scenariosData?.data ?? [];

  const handleGenerate = async () => {
    if (!lease) return;
    await generateScenario.mutateAsync({
      leaseAgreementId: lease.id,
      homePrice: parseFloat(homePrice),
      downPaymentPercent: parseFloat(downPayment),
      interestRate: parseFloat(interestRate),
      termMonths: parseInt(term, 10),
    });
    setExploreOpen(false);
    refetchScenarios();
  };

  const nextPayment = (payments ?? [])
    .filter((p) => p.status !== "paid")
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lease Details</h1>
        <p className="text-muted-foreground">View your lease agreement and explore mortgage scenarios</p>
      </div>

      <Tabs defaultValue="lease">
        <TabsList>
          <TabsTrigger value="lease">My Lease</TabsTrigger>
          <TabsTrigger value="mortgage">Mortgage Explorer</TabsTrigger>
        </TabsList>

        <TabsContent value="lease">
          {leaseLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !lease ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active lease found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Lease</CardTitle>
                  <CardDescription>Your active lease agreement details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Property</p>
                      <p className="font-medium">{lease.propertyName ?? "Your residence"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lease Type</p>
                      <p className="font-medium">{lease.leaseType.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(lease.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(lease.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium text-lg">${lease.monthlyRent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Security Deposit</p>
                      <p className="font-medium">${lease.securityDeposit?.toLocaleString() ?? "—"}</p>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" /> View Full Lease Document
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rent-to-Own Eligibility</CardTitle>
                  <CardDescription>Check if you qualify for our RTO program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <Home className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">You may be eligible!</p>
                      <p className="text-xs text-green-600">Based on your payment history and lease duration</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    With our Rent-to-Own program, up to 25% of your monthly rent (
                    ${((lease.monthlyRent ?? 0) * 0.25).toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo)
                    can be credited toward your future down payment.
                  </p>
                  <Button variant="default" className="w-full">Apply for RTO Program</Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Your next scheduled rent payment</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : nextPayment ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{nextPayment.period ?? "Next payment"}</p>
                        <p className="text-2xl font-bold">${nextPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {nextPayment.dueDate ? new Date(nextPayment.dueDate).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <Button onClick={() => navigate({ to: "/payments" })}>
                        Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">All payments are up to date.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mortgage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" /> Mortgage Explorer
                  </CardTitle>
                  <CardDescription>Estimate what your monthly mortgage payment could look like</CardDescription>
                </div>
                <Button onClick={() => setExploreOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" /> Explore Mortgage Options
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {scenariosLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : scenarios.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg border-muted-foreground/20">
                  <Calculator className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No scenarios yet. Click “Explore Mortgage Options” to generate your first estimate.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    {scenarios.map((sc: MortgageScenario) => (
                      <Card key={sc.id} className="border-primary/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            {sc.termMonths / 12} yr · {sc.downPaymentPercent}% down
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly</span>
                            <span className="font-semibold">${sc.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Loan</span>
                            <span>${sc.loanAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Interest</span>
                            <span className="text-yellow-700">${sc.totalInterest.toLocaleString()}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => navigate({ to: `/lease/mortgage/${sc.id}` })}
                          >
                            View Full Schedule <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {scenarios.length > 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Scenario Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Term</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Down %</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rate</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monthly</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Interest</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scenarios.map((sc: MortgageScenario) => (
                                <tr key={sc.id} className="border-b hover:bg-muted/30">
                                  <td className="px-4 py-2">{sc.termMonths / 12} yr</td>
                                  <td className="px-4 py-2 text-right">{sc.downPaymentPercent}%</td>
                                  <td className="px-4 py-2 text-right">{sc.interestRate}%</td>
                                  <td className="px-4 py-2 text-right font-medium">
                                    ${sc.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2 text-right text-yellow-700">${sc.totalInterest.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {exploreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Explore Mortgage Options
              </CardTitle>
              <CardDescription>Adjust the assumptions to see your estimated financing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="homePrice">Home Price</Label>
                <Input id="homePrice" type="number" value={homePrice} onChange={(e) => setHomePrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="downPayment">Down Payment (%)</Label>
                  <span className="text-sm font-semibold">{downPayment}%</span>
                </div>
                <input
                  id="downPayment"
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full accent-primary"
                />
                <Input
                  className="mt-1"
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Interest Rate (%)</Label>
                <Input id="rate" type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="180">15 years</SelectItem>
                    <SelectItem value="240">20 years</SelectItem>
                    <SelectItem value="360">30 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setExploreOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={generateScenario.isPending || !lease}>
                  {generateScenario.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Scenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


