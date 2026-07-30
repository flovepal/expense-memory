import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  foodLogRepository,
  type FoodLogEntryCreateInput,
  type FoodLogEntryUpdateInput,
} from "@/services/repositories/food-log.repository"

export const foodLogKeys = {
  all: ["food-log"] as const,
  lists: () => [...foodLogKeys.all, "list"] as const,
}

export function useFoodLogEntries() {
  return useQuery({
    queryKey: foodLogKeys.lists(),
    queryFn: () => foodLogRepository.list(),
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

export function useDeleteFoodLogEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => foodLogRepository.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodLogKeys.lists() }),
  })
}
