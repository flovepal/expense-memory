import { supabase } from "@/lib/supabase/client"
import { unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type Question = Tables<"questions">
export type QuestionOption = Tables<"question_options">
export type QuestionWithOptions = Question & { question_options: QuestionOption[] }

type QuestionInsert = TablesInsert<"questions">
export type QuestionCreateInput = Omit<QuestionInsert, "id" | "user_id" | "created_at" | "updated_at">
export type QuestionUpdateInput = Partial<QuestionCreateInput>

type QuestionOptionInsert = TablesInsert<"question_options">
export type QuestionOptionCreateInput = Omit<
  QuestionOptionInsert,
  "id" | "created_at" | "updated_at"
>

const QUESTION_WITH_OPTIONS_SELECT = "*, question_options(*)"

export class QuestionsRepository {
  /** includeArchived: true for the management view (Settings) so an archived question stays visible with a restore option; false (default) for the transaction form, which should only ever offer active questions. */
  async listForCategory(categoryId: string, includeArchived = false): Promise<QuestionWithOptions[]> {
    let query = supabase
      .from("questions")
      .select(QUESTION_WITH_OPTIONS_SELECT)
      .eq("category_id", categoryId)
    if (!includeArchived) query = query.eq("is_archived", false)
    return unwrap(query.order("display_order"))
  }

  async listForSubcategory(
    subcategoryId: string,
    includeArchived = false
  ): Promise<QuestionWithOptions[]> {
    let query = supabase
      .from("questions")
      .select(QUESTION_WITH_OPTIONS_SELECT)
      .eq("subcategory_id", subcategoryId)
    if (!includeArchived) query = query.eq("is_archived", false)
    return unwrap(query.order("display_order"))
  }

  async create(input: QuestionCreateInput): Promise<Question> {
    return unwrap(supabase.from("questions").insert(input).select().single())
  }

  async update(id: string, input: QuestionUpdateInput): Promise<Question> {
    return unwrap(supabase.from("questions").update(input).eq("id", id).select().single())
  }

  async setArchived(id: string, isArchived: boolean): Promise<Question> {
    return this.update(id, { is_archived: isArchived })
  }

  /** Fails (FK RESTRICT) if any transaction has already answered this question — archive it instead. */
  async delete(id: string): Promise<void> {
    return unwrapVoid(supabase.from("questions").delete().eq("id", id))
  }

  async createOption(input: QuestionOptionCreateInput): Promise<QuestionOption> {
    return unwrap(supabase.from("question_options").insert(input).select().single())
  }

  async deleteOption(id: string): Promise<void> {
    return unwrapVoid(supabase.from("question_options").delete().eq("id", id))
  }
}

export const questionsRepository = new QuestionsRepository()
