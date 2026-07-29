import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesUpdate } from "@/types/database"

export type Settings = Tables<"settings">
export type SettingsUpdateInput = Omit<
  TablesUpdate<"settings">,
  "user_id" | "created_at" | "updated_at"
>

export class SettingsRepository {
  /**
   * The settings row is auto-created by the handle_new_auth_user trigger
   * when the user's auth row is created, so this should always find one.
   */
  async get(userId: string): Promise<Settings> {
    return unwrap(supabase.from("settings").select("*").eq("user_id", userId).single())
  }

  async update(userId: string, input: SettingsUpdateInput): Promise<Settings> {
    return unwrap(
      supabase.from("settings").update(input).eq("user_id", userId).select().single()
    )
  }
}

export const settingsRepository = new SettingsRepository()
