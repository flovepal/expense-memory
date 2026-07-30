import { z } from "zod"

export const FLAVORS = ["sweet", "salty", "sour", "bitter", "spicy", "umami"] as const
export type Flavor = (typeof FLAVORS)[number]
export const FLAVOR_LABELS: Record<Flavor, string> = {
  sweet: "Sweet",
  salty: "Salty",
  sour: "Sour",
  bitter: "Bitter",
  spicy: "Spicy",
  umami: "Umami",
}

export const TEXTURES = ["crunchy", "crispy", "chewy", "soft", "creamy", "tender"] as const
export type Texture = (typeof TEXTURES)[number]
export const TEXTURE_LABELS: Record<Texture, string> = {
  crunchy: "Crunchy",
  crispy: "Crispy",
  chewy: "Chewy",
  soft: "Soft",
  creamy: "Creamy",
  tender: "Tender",
}

export const WOULD_ORDER_AGAIN_OPTIONS = ["yes", "no", "maybe"] as const
export type WouldOrderAgain = (typeof WOULD_ORDER_AGAIN_OPTIONS)[number]
export const WOULD_ORDER_AGAIN_LABELS: Record<WouldOrderAgain, string> = {
  yes: "Yes",
  no: "No",
  maybe: "Maybe",
}

export const foodLogFormSchema = z.object({
  food_name: z.string().trim().min(1, "Food name is required").max(200),
  shop: z.string().trim().max(200).optional(),
  price: z.number().nonnegative().optional(),
  currency_id: z.string().optional(),
  occurred_at: z.string().min(1, "Date is required"),
  overall_rating: z.number().int().min(1, "Rating is required").max(5),
  flavors: z.array(z.enum(FLAVORS)),
  texture: z.array(z.enum(TEXTURES)),
  would_order_again: z.enum(WOULD_ORDER_AGAIN_OPTIONS),
  notes: z.string().trim().max(2000).optional(),
})

export type FoodLogFormValues = z.infer<typeof foodLogFormSchema>
