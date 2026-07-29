import { Plus, Tag as TagIcon, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { TagFormDialog } from "@/features/tags/components/tag-form-dialog"
import { useDeleteTag, useTags } from "@/features/tags/hooks/use-tags"
import { toast } from "@/lib/toast"

export function TagsPage() {
  const tags = useTags()
  const deleteTag = useDeleteTag()

  async function handleDelete(id: string) {
    try {
      await deleteTag.mutateAsync(id)
      toast.success("Tag deleted")
    } catch (error) {
      toast.error(error, "Couldn't delete tag")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tags</h1>
        <TagFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              New Tag
            </Button>
          }
        />
      </div>

      {tags.isLoading && <LoadingState />}
      {tags.isError && <ErrorState message="Couldn't load tags." onRetry={() => tags.refetch()} />}
      {tags.isSuccess && tags.data.length === 0 && (
        <EmptyState
          icon={TagIcon}
          title="No tags yet"
          description="Tags help you group transactions across categories, like 'business trip' or 'reimbursable'."
        />
      )}
      {tags.isSuccess && tags.data.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.data.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1.5 py-1.5 pr-1.5 pl-2.5 text-sm">
              {tag.name}
              <TagFormDialog
                tag={tag}
                trigger={
                  <button className="rounded p-0.5 hover:bg-background/60" aria-label={`Edit ${tag.name}`}>
                    <Pencil className="size-3" />
                  </button>
                }
              />
              <button
                className="rounded p-0.5 hover:bg-background/60"
                aria-label={`Delete ${tag.name}`}
                onClick={() => handleDelete(tag.id)}
              >
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
