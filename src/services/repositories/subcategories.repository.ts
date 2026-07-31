import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Subcategory = Tables<"subcategories">

type SubcategoryInsert = TablesInsert<"subcategories">
export type SubcategoryCreateInput = Omit<
  SubcategoryInsert,
  "id" | "user_id" | "created_at" | "updated_at"
>
export type SubcategoryUpdateInput = Partial<SubcategoryCreateInput>

export class SubcategoriesRepository {
  async listByCategory(categoryId: string): Promise<Subcategory[]> {
    return unwrap(
      supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .order("display_order")
    )
  }

  async create(input: SubcategoryCreateInput): Promise<Subcategory> {
    return unwrap(supabase.from("subcategories").insert(input).select().single())
  }

  async update(id: string, input: SubcategoryUpdateInput): Promise<Subcategory> {
    return unwrap(
      supabase.from("subcategories").update(input).eq("id", id).select().single()
    )
  }

  async delete(id: string): Promise<void> {
    return unwrapVoid(supabase.from("subcategories").delete().eq("id", id))
  }
}

export const subcategoriesRepository = new SubcategoriesRepository()
