import { Plus, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog"
import { TransactionList } from "@/features/transactions/components/transaction-list"
import { useTransactions } from "@/features/transactions/hooks/use-transactions"

export function TransactionsPage() {
  const transactions = useTransactions()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <TransactionFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              New Transaction
            </Button>
          }
        />
      </div>

      {transactions.isLoading && <LoadingState />}
      {transactions.isError && (
        <ErrorState
          message="Couldn't load transactions."
          onRetry={() => transactions.refetch()}
        />
      )}
      {transactions.isSuccess && transactions.data.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Record your first income or expense to see it here."
          action={
            <TransactionFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New Transaction
                </Button>
              }
            />
          }
        />
      )}
      {transactions.isSuccess && transactions.data.length > 0 && (
        <TransactionList transactions={transactions.data} />
      )}
    </div>
  )
}
