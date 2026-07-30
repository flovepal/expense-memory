import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletBalanceSummary } from "@/features/dashboard/components/wallet-balance-summary"
import { MonthlyCategoryBreakdown } from "@/features/dashboard/components/monthly-category-breakdown"
import { formatMonth } from "@/lib/format"

function firstOfMonth(date: Date): string {
  // Built directly from local date parts (no Date -> toISOString round
  // trip): that conversion shifts to UTC, which rolls the 1st back to the
  // last day of the previous month for any positive UTC-offset timezone
  // (e.g. local midnight July 1 at UTC+8 is June 30 16:00 UTC), producing a
  // month string that doesn't match the transaction the user just recorded.
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

export function DashboardPage() {
  const [monthOffset, setMonthOffset] = React.useState(0)

  const monthDate = new Date()
  monthDate.setMonth(monthDate.getMonth() + monthOffset)
  const month = firstOfMonth(monthDate)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthOffset((m) => m - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-36 text-center text-sm font-medium">{formatMonth(monthDate)}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthOffset((m) => m + 1)}
            disabled={monthOffset >= 0}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <WalletBalanceSummary month={month} />

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="expense">
          <MonthlyCategoryBreakdown month={month} transactionType="expense" />
        </TabsContent>
        <TabsContent value="income">
          <MonthlyCategoryBreakdown month={month} transactionType="income" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
