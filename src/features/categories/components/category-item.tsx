import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CategoryFormDialog } from "@/features/categories/components/category-form-dialog"
import { SubcategoryFormDialog } from "@/features/categories/components/subcategory-form-dialog"
import { SubcategoryItem } from "@/features/categories/components/subcategory-item"
import { QuestionFormDialog } from "@/features/categories/components/question-form-dialog"
import { QuestionList } from "@/features/categories/components/question-list"
import { useDeleteCategory } from "@/features/categories/hooks/use-categories"
import { useQuestionsForCategory } from "@/features/categories/hooks/use-questions"
import { useSubcategories } from "@/features/categories/hooks/use-subcategories"
import type { Category } from "@/services/repositories/categories.repository"
import type { TransactionType } from "@/types/enums"
import { toast } from "@/lib/toast"

export function CategoryItem({ category }: { category: Category }) {
  const subcategories = useSubcategories(category.id)
  const questions = useQuestionsForCategory(category.id)
  const deleteCategory = useDeleteCategory()
  const isSystemCategory = category.user_id === null

  async function handleDelete() {
    try {
      await deleteCategory.mutateAsync(category.id)
      toast.success("Category removed")
    } catch (error) {
      toast.error(error, "Couldn't remove category")
    }
  }

  return (
    <AccordionItem value={category.id}>
      <div className="flex items-center">
        <AccordionTrigger className="flex-1">{category.name}</AccordionTrigger>
        {!isSystemCategory && (
          <div className="flex items-center gap-1 pl-2">
            <CategoryFormDialog
              category={category}
              transactionType={category.transaction_type as TransactionType}
              trigger={
                <Button variant="ghost" size="icon" className="size-7">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <Button variant="ghost" size="icon" className="size-7" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
      <AccordionContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Questions</h3>
          {questions.data ? <QuestionList questions={questions.data} /> : null}
          <QuestionFormDialog
            scope={{ categoryId: category.id }}
            trigger={
              <Button variant="outline" size="sm" className="w-fit">
                <Plus className="size-3.5" />
                Add question
              </Button>
            }
          />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Subcategories</h3>
          {(subcategories.data ?? []).map((subcategory) => (
            <SubcategoryItem key={subcategory.id} subcategory={subcategory} />
          ))}
          <SubcategoryFormDialog
            categoryId={category.id}
            trigger={
              <Button variant="outline" size="sm" className="w-fit">
                <Plus className="size-3.5" />
                Add subcategory
              </Button>
            }
          />
        </section>
      </AccordionContent>
    </AccordionItem>
  )
}
