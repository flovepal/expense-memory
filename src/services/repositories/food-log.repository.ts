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

export class FoodLogRepository {
  async list(): Promise<FoodLogEntry[]> {
    return unwrap(
      supabase
        .from("food_log_entries")
        .select("*")
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false })
    )
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
