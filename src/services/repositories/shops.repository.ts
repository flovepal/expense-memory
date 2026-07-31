import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Shop = Tables<"shops">

type ShopInsert = TablesInsert<"shops">
export type ShopCreateInput = Omit<ShopInsert, "id" | "user_id" | "created_at" | "updated_at">

export class ShopsRepository {
  async list(): Promise<Shop[]> {
    return unwrap(supabase.from("shops").select("*").order("name"))
  }

  async create(input: ShopCreateInput): Promise<Shop> {
    return unwrap(supabase.from("shops").insert(input).select().single())
  }

  /** Cascades to delete every dish at this shop (see dishes.shop_id ON DELETE CASCADE). */
  async delete(id: string): Promise<void> {
    return unwrapVoid(supabase.from("shops").delete().eq("id", id))
  }
}

export const shopsRepository = new ShopsRepository()
