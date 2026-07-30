import { z } from "zod"

import { TRANSACTION_RECORD_TYPES } from "@/types/enums"

export const transactionFormSchema = z
  .object({
    wallet_id: z.string().min(1, "Wallet is required"),
    transaction_type: z.enum(TRANSACTION_RECORD_TYPES),
    category_id: z.string().optional(),
    subcategory_id: z.string().optional(),
    to_wallet_id: z.string().optional(),
    merchant: z.string().optional(),
    amount: z.number().positive("Amount must be greater than 0"),
    occurred_at: z.string().min(1, "Date is required"),
    note: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.transaction_type === "transfer") {
      if (!values.to_wallet_id) {
        ctx.addIssue({
          code: "custom",
          path: ["to_wallet_id"],
          message: "Destination wallet is required",
        })
      } else if (values.to_wallet_id === values.wallet_id) {
        ctx.addIssue({
          code: "custom",
          path: ["to_wallet_id"],
          message: "Destination wallet must be different from the source wallet",
        })
      }
    } else if (!values.category_id) {
      ctx.addIssue({
        code: "custom",
        path: ["category_id"],
        message: "Category is required",
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
