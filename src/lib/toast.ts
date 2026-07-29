import { toast as sonnerToast } from "sonner"

import { RepositoryError } from "@/lib/supabase/errors"

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof RepositoryError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

/**
 * Thin wrapper around sonner so every feature reports success/failure the
 * same way, and repository errors are unwrapped to a readable message
 * instead of "[object Object]".
 */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  error: (error: unknown, fallback = "Something went wrong") =>
    sonnerToast.error(messageFor(error, fallback)),
}
