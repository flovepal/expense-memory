import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useCreateTag, useUpdateTag } from "@/features/tags/hooks/use-tags"
import { tagFormSchema, type TagFormValues } from "@/features/tags/schemas"
import type { Tag } from "@/services/repositories/tags.repository"
import { toast } from "@/lib/toast"

export function TagFormDialog({ tag, trigger }: { tag?: Tag; trigger: React.ReactElement }) {
  const [open, setOpen] = React.useState(false)
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const isEditing = !!tag

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    values: { name: tag?.name ?? "", color: tag?.color ?? "" },
  })

  async function onSubmit(values: TagFormValues) {
    try {
      if (isEditing) {
        await updateTag.mutateAsync({ id: tag.id, input: values })
        toast.success("Tag updated")
      } else {
        await createTag.mutateAsync(values)
        toast.success("Tag created")
      }
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error(error, "Couldn't save tag")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit tag" : "New tag"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Business trip" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createTag.isPending || updateTag.isPending}>
                {isEditing ? "Save changes" : "Create tag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
