import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  dishesRepository,
  type DishCreateInput,
  type DishUpdateInput,
} from "@/services/repositories/dishes.repository"

export const dishKeys = {
  all: ["dishes"] as const,
  lists: () => [...dishKeys.all, "list"] as const,
  list: (shopId?: string) => [...dishKeys.lists(), shopId ?? "all"] as const,
  detail: (id: string) => [...dishKeys.all, "detail", id] as const,
}

/** Omit shopId for the Food Log's cross-shop search; pass it to scope the transaction-flow picker to one shop. */
export function useDishes(shopId?: string) {
  return useQuery({
    queryKey: dishKeys.list(shopId),
    queryFn: () => dishesRepository.list(shopId),
  })
}

export function useDish(id: string | undefined) {
  return useQuery({
    queryKey: dishKeys.detail(id ?? ""),
    queryFn: () => dishesRepository.get(id!),
    enabled: !!id,
  })
}

export function useCreateDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DishCreateInput) => dishesRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dishKeys.lists() }),
  })
}

export function useUpdateDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DishUpdateInput }) =>
      dishesRepository.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dishKeys.lists() }),
  })
}

export function useDeleteDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dishesRepository.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dishKeys.lists() }),
  })
}
