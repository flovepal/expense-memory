import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  walletsRepository,
  type WalletCreateInput,
  type WalletUpdateInput,
} from "@/services/repositories/wallets.repository"

export const walletKeys = {
  all: ["wallets"] as const,
  lists: () => [...walletKeys.all, "list"] as const,
  detail: (id: string) => [...walletKeys.all, "detail", id] as const,
  balances: () => [...walletKeys.all, "balances"] as const,
}

export function useWallets() {
  return useQuery({
    queryKey: walletKeys.lists(),
    queryFn: () => walletsRepository.list(),
  })
}

export function useWallet(id: string | undefined) {
  return useQuery({
    queryKey: walletKeys.detail(id ?? ""),
    queryFn: () => walletsRepository.get(id!),
    enabled: !!id,
  })
}

export function useWalletBalances() {
  return useQuery({
    queryKey: walletKeys.balances(),
    queryFn: () => walletsRepository.listBalances(),
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WalletCreateInput) => walletsRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: walletKeys.balances() })
    },
  })
}

export function useUpdateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WalletUpdateInput }) =>
      walletsRepository.update(id, input),
    onSuccess: (wallet) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: walletKeys.balances() })
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(wallet.id) })
    },
  })
}

export function useSetWalletArchived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      walletsRepository.setArchived(id, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: walletKeys.balances() })
    },
  })
}

export function useDeleteWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => walletsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: walletKeys.balances() })
    },
  })
}
