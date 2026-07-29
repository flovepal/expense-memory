import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  categoriesRepository,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from "@/services/repositories/categories.repository"
import type { TransactionType } from "@/types/enums"

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (transactionType?: TransactionType) =>
    [...categoryKeys.lists(), transactionType ?? "all"] as const,
}

export function useCategories(transactionType?: TransactionType) {
  return useQuery({
    queryKey: categoryKeys.list(transactionType),
    queryFn: () => categoriesRepository.list(transactionType),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryCreateInput) => categoriesRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.lists() }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryUpdateInput }) =>
      categoriesRepository.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.lists() }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesRepository.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.lists() }),
  })
}
