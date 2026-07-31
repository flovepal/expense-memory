import * as React from "react"
import { ArrowRight, Pencil, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { ImageLightbox, type LightboxImage } from "@/features/transactions/components/image-lightbox"
import { useDeleteTransaction } from "@/features/transactions/hooks/use-transactions"
import { useDishImageSignedUrls } from "@/features/dishes/hooks/use-dish-images"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TransactionDetailed } from "@/services/repositories/transactions.repository"

type DishItemSummary = {
  id: string
  dish_id: string | null
  dish_name: string
  unit_price: number
  quantity: number
  image_storage_path: string | null
}

function getDishItems(transaction: TransactionDetailed): DishItemSummary[] {
  return (transaction.dish_items as unknown as DishItemSummary[] | null) ?? []
}

function amountClassName(type: string) {
  return cn(
    "font-medium tabular-nums",
    type === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : type === "transfer"
        ? "text-muted-foreground"
        : "text-foreground"
  )
}

function amountPrefix(type: string) {
  return type === "income" ? "+" : type === "transfer" ? "" : "-"
}

export function TransactionList({ transactions }: { transactions: TransactionDetailed[] }) {
  const deleteTransaction = useDeleteTransaction()
  const [lightbox, setLightbox] = React.useState<{ images: LightboxImage[]; index: number } | null>(null)

  const dishImagePaths = transactions.flatMap((t) =>
    getDishItems(t)
      .map((d) => d.image_storage_path)
      .filter((p): p is string => !!p)
  )
  const dishImageSignedUrls = useDishImageSignedUrls(dishImagePaths)

  async function handleDelete(id: string) {
    try {
      await deleteTransaction.mutateAsync(id)
      toast.success("Transaction deleted")
    } catch (error) {
      toast.error(error, "Couldn't delete transaction")
    }
  }

  function openDishLightbox(transaction: TransactionDetailed, clickedIndex: number) {
    const images = getDishItems(transaction)
      .filter((d) => d.image_storage_path)
      .map((d) => ({ id: d.id, url: dishImageSignedUrls.data?.[d.image_storage_path!] ?? "" }))
    setLightbox({ images, index: clickedIndex })
  }

  function DishItemsSummary({ transaction }: { transaction: TransactionDetailed }) {
    const items = getDishItems(transaction)
    if (items.length === 0) return null

    const itemsWithImages = items.filter((d) => d.image_storage_path)

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {items.map((d) => `${d.dish_name} ×${d.quantity}`).join(", ")}
        </span>
        {itemsWithImages.length > 0 && (
          <div className="flex gap-1">
            {itemsWithImages.slice(0, 2).map((d, i) => {
              const url = dishImageSignedUrls.data?.[d.image_storage_path!]
              return url ? (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openDishLightbox(transaction, i)}
                  className="size-8 shrink-0 overflow-hidden rounded"
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ) : null
            })}
            {itemsWithImages.length > 2 && (
              <button
                type="button"
                onClick={() => openDishLightbox(transaction, 2)}
                className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-[10px]"
              >
                +{itemsWithImages.length - 2}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  function CategoryOrTransfer({ transaction }: { transaction: TransactionDetailed }) {
    if (transaction.transaction_type === "transfer") {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>{transaction.wallet_name}</span>
          <ArrowRight className="size-3.5" />
          <span>{transaction.to_wallet_name}</span>
        </div>
      )
    }
    return (
      <div className="flex flex-col">
        <span>{transaction.category_name}</span>
        {transaction.subcategory_name && (
          <span className="text-xs text-muted-foreground">{transaction.subcategory_name}</span>
        )}
      </div>
    )
  }

  function RowActions({ transaction }: { transaction: TransactionDetailed }) {
    return (
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
              <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
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
    )
  }

  return (
    <>
      {/* Card layout below sm — avoids a horizontally-scrolling table on phones. */}
      <div className="grid gap-3 sm:hidden">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {transaction.occurred_at ? formatDate(transaction.occurred_at) : "—"}
                </span>
                <CategoryOrTransfer transaction={transaction} />
              </div>
              <span className={amountClassName(transaction.transaction_type ?? "")}>
                {amountPrefix(transaction.transaction_type ?? "")}
                {formatCurrency(transaction.amount ?? 0, transaction.currency_code ?? "USD")}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{transaction.wallet_name}</span>
              <RowActions transaction={transaction} />
            </div>

            {(transaction.merchant || transaction.note) && (
              <div className="mt-1 flex flex-col gap-0.5 text-sm">
                {transaction.merchant && <span className="font-medium">{transaction.merchant}</span>}
                {transaction.note && <span className="text-muted-foreground">{transaction.note}</span>}
              </div>
            )}

            <div className="mt-1">
              <DishItemsSummary transaction={transaction} />
            </div>
          </div>
        ))}
      </div>

      {/* Table layout from sm up. */}
      <div className="hidden overflow-x-auto rounded-lg border sm:block">
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
                  <CategoryOrTransfer transaction={transaction} />
                </TableCell>
                <TableCell>{transaction.wallet_name}</TableCell>
                <TableCell className="max-w-48 text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    {transaction.merchant && (
                      <span className="font-medium text-foreground">{transaction.merchant}</span>
                    )}
                    <span className="truncate">{transaction.note || "—"}</span>
                    <DishItemsSummary transaction={transaction} />
                  </div>
                </TableCell>
                <TableCell className={cn("text-right", amountClassName(transaction.transaction_type ?? ""))}>
                  {amountPrefix(transaction.transaction_type ?? "")}
                  {formatCurrency(transaction.amount ?? 0, transaction.currency_code ?? "USD")}
                </TableCell>
                <TableCell>
                  <RowActions transaction={transaction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ImageLightbox
        images={lightbox?.images ?? []}
        initialIndex={lightbox?.index ?? 0}
        open={!!lightbox}
        onOpenChange={(open) => !open && setLightbox(null)}
      />
    </>
  )
}
