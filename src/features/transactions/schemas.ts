import { z } from "zod"

import { TRANSACTION_TYPES } from "@/types/enums"

export const transactionFormSchema = z.object({
  wallet_id: z.string().min(1, "Wallet is required"),
  transaction_type: z.enum(TRANSACTION_TYPES),
  category_id: z.string().min(1, "Category is required"),
  subcategory_id: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  occurred_at: z.string().min(1, "Date is required"),
  note: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
