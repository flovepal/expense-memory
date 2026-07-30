import { z } from "zod"

export const dishQuickAddFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  price: z.number().nonnegative("Price can't be negative"),
  currency_id: z.string().min(1, "Currency is required"),
  dish_category_id: z.string().optional(),
})

export type DishQuickAddFormValues = z.infer<typeof dishQuickAddFormSchema>
