import { FolderTree, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion } from "@/components/ui/accordion"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CategoryFormDialog } from "@/features/categories/components/category-form-dialog"
import { CategoryItem } from "@/features/categories/components/category-item"
import { useCategories } from "@/features/categories/hooks/use-categories"
import type { TransactionType } from "@/types/enums"

function CategoryListForType({ transactionType }: { transactionType: TransactionType }) {
  const categories = useCategories(transactionType)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CategoryFormDialog
          transactionType={transactionType}
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              New Category
            </Button>
          }
        />
      </div>
      {categories.isLoading && <LoadingState />}
      {categories.isError && (
        <ErrorState message="Couldn't load categories." onRetry={() => categories.refetch()} />
      )}
      {categories.isSuccess && categories.data.length === 0 && (
        <EmptyState icon={FolderTree} title="No categories yet" />
      )}
      {categories.isSuccess && categories.data.length > 0 && (
        <Accordion>
          {categories.data.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </Accordion>
      )}
    </div>
  )
}

export function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Categories</h1>
      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="expense">
          <CategoryListForType transactionType="expense" />
        </TabsContent>
        <TabsContent value="income">
          <CategoryListForType transactionType="income" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
