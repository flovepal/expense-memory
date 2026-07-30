import * as React from "react"
import { Plus, Search, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FoodLogFormDialog } from "@/features/food-log/components/food-log-form-dialog"
import { FoodLogList } from "@/features/food-log/components/food-log-list"
import { useFoodLogEntries, useFoodLogShops } from "@/features/food-log/hooks/use-food-log"
import { useDishCategories } from "@/features/dishes/hooks/use-dish-categories"

const ALL = "__all__"

export function FoodLogPage() {
  const [shopFilter, setShopFilter] = React.useState<string>("")
  const [dishCategoryFilter, setDishCategoryFilter] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [minCost, setMinCost] = React.useState("")
  const [maxCost, setMaxCost] = React.useState("")

  const shops = useFoodLogShops()
  const dishCategories = useDishCategories()
  const entries = useFoodLogEntries({
    shop: shopFilter || undefined,
    dishCategoryId: dishCategoryFilter || undefined,
  })

  const query = search.trim().toLowerCase()
  const min = minCost ? Number(minCost) : undefined
  const max = maxCost ? Number(maxCost) : undefined

  const filteredEntries = (entries.data ?? []).filter((entry) => {
    if (query) {
      const matches =
        entry.food_name.toLowerCase().includes(query) ||
        (entry.shop ?? "").toLowerCase().includes(query)
      if (!matches) return false
    }
    if (min != null && (entry.price == null || entry.price < min)) return false
    if (max != null && (entry.price == null || entry.price > max)) return false
    return true
  })

  const hasActiveFilters = !!(query || min != null || max != null)

  const newEntryButton = (
    <FoodLogFormDialog
      trigger={
        <Button size="sm">
          <Plus className="size-4" />
          New Entry
        </Button>
      }
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Food Log</h1>
        {newEntryButton}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {(shops.data ?? []).length > 0 && (
          <Select
            items={{ [ALL]: "All shops", ...Object.fromEntries((shops.data ?? []).map((s) => [s, s])) }}
            value={shopFilter || ALL}
            onValueChange={(v) => setShopFilter(!v || v === ALL ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All shops</SelectItem>
              {shops.data?.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(dishCategories.data ?? []).length > 0 && (
          <Select
            items={{
              [ALL]: "All categories",
              ...Object.fromEntries((dishCategories.data ?? []).map((c) => [c.id, c.name])),
            }}
            value={dishCategoryFilter || ALL}
            onValueChange={(v) => setDishCategoryFilter(!v || v === ALL ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {dishCategories.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            step="0.01"
            placeholder="Min cost"
            value={minCost}
            onChange={(e) => setMinCost(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            step="0.01"
            placeholder="Max cost"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
            className="w-24"
          />
        </div>
      </div>

      {entries.isLoading && <LoadingState />}
      {entries.isError && (
        <ErrorState message="Couldn't load food log entries." onRetry={() => entries.refetch()} />
      )}
      {entries.isSuccess && entries.data.length === 0 && (
        <EmptyState
          icon={UtensilsCrossed}
          title="No food log entries yet"
          description="Log what you eat and how it tasted — link it to a transaction to keep it traceable to real spending."
          action={newEntryButton}
        />
      )}
      {entries.isSuccess && entries.data.length > 0 && filteredEntries.length === 0 && (
        <EmptyState
          icon={Search}
          title="No entries match"
          description={hasActiveFilters ? "Try a different search, shop, category, or cost range." : undefined}
        />
      )}
      {filteredEntries.length > 0 && <FoodLogList entries={filteredEntries} />}
    </div>
  )
}
