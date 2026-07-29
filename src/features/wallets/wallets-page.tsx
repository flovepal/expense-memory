import { Plus, Wallet as WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { WalletFormDialog } from "@/features/wallets/components/wallet-form-dialog"
import { WalletCard } from "@/features/wallets/components/wallet-card"
import { useWalletBalances, useWallets } from "@/features/wallets/hooks/use-wallets"

export function WalletsPage() {
  const wallets = useWallets()
  const balances = useWalletBalances()

  const balanceByWalletId = new Map((balances.data ?? []).map((b) => [b.wallet_id, b]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Wallets</h1>
        <WalletFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              New Wallet
            </Button>
          }
        />
      </div>

      {wallets.isLoading && <LoadingState />}
      {wallets.isError && (
        <ErrorState message="Couldn't load wallets." onRetry={() => wallets.refetch()} />
      )}
      {wallets.isSuccess && wallets.data.length === 0 && (
        <EmptyState
          icon={WalletIcon}
          title="No wallets yet"
          description="Create a wallet — cash, a bank account, a card — to start tracking transactions."
          action={
            <WalletFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New Wallet
                </Button>
              }
            />
          }
        />
      )}
      {wallets.isSuccess && wallets.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.data.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              balance={balanceByWalletId.get(wallet.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
