import * as React from "react"
import { Plus, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
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

  const shops = useFoodLogShops()
  const dishCategories = useDishCategories()
  const entries = useFoodLogEntries({
    shop: shopFilter || undefined,
    dishCategoryId: dishCategoryFilter || undefined,
  })

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

      {(shops.data ?? []).length > 0 || (dishCategories.data ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Select
            items={{ [ALL]: "All shops", ...Object.fromEntries((shops.data ?? []).map((s) => [s, s])) }}
            value={shopFilter || ALL}
            onValueChange={(v) => setShopFilter(!v || v === ALL ? "" : v)}
          >
            <SelectTrigger className="w-44">
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

          <Select
            items={{
              [ALL]: "All categories",
              ...Object.fromEntries((dishCategories.data ?? []).map((c) => [c.id, c.name])),
            }}
            value={dishCategoryFilter || ALL}
            onValueChange={(v) => setDishCategoryFilter(!v || v === ALL ? "" : v)}
          >
            <SelectTrigger className="w-44">
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
        </div>
      ) : null}

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
      {entries.isSuccess && entries.data.length > 0 && <FoodLogList entries={entries.data} />}
    </div>
  )
}
