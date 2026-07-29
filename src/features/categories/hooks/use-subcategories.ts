import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  subcategoriesRepository,
  type SubcategoryCreateInput,
  type SubcategoryUpdateInput,
} from "@/services/repositories/subcategories.repository"

export const subcategoryKeys = {
  all: ["subcategories"] as const,
  byCategory: (categoryId: string) => [...subcategoryKeys.all, categoryId] as const,
}

export function useSubcategories(categoryId: string | undefined) {
  return useQuery({
    queryKey: subcategoryKeys.byCategory(categoryId ?? ""),
    queryFn: () => subcategoriesRepository.listByCategory(categoryId!),
    enabled: !!categoryId,
  })
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SubcategoryCreateInput) => subcategoriesRepository.create(input),
    onSuccess: (subcategory) =>
      queryClient.invalidateQueries({
        queryKey: subcategoryKeys.byCategory(subcategory.category_id),
      }),
  })
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubcategoryUpdateInput }) =>
      subcategoriesRepository.update(id, input),
    onSuccess: (subcategory) =>
      queryClient.invalidateQueries({
        queryKey: subcategoryKeys.byCategory(subcategory.category_id),
      }),
  })
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subcategoriesRepository.softDelete(id),
    onSuccess: (subcategory) =>
      queryClient.invalidateQueries({
        queryKey: subcategoryKeys.byCategory(subcategory.category_id),
      }),
  })
}
