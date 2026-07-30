import * as React from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useShops, useCreateShop } from "@/features/dishes/hooks/use-shops"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import type { Shop } from "@/services/repositories/shops.repository"

/** Searchable picker over the user's shops, with inline "add new shop" quick-create when nothing matches — same Popover+Input+filtered-list pattern as TransactionPicker. */
export function ShopPicker({
  value,
  onSelect,
}: {
  value: Shop | null
  onSelect: (shop: Shop | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const { user } = useAuth()
  const shops = useShops()
  const createShop = useCreateShop()

  const query = search.trim().toLowerCase()
  const filtered = (shops.data ?? []).filter((s) => !query || s.name.toLowerCase().includes(query))
  const exactMatchExists = (shops.data ?? []).some((s) => s.name.toLowerCase() === query)

  function handleSelect(shop: Shop) {
    onSelect(shop)
    setOpen(false)
    setSearch("")
  }

  async function handleCreate() {
    if (!search.trim() || !user) return
    try {
      const shop = await createShop.mutateAsync({ name: search.trim() })
      handleSelect(shop)
    } catch (error) {
      toast.error(error, "Couldn't create shop")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            {value ? (
              <span className="min-w-0 flex-1 truncate text-left">{value.name}</span>
            ) : (
              <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">Select a shop</span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-2">
        <Input
          placeholder="Search or add a shop..."
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
          {filtered.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => handleSelect(shop)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                value?.id === shop.id && "bg-accent"
              )}
            >
              <span className="min-w-0 flex-1 truncate">{shop.name}</span>
              {value?.id === shop.id && <Check className="size-3.5 shrink-0" />}
            </button>
          ))}
          {search.trim() && !exactMatchExists && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={createShop.isPending}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-accent"
            >
              <Plus className="size-3.5" />
              Add "{search.trim()}" as a new shop
            </button>
          )}
          {filtered.length === 0 && !search.trim() && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No shops yet — type a name to add one
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
