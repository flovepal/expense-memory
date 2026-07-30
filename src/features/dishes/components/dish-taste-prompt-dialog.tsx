import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FoodLogFormDialog } from "@/features/food-log/components/food-log-form-dialog"
import { useCurrencies } from "@/features/currencies/hooks/use-currencies"
import { formatCurrency } from "@/lib/format"
import type { FoodLogEntry } from "@/services/repositories/food-log.repository"

/** Shown after saving a Food transaction with dishes — each dish already has a food log entry by this point (auto-created alongside the transaction), so this is just a shortcut to jump straight into filling in the taste details. Fully skippable. */
export function DishTastePromptDialog({
  open,
  onOpenChange,
  entries,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: FoodLogEntry[]
}) {
  const currencies = useCurrencies()
  const currencyById = new Map((currencies.data ?? []).map((c) => [c.id, c]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log the taste of these dishes?</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border p-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{entry.food_name}</span>
                {entry.price != null && (
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(
                      entry.price,
                      (entry.currency_id && currencyById.get(entry.currency_id)?.code) || "USD"
                    )}
                  </span>
                )}
              </div>
              <FoodLogFormDialog
                entry={entry}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    Log taste
                  </Button>
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
