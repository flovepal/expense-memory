import { Minus, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import type { TransactionDishItemInput } from "@/services/repositories/transaction-dishes.repository"

export type CartItem = TransactionDishItemInput & { key: string }

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
}

/** The running list of dishes added to a Food transaction — qty stepper, remove button, running subtotal. New UI pattern in this app; no stepper existed before. */
export function DishCart({
  items,
  currencyCode,
  onQuantityChange,
  onRemove,
}: {
  items: CartItem[]
  currencyCode: string
  onQuantityChange: (key: string, quantity: number) => void
  onRemove: (key: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div className="grid gap-2 rounded-md border p-2">
      {items.map((item) => (
        <div key={item.key} className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm">{item.dish_name}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-6"
              onClick={() => onQuantityChange(item.key, Math.max(1, item.quantity - 1))}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-5 text-center text-sm tabular-nums">{item.quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-6"
              onClick={() => onQuantityChange(item.key, item.quantity + 1)}
            >
              <Plus className="size-3" />
            </Button>
          </div>
          <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
            {formatCurrency(item.unit_price * item.quantity, currencyCode)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => onRemove(item.key)}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatCurrency(cartTotal(items), currencyCode)}</span>
      </div>
    </div>
  )
}
