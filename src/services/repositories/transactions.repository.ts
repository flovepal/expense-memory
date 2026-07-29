import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Database } from "@/lib/supabase/database.types"
import type { Tables, Views } from "@/types/database"
import type { AnswerType, TransactionType } from "@/types/enums"

// supabase gen types marks every RPC parameter as required non-null, which
// doesn't reflect that p_subcategory_id/p_occurred_at/p_note are legitimately
// nullable in these plpgsql functions. Widening them here (and casting at
// the call site) is simpler than restructuring the SQL just to satisfy the
// generator.
type NullableRpcArgs<Args, K extends keyof Args> = Omit<Args, K> & Record<K, string | null>
type NullableTransactionArgKeys = "p_subcategory_id" | "p_occurred_at" | "p_note"
type CreateTransactionArgs = NullableRpcArgs<
  Database["public"]["Functions"]["create_transaction"]["Args"],
  NullableTransactionArgKeys
>
type UpdateTransactionArgs = NullableRpcArgs<
  Database["public"]["Functions"]["update_transaction"]["Args"],
  NullableTransactionArgKeys
>

export type Transaction = Tables<"transactions">
export type TransactionDetailed = Views<"transactions_detailed">

export type TransactionAnswerInput = {
  question_id: string
  answer_type: AnswerType
  answer_text?: string | null
  answer_number?: number | null
  answer_boolean?: boolean | null
  answer_date?: string | null
  selected_option_id?: string | null
  selected_option_ids?: string[] | null
}

export type TransactionWriteInput = {
  wallet_id: string
  category_id: string
  subcategory_id?: string | null
  transaction_type: TransactionType
  amount: number
  occurred_at?: string | null
  note?: string | null
  answers?: TransactionAnswerInput[]
  tag_ids?: string[]
}

export type TransactionListFilters = {
  walletId?: string
  categoryId?: string
  transactionType?: TransactionType
  from?: string
  to?: string
  limit?: number
}

export class TransactionsRepository {
  async list(filters: TransactionListFilters = {}): Promise<TransactionDetailed[]> {
    let query = supabase.from("transactions_detailed").select("*")

    if (filters.walletId) query = query.eq("wallet_id", filters.walletId)
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId)
    if (filters.transactionType) query = query.eq("transaction_type", filters.transactionType)
    if (filters.from) query = query.gte("occurred_at", filters.from)
    if (filters.to) query = query.lte("occurred_at", filters.to)

    query = query.order("occurred_at", { ascending: false }).limit(filters.limit ?? 100)

    return unwrap(query)
  }

  async get(id: string): Promise<TransactionDetailed> {
    return unwrap(
      supabase.from("transactions_detailed").select("*").eq("id", id).single()
    )
  }

  async create(input: TransactionWriteInput): Promise<Transaction> {
    const args: CreateTransactionArgs = {
      p_wallet_id: input.wallet_id,
      p_category_id: input.category_id,
      p_subcategory_id: input.subcategory_id ?? null,
      p_transaction_type: input.transaction_type,
      p_amount: input.amount,
      p_occurred_at: input.occurred_at ?? null,
      p_note: input.note ?? null,
      p_answers: (input.answers ?? []).map(toAnswerRow),
      p_tag_ids: input.tag_ids ?? [],
    }
    return unwrap(
      supabase.rpc(
        "create_transaction",
        args as Database["public"]["Functions"]["create_transaction"]["Args"]
      )
    )
  }

  async update(id: string, input: TransactionWriteInput): Promise<Transaction> {
    const args: UpdateTransactionArgs = {
      p_transaction_id: id,
      p_wallet_id: input.wallet_id,
      p_category_id: input.category_id,
      p_subcategory_id: input.subcategory_id ?? null,
      p_transaction_type: input.transaction_type,
      p_amount: input.amount,
      p_occurred_at: input.occurred_at ?? null,
      p_note: input.note ?? null,
      p_answers: (input.answers ?? []).map(toAnswerRow),
      p_tag_ids: input.tag_ids ?? [],
    }
    return unwrap(
      supabase.rpc(
        "update_transaction",
        args as Database["public"]["Functions"]["update_transaction"]["Args"]
      )
    )
  }

  async softDelete(id: string): Promise<void> {
    return unwrapVoid(
      supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
    )
  }
}

function toAnswerRow(answer: TransactionAnswerInput) {
  return {
    question_id: answer.question_id,
    answer_text: answer.answer_type === "text" ? answer.answer_text : null,
    answer_number: answer.answer_type === "number" ? answer.answer_number : null,
    answer_boolean: answer.answer_type === "boolean" ? answer.answer_boolean : null,
    answer_date: answer.answer_type === "date" ? answer.answer_date : null,
    selected_option_id:
      answer.answer_type === "single_select" ? answer.selected_option_id : null,
    selected_option_ids:
      answer.answer_type === "multi_select" ? answer.selected_option_ids : null,
  }
}

export const transactionsRepository = new TransactionsRepository()
