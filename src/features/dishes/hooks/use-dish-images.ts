import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { dishImagesRepository } from "@/services/repositories/dish-images.repository"
import { dishesRepository, type Dish } from "@/services/repositories/dishes.repository"
import { dishKeys } from "@/features/dishes/hooks/use-dishes"

export const dishImageKeys = {
  all: ["dish-images"] as const,
  signedUrls: (paths: string[]) => [...dishImageKeys.all, "signed-urls", [...paths].sort()] as const,
}

/** Batches signed-URL lookups for however many dish image paths are currently visible (a picker's results, a transaction's dish list, a food log list). */
export function useDishImageSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: dishImageKeys.signedUrls(paths),
    queryFn: () => dishImagesRepository.getSignedUrls(paths),
    enabled: paths.length > 0,
  })
}

/** Uploads the file, then saves the resulting path onto the dish row — a dish has exactly one photo, so this is one combined step rather than a separate upload+link mutation pair. */
export function useUploadDishImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dishId,
      userId,
      file,
    }: {
      dishId: string
      userId: string
      file: File
    }): Promise<Dish> => {
      const path = await dishImagesRepository.upload(userId, dishId, file)
      return dishesRepository.update(dishId, { image_storage_path: path })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dishKeys.lists() }),
  })
}
