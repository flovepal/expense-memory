import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Views } from "@/types/database"

export type MonthlyCategorySummary = Views<"monthly_category_summary">

export class DashboardRepository {
  /** Category totals for a given month (first-of-month date, e.g. "2026-07-01"). */
  async monthlyCategorySummary(month: string): Promise<MonthlyCategorySummary[]> {
    return unwrap(
      supabase
        .from("monthly_category_summary")
        .select("*")
        .eq("month", month)
        .order("total_amount", { ascending: false })
    )
  }
}

export const dashboardRepository = new DashboardRepository()
