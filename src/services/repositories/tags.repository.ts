import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Tag = Tables<"tags">

type TagInsert = TablesInsert<"tags">
export type TagCreateInput = Omit<
  TagInsert,
  "id" | "user_id" | "created_at" | "updated_at" | "deleted_at"
>
export type TagUpdateInput = Partial<TagCreateInput>

export class TagsRepository {
  async list(): Promise<Tag[]> {
    return unwrap(
      supabase.from("tags").select("*").is("deleted_at", null).order("name")
    )
  }

  async create(input: TagCreateInput): Promise<Tag> {
    return unwrap(supabase.from("tags").insert(input).select().single())
  }

  async update(id: string, input: TagUpdateInput): Promise<Tag> {
    return unwrap(supabase.from("tags").update(input).eq("id", id).select().single())
  }

  async softDelete(id: string): Promise<Tag> {
    return unwrap(
      supabase
        .from("tags")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    )
  }
}

export const tagsRepository = new TagsRepository()
