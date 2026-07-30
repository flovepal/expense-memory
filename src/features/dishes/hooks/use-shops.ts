import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { shopsRepository, type ShopCreateInput } from "@/services/repositories/shops.repository"

export const shopKeys = {
  all: ["shops"] as const,
  lists: () => [...shopKeys.all, "list"] as const,
}

export function useShops() {
  return useQuery({
    queryKey: shopKeys.lists(),
    queryFn: () => shopsRepository.list(),
  })
}

export function useCreateShop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ShopCreateInput) => shopsRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shopKeys.lists() }),
  })
}
