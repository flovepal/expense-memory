import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { BarChart3 } from "lucide-react"
import { useMonthlyCategorySummary } from "@/features/dashboard/hooks/use-dashboard"
import type { TransactionType } from "@/types/enums"
import { formatCurrency } from "@/lib/format"

export function MonthlyCategoryBreakdown({
  month,
  transactionType,
}: {
  month: string
  transactionType: TransactionType
}) {
  const summary = useMonthlyCategorySummary(month)

  if (summary.isLoading) return <LoadingState />

  const rows = (summary.data ?? []).filter((row) => row.transaction_type === transactionType)

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title={`No ${transactionType} recorded this month`}
        description="Add a transaction to see the breakdown by category."
      />
    )
  }

  const maxAmount = Math.max(...rows.map((row) => row.total_amount ?? 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          By category
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.category_id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{row.category_name}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(row.total_amount ?? 0, "USD")}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary"
                style={{
                  width: `${maxAmount > 0 ? ((row.total_amount ?? 0) / maxAmount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
