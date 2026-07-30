import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Wallet as WalletIcon } from "lucide-react"
import { useWalletBalances } from "@/features/wallets/hooks/use-wallets"
import { useWalletMonthlySummary } from "@/features/dashboard/hooks/use-dashboard"
import { formatCurrency } from "@/lib/format"

type ViewMode = "all-time" | "this-month"

export function WalletBalanceSummary({ month }: { month: string }) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("all-time")

  const balances = useWalletBalances()
  const monthly = useWalletMonthlySummary(month)

  if (balances.isLoading) return <LoadingState />
  if (!balances.data || balances.data.length === 0) {
    return (
      <EmptyState
        icon={WalletIcon}
        title="No wallets yet"
        description="Add a wallet to see its balance here."
      />
    )
  }

  const activeWallets = balances.data.filter((w) => !w.is_archived)

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="all-time">All time</TabsTrigger>
          <TabsTrigger value="this-month">This month</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeWallets.map((wallet) => {
          const currencyCode = wallet.currency_code ?? "USD"
          const decimalDigits = wallet.currency_decimal_digits ?? 2

          const monthRow = monthly.data?.find((m) => m.wallet_id === wallet.wallet_id)
          const monthReceived = monthRow?.total_received ?? 0
          const monthSpent = monthRow?.total_spent ?? 0

          const headline =
            viewMode === "all-time"
              ? (wallet.current_balance ?? 0)
              : monthReceived - monthSpent
          const received = viewMode === "all-time" ? (wallet.total_received ?? 0) : monthReceived
          const spent = viewMode === "all-time" ? (wallet.total_spent ?? 0) : monthSpent

          return (
            <Card key={wallet.wallet_id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {wallet.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(headline, currencyCode, decimalDigits)}
                </p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Received {formatCurrency(received, currencyCode, decimalDigits)}</span>
                  <span>Spent {formatCurrency(spent, currencyCode, decimalDigits)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
