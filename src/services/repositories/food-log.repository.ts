import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type FoodLogEntry = Tables<"food_log_entries">

type FoodLogEntryInsert = TablesInsert<"food_log_entries">
export type FoodLogEntryCreateInput = Omit<
  FoodLogEntryInsert,
  "id" | "user_id" | "created_at" | "updated_at" | "deleted_at"
>
export type FoodLogEntryUpdateInput = Partial<FoodLogEntryCreateInput>

export type FoodLogEntryFilters = {
  shop?: string
  dishCategoryId?: string
}

export class FoodLogRepository {
  /** For browsing "what to eat where" — filter by shop or dish category. */
  async list(filters: FoodLogEntryFilters = {}): Promise<FoodLogEntry[]> {
    let query = supabase.from("food_log_entries").select("*").is("deleted_at", null)
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

  async softDelete(id: string): Promise<FoodLogEntry> {
    return unwrap(
      supabase
        .from("food_log_entries")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    )
  }
}

export const foodLogRepository = new FoodLogRepository()
