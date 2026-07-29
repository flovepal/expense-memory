import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables } from "@/types/database"

export type Currency = Tables<"currencies">

export class CurrenciesRepository {
  async list(): Promise<Currency[]> {
    return unwrap(
      supabase.from("currencies").select("*").eq("is_active", true).order("code")
    )
  }
}

export const currenciesRepository = new CurrenciesRepository()
