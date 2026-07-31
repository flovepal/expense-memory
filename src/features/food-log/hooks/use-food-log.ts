import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  foodLogRepository,
  type EnsureFoodLogEntryInput,
  type FoodLogEntry,
  type FoodLogEntryCreateInput,
  type FoodLogEntryFilters,
  type FoodLogEntryUpdateInput,
} from "@/services/repositories/food-log.repository"

export const foodLogKeys = {
  all: ["food-log"] as const,
  lists: () => [...foodLogKeys.all, "list"] as const,
  list: (filters: FoodLogEntryFilters) => [...foodLogKeys.lists(), filters] as const,
  shops: () => [...foodLogKeys.all, "shops"] as const,
}

export function useFoodLogEntries(filters: FoodLogEntryFilters = {}) {
  return useQuery({
    queryKey: foodLogKeys.list(filters),
    queryFn: () => foodLogRepository.list(filters),
  })
}

/** Distinct shop names for the Food Log's filter dropdown. Invalidated automatically whenever an entry is created/updated (covered by foodLogKeys.all). */
export function useFoodLogShops() {
  return useQuery({
    queryKey: foodLogKeys.shops(),
    queryFn: () => foodLogRepository.listShops(),
  })
}

export function useCreateFoodLogEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FoodLogEntryCreateInput) => foodLogRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodLogKeys.lists() }),
  })
}

export function useUpdateFoodLogEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FoodLogEntryUpdateInput }) =>
      foodLogRepository.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodLogKeys.lists() }),
  })
}

/** Called right after a Food transaction saves its dish cart — one entry per dish, created only if it doesn't already have one. */
export function useEnsureFoodLogEntriesForDishes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: EnsureFoodLogEntryInput[]): Promise<FoodLogEntry[]> =>
      Promise.all(items.map((item) => foodLogRepository.ensureForDish(item))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodLogKeys.lists() }),
  })
}

export function useDeleteFoodLogEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => foodLogRepository.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodLogKeys.lists() }),
  })
}
