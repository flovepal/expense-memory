import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Wallet as WalletIcon } from "lucide-react"
import { useWalletBalances } from "@/features/wallets/hooks/use-wallets"
import { formatCurrency } from "@/lib/format"

export function WalletBalanceSummary() {
  const balances = useWalletBalances()

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeWallets.map((wallet) => (
        <Card key={wallet.wallet_id}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {wallet.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(
                wallet.current_balance ?? 0,
                wallet.currency_code ?? "USD",
                wallet.currency_decimal_digits ?? 2
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
