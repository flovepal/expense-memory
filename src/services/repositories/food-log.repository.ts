import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type FoodLogEntry = Tables<"food_log_entries">

type FoodLogEntryInsert = TablesInsert<"food_log_entries">
export type FoodLogEntryCreateInput = Omit<
  FoodLogEntryInsert,
  "id" | "user_id" | "created_at" | "updated_at"
>
export type FoodLogEntryUpdateInput = Partial<FoodLogEntryCreateInput>

export type FoodLogEntryFilters = {
  shop?: string
  dishCategoryId?: string
}

export type EnsureFoodLogEntryInput = {
  dish_id: string
  food_name: string
  shop?: string | null
  price?: number | null
  currency_id?: string | null
  dish_category_id?: string | null
  image_storage_path?: string | null
  occurred_at?: string
}

export class FoodLogRepository {
  /** For browsing "what to eat where" — filter by shop or dish category. */
  async list(filters: FoodLogEntryFilters = {}): Promise<FoodLogEntry[]> {
    let query = supabase.from("food_log_entries").select("*")
    if (filters.shop) query = query.eq("shop", filters.shop)
    if (filters.dishCategoryId) query = query.eq("dish_category_id", filters.dishCategoryId)
    return unwrap(
      query.order("occurred_at", { ascending: false }).order("created_at", { ascending: false })
    )
  }

  /** Distinct shop names the user has logged food at, for the filter dropdown. */
  async listShops(): Promise<string[]> {
    const rows = await unwrap<{ shop: string | null }[]>(
      supabase.from("food_log_entries").select("shop").not("shop", "is", null)
    )
    return Array.from(new Set(rows.map((r) => r.shop).filter((s): s is string => !!s))).sort()
  }

  async create(input: FoodLogEntryCreateInput): Promise<FoodLogEntry> {
    return unwrap(supabase.from("food_log_entries").insert(input).select().single())
  }

  async update(id: string, input: FoodLogEntryUpdateInput): Promise<FoodLogEntry> {
    return unwrap(supabase.from("food_log_entries").update(input).eq("id", id).select().single())
  }

  async delete(id: string): Promise<void> {
    return unwrapVoid(supabase.from("food_log_entries").delete().eq("id", id))
  }

  async getByDishId(dishId: string): Promise<FoodLogEntry | null> {
    const rows = await unwrap<FoodLogEntry[]>(
      supabase.from("food_log_entries").select("*").eq("dish_id", dishId).limit(1)
    )
    return rows[0] ?? null
  }

  /**
   * A dish now gets logged the moment it's bought, not just when the taste
   * questionnaire is filled in — so it always shows up in the Food Log tab.
   * Returns the existing entry untouched if this dish already has one
   * (never overwrites taste data on a repeat purchase); otherwise creates a
   * bare, unrated placeholder (overall_rating 0, would_order_again null)
   * that the user fills in later from the list.
   */
  async ensureForDish(input: EnsureFoodLogEntryInput): Promise<FoodLogEntry> {
    const existing = await this.getByDishId(input.dish_id)
    if (existing) return existing
    return unwrap(
      supabase
        .from("food_log_entries")
        .insert({
          dish_id: input.dish_id,
          food_name: input.food_name,
          shop: input.shop ?? null,
          price: input.price ?? null,
          currency_id: input.currency_id ?? null,
          dish_category_id: input.dish_category_id ?? null,
          image_storage_path: input.image_storage_path ?? null,
          occurred_at: input.occurred_at ?? new Date().toISOString(),
          overall_rating: 0,
          flavors: [],
          texture: [],
          would_order_again: null,
        })
        .select()
        .single()
    )
  }
}

export const foodLogRepository = new FoodLogRepository()
