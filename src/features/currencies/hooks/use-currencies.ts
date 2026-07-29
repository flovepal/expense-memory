import { useQuery } from "@tanstack/react-query"

import { currenciesRepository } from "@/services/repositories/currencies.repository"

export const currencyKeys = {
  all: ["currencies"] as const,
  lists: () => [...currencyKeys.all, "list"] as const,
}

export function useCurrencies() {
  return useQuery({
    queryKey: currencyKeys.lists(),
    queryFn: () => currenciesRepository.list(),
    staleTime: 60 * 60 * 1000, // reference data, changes rarely
  })
}
