import { Plus, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { FoodLogFormDialog } from "@/features/food-log/components/food-log-form-dialog"
import { FoodLogList } from "@/features/food-log/components/food-log-list"
import { useFoodLogEntries } from "@/features/food-log/hooks/use-food-log"

export function FoodLogPage() {
  const entries = useFoodLogEntries()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Food Log</h1>
        <FoodLogFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              New Entry
            </Button>
          }
        />
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
          action={
            <FoodLogFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New Entry
                </Button>
              }
            />
          }
        />
      )}
      {entries.isSuccess && entries.data.length > 0 && <FoodLogList entries={entries.data} />}
    </div>
  )
}
