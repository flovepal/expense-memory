import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useShops } from "@/features/dishes/hooks/use-shops"
import { useDishes } from "@/features/dishes/hooks/use-dishes"
import { DishQuickAddForm } from "@/features/dishes/components/dish-quick-add-form"
import { useCurrencies } from "@/features/currencies/hooks/use-currencies"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Dish } from "@/services/repositories/dishes.repository"

/**
 * Two modes, both built on the same Popover+Input+filtered-list pattern as
 * ShopPicker/TransactionPicker:
 * - Scoped to a shop (transaction flow): repeatable "add" picker — stays
 *   open after each pick so multiple dishes can be added to a cart, and
 *   offers an inline "add new dish" quick-create since we know which shop
 *   a new dish belongs to.
 * - Unscoped (Food Log flow): single-pick "select" picker showing shop
 *   name per result — no quick-create here, since we don't know which shop
 *   a brand-new dish should attach to without asking; users fall back to
 *   the free-text fields for dishes that aren't catalogued yet.
 */
export function DishPicker({
  shopId,
  value,
  onSelect,
  defaultCurrencyId,
}: {
  shopId?: string
  value?: Dish | null
  onSelect: (dish: Dish) => void
  defaultCurrencyId?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [showQuickAddForm, setShowQuickAddForm] = React.useState(false)

  const shops = useShops()
  const dishes = useDishes(shopId)
  const currencies = useCurrencies()
  const shopById = new Map((shops.data ?? []).map((s) => [s.id, s]))
  const currencyById = new Map((currencies.data ?? []).map((c) => [c.id, c]))

  const closeOnSelect = shopId !== undefined ? false : true

  const query = search.trim().toLowerCase()
  const filtered = (dishes.data ?? [])
    .filter((d) => !query || d.name.toLowerCase().includes(query))
    .slice(0, 20)
  const exactMatchExists = (dishes.data ?? []).some((d) => d.name.toLowerCase() === query)

  function handleSelect(dish: Dish) {
    onSelect(dish)
    setSearch("")
    if (closeOnSelect) setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setSearch("")
      setShowQuickAddForm(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            {value ? (
              <span className="truncate">{value.name}</span>
            ) : (
              <span className="text-muted-foreground">
                {shopId ? "Add dish" : "Link a dish (optional)"}
              </span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-2">
        {showQuickAddForm && shopId ? (
          <DishQuickAddForm
            shopId={shopId}
            initialName={search.trim()}
            defaultCurrencyId={defaultCurrencyId}
            onCreated={(dish) => {
              setShowQuickAddForm(false)
              handleSelect(dish)
            }}
            onCancel={() => setShowQuickAddForm(false)}
          />
        ) : (
          <>
            <Input
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="mt-2 max-h-64 overflow-y-auto">
              {filtered.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleSelect(dish)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                    value?.id === dish.id && "bg-accent"
                  )}
                >
                  <span className="flex flex-col truncate">
                    <span className="truncate font-medium">{dish.name}</span>
                    {!shopId && dish.shop_id && shopById.get(dish.shop_id) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {shopById.get(dish.shop_id)!.name}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {formatCurrency(
                      dish.price,
                      (dish.currency_id && currencyById.get(dish.currency_id)?.code) || "USD"
                    )}
                    {value?.id === dish.id && <Check className="size-3.5" />}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  {shopId ? "No matching dishes" : "No matching dishes — try the free-text fields below"}
                </p>
              )}
              {shopId && search.trim() && !exactMatchExists && (
                <button
                  type="button"
                  onClick={() => setShowQuickAddForm(true)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-accent"
                >
                  <Plus className="size-3.5" />
                  Add "{search.trim()}" as a new dish
                </button>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
