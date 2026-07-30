import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  transactionDishesRepository,
  type TransactionDishItemInput,
} from "@/services/repositories/transaction-dishes.repository"
import { transactionKeys } from "@/features/transactions/hooks/use-transactions"

export function useCreateTransactionDishItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      transactionId,
      items,
    }: {
      transactionId: string
      items: TransactionDishItemInput[]
    }) => transactionDishesRepository.createMany(transactionId, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}
