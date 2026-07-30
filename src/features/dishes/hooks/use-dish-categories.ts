import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  dishCategoriesRepository,
  type DishCategoryCreateInput,
} from "@/services/repositories/dish-categories.repository"

export const dishCategoryKeys = {
  all: ["dish-categories"] as const,
  lists: () => [...dishCategoryKeys.all, "list"] as const,
}

export function useDishCategories() {
  return useQuery({
    queryKey: dishCategoryKeys.lists(),
    queryFn: () => dishCategoriesRepository.list(),
    staleTime: 60 * 60 * 1000, // mostly-static reference data, changes rarely
  })
}

export function useCreateDishCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DishCategoryCreateInput) => dishCategoriesRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dishCategoryKeys.lists() }),
  })
}
