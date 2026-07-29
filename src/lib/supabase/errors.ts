export class RepositoryError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = "RepositoryError"
  }
}

type SupabaseResult<T> = { data: T | null; error: { message: string } | null }

/**
 * Unwraps a Supabase query result, throwing a RepositoryError on failure
 * instead of returning a { data, error } tuple. Keeps every repository
 * method a plain `async () => T` that TanStack Query can call directly.
 */
export async function unwrap<T>(query: PromiseLike<SupabaseResult<T>>): Promise<T> {
  const { data, error } = await query
  if (error) {
    throw new RepositoryError(error.message, error)
  }
  if (data === null) {
    throw new RepositoryError("Expected data but received null")
  }
  return data
}

/** Like unwrap, but for mutations (e.g. delete) that don't return rows. */
export async function unwrapVoid(
  query: PromiseLike<{ error: { message: string } | null }>
): Promise<void> {
  const { error } = await query
  if (error) {
    throw new RepositoryError(error.message, error)
  }
}
