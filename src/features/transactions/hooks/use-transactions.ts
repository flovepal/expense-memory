import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  transactionsRepository,
  type TransactionListFilters,
  type TransactionWriteInput,
} from "@/services/repositories/transactions.repository"
import { walletKeys } from "@/features/wallets/hooks/use-wallets"
import { dashboardKeys } from "@/features/dashboard/hooks/use-dashboard"

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionListFilters) => [...transactionKeys.lists(), filters] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
}

export function useTransactions(filters: TransactionListFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionsRepository.list(filters),
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.detail(id ?? ""),
    queryFn: () => transactionsRepository.get(id!),
    enabled: !!id,
  })
}

/** A transaction touches wallet balances and dashboard summaries too, so every mutation invalidates all three. */
function invalidateTransactionEffects(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.all })
  queryClient.invalidateQueries({ queryKey: walletKeys.balances() })
  queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TransactionWriteInput) => transactionsRepository.create(input),
    onSuccess: () => invalidateTransactionEffects(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionWriteInput }) =>
      transactionsRepository.update(id, input),
    onSuccess: () => invalidateTransactionEffects(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionsRepository.softDelete(id),
    onSuccess: () => invalidateTransactionEffects(queryClient),
  })
}
