import { z } from "zod"

import { ANSWER_TYPES, TRANSACTION_TYPES } from "@/types/enums"

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  transaction_type: z.enum(TRANSACTION_TYPES),
  icon: z.string().optional(),
  color: z.string().optional(),
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const subcategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  icon: z.string().optional(),
})
export type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>

export const questionOptionSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  value: z.string().trim().min(1, "Value is required"),
})

export const questionFormSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required").max(200),
  answer_type: z.enum(ANSWER_TYPES),
  is_required: z.boolean(),
  options: z.array(questionOptionSchema),
})
export type QuestionFormValues = z.infer<typeof questionFormSchema>
