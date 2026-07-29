import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  tagsRepository,
  type TagCreateInput,
  type TagUpdateInput,
} from "@/services/repositories/tags.repository"

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
}

export function useTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: () => tagsRepository.list(),
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TagCreateInput) => tagsRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tagKeys.lists() }),
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TagUpdateInput }) =>
      tagsRepository.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tagKeys.lists() }),
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tagsRepository.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tagKeys.lists() }),
  })
}
