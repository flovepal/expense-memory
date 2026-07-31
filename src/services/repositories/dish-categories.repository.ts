import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type DishCategory = Tables<"dish_categories">

type DishCategoryInsert = TablesInsert<"dish_categories">
export type DishCategoryCreateInput = Omit<
  DishCategoryInsert,
  "id" | "user_id" | "created_at" | "updated_at"
>

export class DishCategoriesRepository {
  /** Returns both system defaults (user_id null) and the caller's own custom ones — RLS decides visibility. */
  async list(): Promise<DishCategory[]> {
    return unwrap(supabase.from("dish_categories").select("*").order("display_order"))
  }

  async create(input: DishCategoryCreateInput): Promise<DishCategory> {
    return unwrap(supabase.from("dish_categories").insert(input).select().single())
  }
}

export const dishCategoriesRepository = new DishCategoriesRepository()
