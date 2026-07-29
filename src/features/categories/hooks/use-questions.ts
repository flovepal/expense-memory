import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  questionsRepository,
  type QuestionCreateInput,
  type QuestionOptionCreateInput,
  type QuestionUpdateInput,
} from "@/services/repositories/questions.repository"

export const questionKeys = {
  all: ["questions"] as const,
  forCategory: (categoryId: string) => [...questionKeys.all, "category", categoryId] as const,
  forSubcategory: (subcategoryId: string) =>
    [...questionKeys.all, "subcategory", subcategoryId] as const,
  forTransactionContext: (categoryId: string, subcategoryId?: string | null) =>
    [...questionKeys.all, "context", categoryId, subcategoryId ?? null] as const,
}

export function useQuestionsForCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: questionKeys.forCategory(categoryId ?? ""),
    queryFn: () => questionsRepository.listForCategory(categoryId!),
    enabled: !!categoryId,
  })
}

export function useQuestionsForSubcategory(subcategoryId: string | undefined) {
  return useQuery({
    queryKey: questionKeys.forSubcategory(subcategoryId ?? ""),
    queryFn: () => questionsRepository.listForSubcategory(subcategoryId!),
    enabled: !!subcategoryId,
  })
}

/** Combined category + subcategory questions for the transaction form. */
export function useQuestionsForTransactionContext(
  categoryId: string | undefined,
  subcategoryId?: string | null
) {
  return useQuery({
    queryKey: questionKeys.forTransactionContext(categoryId ?? "", subcategoryId),
    queryFn: () => questionsRepository.listForTransactionContext(categoryId!, subcategoryId),
    enabled: !!categoryId,
  })
}

function invalidateQuestionScope(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: { category_id: string | null; subcategory_id: string | null }
) {
  if (scope.category_id) {
    queryClient.invalidateQueries({ queryKey: questionKeys.forCategory(scope.category_id) })
  }
  if (scope.subcategory_id) {
    queryClient.invalidateQueries({
      queryKey: questionKeys.forSubcategory(scope.subcategory_id),
    })
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

export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => questionsRepository.softDelete(id),
    onSuccess: (question) => invalidateQuestionScope(queryClient, question),
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
