import { supabase } from "@/lib/supabase/client"
import { unwrap } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type TransactionDishItem = Tables<"transaction_dish_items">

export type TransactionDishItemInput = {
  dish_id?: string | null
  dish_name: string
  unit_price: number
  quantity: number
  currency_id?: string | null
  image_storage_path?: string | null
}

export class TransactionDishesRepository {
  /** Bulk insert after the transaction itself is created — same two-step "create parent, then attach children" pattern as attachment uploads. */
  async createMany(
    transactionId: string,
    items: TransactionDishItemInput[]
  ): Promise<TransactionDishItem[]> {
    const rows: TablesInsert<"transaction_dish_items">[] = items.map((item) => ({
      transaction_id: transactionId,
      dish_id: item.dish_id ?? null,
      dish_name: item.dish_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      currency_id: item.currency_id ?? null,
      image_storage_path: item.image_storage_path ?? null,
    }))
    return unwrap(supabase.from("transaction_dish_items").insert(rows).select())
  }
}

export const transactionDishesRepository = new TransactionDishesRepository()
