import { supabase } from "@/lib/supabase/client"
import { RepositoryError, unwrap, unwrapVoid } from "@/lib/supabase/errors"
import type { Tables, TablesInsert } from "@/types/database"

export type TransactionAttachment = Tables<"transaction_attachments">

const BUCKET = "transaction-attachments"

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export class TransactionAttachmentsRepository {
  async listForTransaction(transactionId: string): Promise<TransactionAttachment[]> {
    return unwrap(
      supabase
        .from("transaction_attachments")
        .select("*")
        .eq("transaction_id", transactionId)
        .order("uploaded_at")
    )
  }

  /** Uploads the file to Storage, then records its metadata row. If the metadata insert fails, the uploaded file is removed so it doesn't linger orphaned. */
  async upload(
    transactionId: string,
    userId: string,
    file: File
  ): Promise<TransactionAttachment> {
    const path = `${userId}/${transactionId}/${Date.now()}-${sanitizeFileName(file.name)}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
    })
    if (uploadError) {
      throw new RepositoryError(uploadError.message, uploadError)
    }

    const row: TablesInsert<"transaction_attachments"> = {
      transaction_id: transactionId,
      user_id: userId,
      storage_path: path,
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
    }

    try {
      return await unwrap(
        supabase.from("transaction_attachments").insert(row).select().single()
      )
    } catch (error) {
      await supabase.storage.from(BUCKET).remove([path])
      throw error
    }
  }

  async remove(attachment: TransactionAttachment): Promise<void> {
    await supabase.storage.from(BUCKET).remove([attachment.storage_path])
    return unwrapVoid(
      supabase.from("transaction_attachments").delete().eq("id", attachment.id)
    )
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

export const transactionAttachmentsRepository = new TransactionAttachmentsRepository()
