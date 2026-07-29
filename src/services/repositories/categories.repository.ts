import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { TransactionType } from "@/types/enums"
import type { Tables, TablesInsert } from "@/types/database"

export type Category = Tables<"categories">

type CategoryInsert = TablesInsert<"categories">
export type CategoryCreateInput = Omit<
  CategoryInsert,
  "id" | "user_id" | "created_at" | "updated_at" | "deleted_at"
>
export type CategoryUpdateInput = Partial<CategoryCreateInput>

export class CategoriesRepository {
  /** Returns both system defaults (user_id null) and the caller's own custom categories — RLS decides visibility. */
  async list(transactionType?: TransactionType): Promise<Category[]> {
    let query = supabase.from("categories").select("*").is("deleted_at", null)
    if (transactionType) {
      query = query.eq("transaction_type", transactionType)
    }
    return unwrap(query.order("display_order"))
  }

  async get(id: string): Promise<Category> {
    return unwrap(supabase.from("categories").select("*").eq("id", id).single())
  }

  async create(input: CategoryCreateInput): Promise<Category> {
    return unwrap(supabase.from("categories").insert(input).select().single())
  }

  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    return unwrap(supabase.from("categories").update(input).eq("id", id).select().single())
  }

  /** No-op (via RLS) if the target is a system default rather than the caller's own category. */
  async softDelete(id: string): Promise<Category> {
    return unwrap(
      supabase
        .from("categories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    )
  }
}

export const categoriesRepository = new CategoriesRepository()
