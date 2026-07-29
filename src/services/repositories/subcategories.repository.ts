import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Subcategory = Tables<"subcategories">

type SubcategoryInsert = TablesInsert<"subcategories">
export type SubcategoryCreateInput = Omit<
  SubcategoryInsert,
  "id" | "user_id" | "created_at" | "updated_at" | "deleted_at"
>
export type SubcategoryUpdateInput = Partial<SubcategoryCreateInput>

export class SubcategoriesRepository {
  async listByCategory(categoryId: string): Promise<Subcategory[]> {
    return unwrap(
      supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .is("deleted_at", null)
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

  async softDelete(id: string): Promise<Subcategory> {
    return unwrap(
      supabase
        .from("subcategories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    )
  }
}

export const subcategoriesRepository = new SubcategoriesRepository()
