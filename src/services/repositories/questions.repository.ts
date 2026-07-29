import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Question = Tables<"questions">
export type QuestionOption = Tables<"question_options">
export type QuestionWithOptions = Question & { question_options: QuestionOption[] }

type QuestionInsert = TablesInsert<"questions">
export type QuestionCreateInput = Omit<
  QuestionInsert,
  "id" | "user_id" | "created_at" | "updated_at" | "deleted_at"
>
export type QuestionUpdateInput = Partial<QuestionCreateInput>

type QuestionOptionInsert = TablesInsert<"question_options">
export type QuestionOptionCreateInput = Omit<
  QuestionOptionInsert,
  "id" | "created_at" | "updated_at"
>

const QUESTION_WITH_OPTIONS_SELECT = "*, question_options(*)"

export class QuestionsRepository {
  async listForCategory(categoryId: string): Promise<QuestionWithOptions[]> {
    return unwrap(
      supabase
        .from("questions")
        .select(QUESTION_WITH_OPTIONS_SELECT)
        .eq("category_id", categoryId)
        .eq("is_archived", false)
        .is("deleted_at", null)
        .order("display_order")
    )
  }

  async listForSubcategory(subcategoryId: string): Promise<QuestionWithOptions[]> {
    return unwrap(
      supabase
        .from("questions")
        .select(QUESTION_WITH_OPTIONS_SELECT)
        .eq("subcategory_id", subcategoryId)
        .eq("is_archived", false)
        .is("deleted_at", null)
        .order("display_order")
    )
  }

  /** All questions relevant to a transaction: its category's questions, plus its subcategory's questions (if any). */
  async listForTransactionContext(
    categoryId: string,
    subcategoryId?: string | null
  ): Promise<QuestionWithOptions[]> {
    const [categoryQuestions, subcategoryQuestions] = await Promise.all([
      this.listForCategory(categoryId),
      subcategoryId ? this.listForSubcategory(subcategoryId) : Promise.resolve([]),
    ])
    return [...categoryQuestions, ...subcategoryQuestions].sort(
      (a, b) => a.display_order - b.display_order
    )
  }

  async create(input: QuestionCreateInput): Promise<Question> {
    return unwrap(supabase.from("questions").insert(input).select().single())
  }

  async update(id: string, input: QuestionUpdateInput): Promise<Question> {
    return unwrap(supabase.from("questions").update(input).eq("id", id).select().single())
  }

  async softDelete(id: string): Promise<Question> {
    return unwrap(
      supabase
        .from("questions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    )
  }

  async createOption(input: QuestionOptionCreateInput): Promise<QuestionOption> {
    return unwrap(supabase.from("question_options").insert(input).select().single())
  }

  async deleteOption(id: string): Promise<void> {
    return unwrapVoid(supabase.from("question_options").delete().eq("id", id))
  }
}

export const questionsRepository = new QuestionsRepository()
