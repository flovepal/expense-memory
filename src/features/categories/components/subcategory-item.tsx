import * as React from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { QuestionFormDialog } from "@/features/categories/components/question-form-dialog"
import { QuestionList } from "@/features/categories/components/question-list"
import { useQuestionsForSubcategory } from "@/features/categories/hooks/use-questions"
import { useDeleteSubcategory } from "@/features/categories/hooks/use-subcategories"
import type { Subcategory } from "@/services/repositories/subcategories.repository"
import { toast } from "@/lib/toast"

export function SubcategoryItem({ subcategory }: { subcategory: Subcategory }) {
  const [open, setOpen] = React.useState(false)
  const questions = useQuestionsForSubcategory(open ? subcategory.id : undefined, true)
  const deleteSubcategory = useDeleteSubcategory()

  async function handleDelete() {
    try {
      await deleteSubcategory.mutateAsync({ id: subcategory.id, categoryId: subcategory.category_id })
      toast.success("Subcategory removed")
    } catch (error) {
      toast.error(error, "Couldn't remove subcategory")
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border p-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger
          render={
            <button className="flex items-center gap-1.5 text-sm font-medium">
              <ChevronDown
                className={`size-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
              />
              {subcategory.name}
            </button>
          }
        />
        <Button variant="ghost" size="icon" className="size-7" onClick={handleDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <CollapsibleContent className="mt-2 flex flex-col gap-2 pl-5">
        {questions.data ? <QuestionList questions={questions.data} /> : null}
        <QuestionFormDialog
          scope={{ subcategoryId: subcategory.id }}
          trigger={
            <Button variant="outline" size="sm" className="w-fit">
              <Plus className="size-3.5" />
              Add question
            </Button>
          }
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
