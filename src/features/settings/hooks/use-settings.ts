import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  settingsRepository,
  type SettingsUpdateInput,
} from "@/services/repositories/settings.repository"
import { useAuth } from "@/hooks/use-auth"

export const settingsKeys = {
  all: ["settings"] as const,
  detail: (userId: string) => [...settingsKeys.all, userId] as const,
}

export function useSettings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: settingsKeys.detail(user?.id ?? ""),
    queryFn: () => settingsRepository.get(user!.id),
    enabled: !!user,
  })
}

export function useUpdateSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SettingsUpdateInput) => settingsRepository.update(user!.id, input),
    onSuccess: (settings) =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail(settings.user_id) }),
  })
}
