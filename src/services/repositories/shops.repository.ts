import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Shop = Tables<"shops">

type ShopInsert = TablesInsert<"shops">
export type ShopCreateInput = Omit<
  ShopInsert,
  "id" | "user_id" | "created_at" | "updated_at" | "deleted_at"
>

export class ShopsRepository {
  async list(): Promise<Shop[]> {
    return unwrap(
      supabase.from("shops").select("*").is("deleted_at", null).order("name")
    )
  }

  async create(input: ShopCreateInput): Promise<Shop> {
    return unwrap(supabase.from("shops").insert(input).select().single())
  }

  async softDelete(id: string): Promise<Shop> {
    return unwrap(
      supabase
        .from("shops")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    )
  }
}

export const shopsRepository = new ShopsRepository()
