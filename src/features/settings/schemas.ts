import { z } from "zod"

import { THEME_PREFERENCES } from "@/types/enums"

export const settingsFormSchema = z.object({
  default_currency_id: z.string().min(1, "Currency is required"),
  locale: z.string().trim().min(1, "Locale is required"),
  theme: z.enum(THEME_PREFERENCES),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>
