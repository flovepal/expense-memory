import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  questionsRepository,
  type QuestionCreateInput,
  type QuestionOptionCreateInput,
  type QuestionUpdateInput,
} from "@/services/repositories/questions.repository"

export const questionKeys = {
  all: ["questions"] as const,
  forCategory: (categoryId: string, includeArchived = false) =>
    [...questionKeys.all, "category", categoryId, includeArchived] as const,
  forSubcategory: (subcategoryId: string, includeArchived = false) =>
    [...questionKeys.all, "subcategory", subcategoryId, includeArchived] as const,
}

/**
 * includeArchived: true in the management view (Settings) so archived
 * questions stay visible with a restore option.
 *
 * keepPreviousData matters here specifically for the transaction form: it's
 * called separately for category and subcategory (not merged into one
 * combined query), so picking a different subcategory only ever changes
 * *this* query's key, not the category one — and even so, without
 * keepPreviousData the fields would briefly vanish and reappear on every
 * subcategory change while the new key's data loads. That flash was the
 * root cause of the "screen jumps" bug reported against the Food
 * transaction flow.
 */
export function useQuestionsForCategory(categoryId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: questionKeys.forCategory(categoryId ?? "", includeArchived),
    queryFn: () => questionsRepository.listForCategory(categoryId!, includeArchived),
    enabled: !!categoryId,
    placeholderData: keepPreviousData,
  })
}

export function useQuestionsForSubcategory(
  subcategoryId: string | undefined,
  includeArchived = false
) {
  return useQuery({
    queryKey: questionKeys.forSubcategory(subcategoryId ?? "", includeArchived),
    queryFn: () => questionsRepository.listForSubcategory(subcategoryId!, includeArchived),
    enabled: !!subcategoryId,
    placeholderData: keepPreviousData,
  })
}

function invalidateQuestionScope(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: { category_id: string | null; subcategory_id: string | null }
) {
  if (scope.category_id) {
    queryClient.invalidateQueries({ queryKey: ["questions", "category", scope.category_id] })
  }
  if (scope.subcategory_id) {
    queryClient.invalidateQueries({ queryKey: ["questions", "subcategory", scope.subcategory_id] })
  }
  queryClient.invalidateQueries({ queryKey: questionKeys.all })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: QuestionCreateInput) => questionsRepository.create(input),
    onSuccess: (question) => invalidateQuestionScope(queryClient, question),
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuestionUpdateInput }) =>
      questionsRepository.update(id, input),
    onSuccess: (question) => invalidateQuestionScope(queryClient, question),
  })
}

export function useSetQuestionArchived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      questionsRepository.setArchived(id, isArchived),
    onSuccess: (question) => invalidateQuestionScope(queryClient, question),
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; category_id: string | null; subcategory_id: string | null }) =>
      questionsRepository.delete(id),
    onSuccess: (_data, question) => invalidateQuestionScope(queryClient, question),
  })
}

export function useCreateQuestionOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: QuestionOptionCreateInput) => questionsRepository.createOption(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionKeys.all }),
  })
}

export function useDeleteQuestionOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => questionsRepository.deleteOption(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionKeys.all }),
  })
}
