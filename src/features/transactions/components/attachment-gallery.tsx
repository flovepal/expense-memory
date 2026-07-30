import * as React from "react"
import { Camera, Images, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import {
  useTransactionAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useAttachmentSignedUrls,
} from "@/features/transactions/hooks/use-attachments"
import { ImageLightbox } from "@/features/transactions/components/image-lightbox"
import type { TransactionAttachment } from "@/services/repositories/transaction-attachments.repository"
import { toast } from "@/lib/toast"

/** Edit-mode receipt gallery: the transaction already has an id, so uploads happen immediately instead of staging like AttachmentPicker does for create-mode. */
export function AttachmentGallery({ transactionId }: { transactionId: string }) {
  const { user } = useAuth()
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const galleryInputRef = React.useRef<HTMLInputElement>(null)
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

  const attachments = useTransactionAttachments(transactionId)
  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment()

  const paths = (attachments.data ?? []).map((a) => a.storage_path)
  const signedUrls = useAttachmentSignedUrls(paths)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (picked.length === 0 || !user) return

    for (const file of picked) {
      try {
        await uploadAttachment.mutateAsync({ transactionId, userId: user.id, file })
      } catch (error) {
        toast.error(error, `Couldn't upload ${file.name}`)
      }
    }
  }

  async function handleDelete(attachment: TransactionAttachment) {
    try {
      await deleteAttachment.mutateAsync(attachment)
    } catch (error) {
      toast.error(error, "Couldn't delete photo")
    }
  }

  // Kept in the same order/indices as attachments.data (not filtered) so the
  // clicked thumbnail's index always lines up with the lightbox's list.
  const lightboxImages = (attachments.data ?? []).map((a) => ({
    id: a.id,
    url: signedUrls.data?.[a.storage_path] ?? "",
  }))

  return (
    <div className="grid gap-1.5">
      <Label>Receipt photos</Label>
      <div className="flex flex-wrap gap-2">
        {(attachments.data ?? []).map((attachment, i) => {
          const url = signedUrls.data?.[attachment.storage_path]
          return (
            <div key={attachment.id} className="relative size-16 overflow-hidden rounded-md border">
              {url ? (
                <button
                  type="button"
                  className="block size-full"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(attachment)}
                className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          className="size-16 flex-col gap-1 text-xs"
          disabled={uploadAttachment.isPending}
          onClick={() => cameraInputRef.current?.click()}
        >
          {uploadAttachment.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          Camera
        </Button>
        <Button
          type="button"
          variant="outline"
          className="size-16 flex-col gap-1 text-xs"
          disabled={uploadAttachment.isPending}
          onClick={() => galleryInputRef.current?.click()}
        >
          <Images className="size-4" />
          Gallery
        </Button>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      />
    </div>
  )
}
