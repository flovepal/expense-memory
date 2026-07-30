import { supabase } from "@/lib/supabase/client"
import { RepositoryError } from "@/lib/supabase/errors"

const BUCKET = "dish-images"

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

/**
 * Unlike transaction_attachments, there's no separate metadata table here —
 * the storage path lives directly on dishes.image_storage_path. Callers are
 * responsible for saving the returned path onto the dish row (and copying
 * it onto any transaction_dish_items snapshot).
 */
export class DishImagesRepository {
  async upload(userId: string, dishId: string, file: File): Promise<string> {
    const path = `${userId}/${dishId}/${Date.now()}-${sanitizeFileName(file.name)}`

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
    })
    if (error) {
      throw new RepositoryError(error.message, error)
    }

    return path
  }

  async remove(path: string): Promise<void> {
    await supabase.storage.from(BUCKET).remove([path])
  }

  /** The bucket is private, so thumbnails/full-size views need short-lived signed URLs rather than public ones. */
  async getSignedUrls(paths: string[]): Promise<Record<string, string>> {
    if (paths.length === 0) return {}

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 600)
    if (error) {
      throw new RepositoryError(error.message, error)
    }

    const result: Record<string, string> = {}
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) result[entry.path] = entry.signedUrl
    }
    return result
  }
}

export const dishImagesRepository = new DishImagesRepository()
