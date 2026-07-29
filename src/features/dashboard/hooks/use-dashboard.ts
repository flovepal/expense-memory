import { useQuery } from "@tanstack/react-query"

import { dashboardRepository } from "@/services/repositories/dashboard.repository"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  monthlyCategorySummary: (month: string) =>
    [...dashboardKeys.all, "monthly-category-summary", month] as const,
}

/** month must be a first-of-month date string, e.g. "2026-07-01". */
export function useMonthlyCategorySummary(month: string) {
  return useQuery({
    queryKey: dashboardKeys.monthlyCategorySummary(month),
    queryFn: () => dashboardRepository.monthlyCategorySummary(month),
  })
}
