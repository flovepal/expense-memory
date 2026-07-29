import { z } from "zod"

import { WALLET_TYPES } from "@/types/enums"

export const walletFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  type: z.enum(WALLET_TYPES),
  currency_id: z.string().min(1, "Currency is required"),
  initial_balance: z.number().finite(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export type WalletFormValues = z.infer<typeof walletFormSchema>
