import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert, Views } from "@/types/database"

export type Wallet = Tables<"wallets">
export type WalletBalance = Views<"wallet_balances">

type WalletInsert = TablesInsert<"wallets">
export type WalletCreateInput = Omit<WalletInsert, "id" | "user_id" | "created_at" | "updated_at">
export type WalletUpdateInput = Partial<WalletCreateInput>

export class WalletsRepository {
  async list(): Promise<Wallet[]> {
    return unwrap(supabase.from("wallets").select("*").order("display_order"))
  }

  async get(id: string): Promise<Wallet> {
    return unwrap(supabase.from("wallets").select("*").eq("id", id).single())
  }

  async create(input: WalletCreateInput): Promise<Wallet> {
    return unwrap(supabase.from("wallets").insert(input).select().single())
  }

  async update(id: string, input: WalletUpdateInput): Promise<Wallet> {
    return unwrap(supabase.from("wallets").update(input).eq("id", id).select().single())
  }

  async setArchived(id: string, isArchived: boolean): Promise<Wallet> {
    return this.update(id, { is_archived: isArchived })
  }

  async delete(id: string): Promise<void> {
    return unwrapVoid(supabase.from("wallets").delete().eq("id", id))
  }

  async listBalances(): Promise<WalletBalance[]> {
    return unwrap(supabase.from("wallet_balances").select("*"))
  }
}

export const walletsRepository = new WalletsRepository()
