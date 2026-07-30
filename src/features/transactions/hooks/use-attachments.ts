import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  transactionAttachmentsRepository,
  type TransactionAttachment,
} from "@/services/repositories/transaction-attachments.repository"
import { transactionKeys } from "@/features/transactions/hooks/use-transactions"

export const attachmentKeys = {
  all: ["transaction-attachments"] as const,
  forTransaction: (transactionId: string) =>
    [...attachmentKeys.all, "list", transactionId] as const,
  signedUrls: (paths: string[]) =>
    [...attachmentKeys.all, "signed-urls", [...paths].sort()] as const,
}

export function useTransactionAttachments(transactionId: string | undefined) {
  return useQuery({
    queryKey: attachmentKeys.forTransaction(transactionId ?? ""),
    queryFn: () => transactionAttachmentsRepository.listForTransaction(transactionId!),
    enabled: !!transactionId,
  })
}

/** Batches signed-URL lookups for however many attachment paths are currently visible (e.g. across a whole transaction list). */
export function useAttachmentSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: attachmentKeys.signedUrls(paths),
    queryFn: () => transactionAttachmentsRepository.getSignedUrls(paths),
    enabled: paths.length > 0,
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      transactionId,
      userId,
      file,
    }: {
      transactionId: string
      userId: string
      file: File
    }) => transactionAttachmentsRepository.upload(transactionId, userId, file),
    onSuccess: (_result, { transactionId }) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.forTransaction(transactionId) })
      // transactions_detailed embeds each transaction's attachments, so the
      // list/detail views need refreshing too, not just the gallery's own query.
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachment: TransactionAttachment) =>
      transactionAttachmentsRepository.remove(attachment),
    onSuccess: (_result, attachment) => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.forTransaction(attachment.transaction_id),
      })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}
