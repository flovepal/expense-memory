import * as React from "react"
import { Camera, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type StagedFile = { file: File; previewUrl: string }

/** Create-mode receipt picker: stages files locally (no transaction id to upload against yet) and hands the plain File[] back to the parent for a post-save upload pass. */
export function AttachmentPicker({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [staged, setStaged] = React.useState<StagedFile[]>([])

  React.useEffect(() => {
    setStaged((current) => {
      current.forEach((s) => URL.revokeObjectURL(s.previewUrl))
      return files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  React.useEffect(() => {
    return () => staged.forEach((s) => URL.revokeObjectURL(s.previewUrl))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length > 0) onChange([...files, ...picked])
    e.target.value = ""
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-1.5">
      <Label>Receipt photo (optional)</Label>
      <div className="flex flex-wrap gap-2">
        {staged.map((s, i) => (
          <div key={s.previewUrl} className="relative size-16 overflow-hidden rounded-md border">
            <img src={s.previewUrl} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="size-16 flex-col gap-1 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-4" />
          Add
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  )
}
