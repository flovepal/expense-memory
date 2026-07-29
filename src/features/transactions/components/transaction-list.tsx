import { Pencil, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog"
import { useDeleteTransaction } from "@/features/transactions/hooks/use-transactions"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { TransactionDetailed } from "@/services/repositories/transactions.repository"

export function TransactionList({ transactions }: { transactions: TransactionDetailed[] }) {
  const deleteTransaction = useDeleteTransaction()

  async function handleDelete(id: string) {
    try {
      await deleteTransaction.mutateAsync(id)
      toast.success("Transaction deleted")
    } catch (error) {
      toast.error(error, "Couldn't delete transaction")
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="whitespace-nowrap">
                {transaction.occurred_at ? formatDate(transaction.occurred_at) : "—"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{transaction.category_name}</span>
                  {transaction.subcategory_name && (
                    <span className="text-xs text-muted-foreground">
                      {transaction.subcategory_name}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{transaction.wallet_name}</TableCell>
              <TableCell className="max-w-48 text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span className="truncate">{transaction.note || "—"}</span>
                  {Array.isArray(transaction.tags) && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(transaction.tags as unknown as { id: string; name: string }[]).map(
                        (tag) => (
                          <Badge key={tag.id} variant="outline" className="text-[10px]">
                            {tag.name}
                          </Badge>
                        )
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell
                className={
                  "text-right font-medium tabular-nums " +
                  (transaction.transaction_type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground")
                }
              >
                {transaction.transaction_type === "income" ? "+" : "-"}
                {formatCurrency(
                  transaction.amount ?? 0,
                  transaction.currency_code ?? "USD"
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <TransactionFormDialog
                    transaction={transaction}
                    trigger={
                      <Button variant="ghost" size="icon" className="size-7">
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-7">
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This can't be undone from the UI.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => transaction.id && handleDelete(transaction.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
