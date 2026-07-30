import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTransactions } from "@/features/transactions/hooks/use-transactions"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TransactionDetailed } from "@/services/repositories/transactions.repository"

/** Lets the user optionally link a food log entry to one of their existing expense transactions, so shop/price/date can be pulled from real spending instead of retyped. Client-filters an already-fetched page — this app has no combobox/command-palette primitive, and a few hundred transactions is cheap to filter in memory. */
export function TransactionPicker({
  value,
  onSelect,
}: {
  value: TransactionDetailed | null
  onSelect: (transaction: TransactionDetailed | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const transactions = useTransactions({ transactionType: "expense", limit: 200 })

  const query = search.trim().toLowerCase()
  const filtered = (transactions.data ?? [])
    .filter((t) => {
      if (!query) return true
      return (
        (t.merchant ?? "").toLowerCase().includes(query) ||
        (t.category_name ?? "").toLowerCase().includes(query) ||
        (t.note ?? "").toLowerCase().includes(query)
      )
    })
    .slice(0, 20)

  function handleSelect(transaction: TransactionDetailed) {
    onSelect(transaction)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            {value ? (
              <span className="min-w-0 flex-1 truncate text-left">
                {value.merchant || value.category_name} · {formatCurrency(value.amount ?? 0, value.currency_code ?? "USD")} · {value.occurred_at ? formatDate(value.occurred_at) : ""}
              </span>
            ) : (
              <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">Link a transaction (optional)</span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-2">
        <Input
          placeholder="Search by shop, category, or note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="mt-2 max-h-64 overflow-y-auto">
          {value && (
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              <X className="size-3.5" />
              Clear selection
            </button>
          )}
          {filtered.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No matching transactions</p>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                value?.id === t.id && "bg-accent"
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{t.merchant || t.category_name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t.occurred_at ? formatDate(t.occurred_at) : ""}
                </span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                {formatCurrency(t.amount ?? 0, t.currency_code ?? "USD")}
                {value?.id === t.id && <Check className="size-3.5" />}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
