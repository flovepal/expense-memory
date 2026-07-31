import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Dish = Tables<"dishes">

type DishInsert = TablesInsert<"dishes">
export type DishCreateInput = Omit<DishInsert, "id" | "user_id" | "created_at" | "updated_at">
export type DishUpdateInput = Partial<DishCreateInput>

export class DishesRepository {
  /** Scoped to one shop for the transaction-flow picker; omit shopId for the Food Log's cross-shop search. */
  async list(shopId?: string): Promise<Dish[]> {
    let query = supabase.from("dishes").select("*")
    if (shopId) query = query.eq("shop_id", shopId)
    return unwrap(query.order("name"))
  }

  async get(id: string): Promise<Dish> {
    return unwrap(supabase.from("dishes").select("*").eq("id", id).single())
  }

  async create(input: DishCreateInput): Promise<Dish> {
    return unwrap(supabase.from("dishes").insert(input).select().single())
  }

  async update(id: string, input: DishUpdateInput): Promise<Dish> {
    return unwrap(supabase.from("dishes").update(input).eq("id", id).select().single())
  }

  /** Old transaction line items and food log entries referencing this dish keep their snapshot, just lose the dish_id link (SET NULL). */
  async delete(id: string): Promise<void> {
    return unwrapVoid(supabase.from("dishes").delete().eq("id", id))
  }
}

export const dishesRepository = new DishesRepository()
