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
import {
  useCreateSubcategory,
  useUpdateSubcategory,
} from "@/features/categories/hooks/use-subcategories"
import { subcategoryFormSchema, type SubcategoryFormValues } from "@/features/categories/schemas"
import type { Subcategory } from "@/services/repositories/subcategories.repository"
import { toast } from "@/lib/toast"

export function SubcategoryFormDialog({
  categoryId,
  subcategory,
  trigger,
}: {
  categoryId: string
  subcategory?: Subcategory
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const createSubcategory = useCreateSubcategory()
  const updateSubcategory = useUpdateSubcategory()
  const isEditing = !!subcategory

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    values: { name: subcategory?.name ?? "", icon: subcategory?.icon ?? "" },
  })

  async function onSubmit(values: SubcategoryFormValues) {
    try {
      if (isEditing) {
        await updateSubcategory.mutateAsync({ id: subcategory.id, input: values })
        toast.success("Subcategory updated")
      } else {
        await createSubcategory.mutateAsync({ ...values, category_id: categoryId })
        toast.success("Subcategory created")
      }
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error(error, "Couldn't save subcategory")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit subcategory" : "New subcategory"}</DialogTitle>
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
                    <Input placeholder="Dining Out" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createSubcategory.isPending || updateSubcategory.isPending}
              >
                {isEditing ? "Save changes" : "Create subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
