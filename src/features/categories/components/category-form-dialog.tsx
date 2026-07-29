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
import { useCreateCategory, useUpdateCategory } from "@/features/categories/hooks/use-categories"
import { categoryFormSchema, type CategoryFormValues } from "@/features/categories/schemas"
import type { Category } from "@/services/repositories/categories.repository"
import type { TransactionType } from "@/types/enums"
import { toast } from "@/lib/toast"

export function CategoryFormDialog({
  category,
  transactionType,
  trigger,
}: {
  category?: Category
  transactionType: TransactionType
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isEditing = !!category

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    values: {
      name: category?.name ?? "",
      transaction_type: transactionType,
      icon: category?.icon ?? "",
      color: category?.color ?? "",
    },
  })

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (isEditing) {
        await updateCategory.mutateAsync({ id: category.id, input: values })
        toast.success("Category updated")
      } else {
        await createCategory.mutateAsync(values)
        toast.success("Category created")
      }
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error(error, "Couldn't save category")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "New category"}</DialogTitle>
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
                    <Input placeholder="Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {isEditing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
