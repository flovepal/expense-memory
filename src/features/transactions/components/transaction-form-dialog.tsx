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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWallets } from "@/features/wallets/hooks/use-wallets"
import { useCategories } from "@/features/categories/hooks/use-categories"
import { useSubcategories } from "@/features/categories/hooks/use-subcategories"
import { useQuestionsForTransactionContext } from "@/features/categories/hooks/use-questions"
import { useTags } from "@/features/tags/hooks/use-tags"
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/features/transactions/hooks/use-transactions"
import { transactionFormSchema, type TransactionFormValues } from "@/features/transactions/schemas"
import {
  DynamicQuestionField,
  type AnswerValue,
} from "@/features/transactions/components/dynamic-question-field"
import { TRANSACTION_TYPES } from "@/types/enums"
import type { TransactionDetailed } from "@/services/repositories/transactions.repository"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

type ExistingTag = { id: string; name: string; color: string | null }
type ExistingAnswer = {
  question_id: string
  answer_text: string | null
  answer_number: number | null
  answer_boolean: boolean | null
  answer_date: string | null
  selected_option_id: string | null
  selected_option_ids: string[] | null
}

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export function TransactionFormDialog({
  transaction,
  trigger,
}: {
  transaction?: TransactionDetailed
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({})
  const [tagIds, setTagIds] = React.useState<string[]>([])

  const isEditing = !!transaction

  const wallets = useWallets()
  const tags = useTags()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      wallet_id: "",
      transaction_type: "expense",
      category_id: "",
      subcategory_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      note: "",
    },
  })

  const transactionType = form.watch("transaction_type")
  const categoryId = form.watch("category_id")
  const subcategoryId = form.watch("subcategory_id")

  const categories = useCategories(transactionType)
  const subcategories = useSubcategories(categoryId || undefined)
  const questions = useQuestionsForTransactionContext(categoryId || undefined, subcategoryId)

  React.useEffect(() => {
    if (!open) return

    if (transaction) {
      form.reset({
        wallet_id: transaction.wallet_id ?? "",
        transaction_type: transaction.transaction_type as TransactionFormValues["transaction_type"],
        category_id: transaction.category_id ?? "",
        subcategory_id: transaction.subcategory_id ?? "",
        amount: transaction.amount ?? 0,
        occurred_at: transaction.occurred_at ? toDateInputValue(transaction.occurred_at) : "",
        note: transaction.note ?? "",
      })
      const existingAnswers = (transaction.answers as unknown as ExistingAnswer[] | null) ?? []
      setAnswers(
        Object.fromEntries(
          existingAnswers.map((a) => [
            a.question_id,
            {
              answer_type: inferAnswerType(a),
              answer_text: a.answer_text,
              answer_number: a.answer_number,
              answer_boolean: a.answer_boolean,
              answer_date: a.answer_date,
              selected_option_id: a.selected_option_id,
              selected_option_ids: a.selected_option_ids,
            } as AnswerValue,
          ])
        )
      )
      const existingTags = (transaction.tags as unknown as ExistingTag[] | null) ?? []
      setTagIds(existingTags.map((t) => t.id))
    } else {
      form.reset({
        wallet_id: "",
        transaction_type: "expense",
        category_id: "",
        subcategory_id: "",
        amount: 0,
        occurred_at: new Date().toISOString().slice(0, 10),
        note: "",
      })
      setAnswers({})
      setTagIds([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id])

  function handleTypeChange(nextType: TransactionFormValues["transaction_type"]) {
    form.setValue("transaction_type", nextType)
    form.setValue("category_id", "")
    form.setValue("subcategory_id", "")
    setAnswers({})
  }

  function handleCategoryChange(nextCategoryId: string | null) {
    form.setValue("category_id", nextCategoryId ?? "")
    form.setValue("subcategory_id", "")
    setAnswers({})
  }

  function handleSubcategoryChange(nextSubcategoryId: string | null) {
    form.setValue("subcategory_id", nextSubcategoryId ?? "")
    setAnswers({})
  }

  function toggleTag(tagId: string) {
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    )
  }

  async function onSubmit(values: TransactionFormValues) {
    const unanswered = (questions.data ?? []).filter(
      (q) => q.is_required && !answers[q.id]
    )
    if (unanswered.length > 0) {
      toast.error(`Please answer: ${unanswered.map((q) => q.prompt).join(", ")}`)
      return
    }

    const input = {
      wallet_id: values.wallet_id,
      category_id: values.category_id,
      subcategory_id: values.subcategory_id || null,
      transaction_type: values.transaction_type,
      amount: values.amount,
      occurred_at: new Date(values.occurred_at).toISOString(),
      note: values.note || null,
      answers: (questions.data ?? [])
        .filter((q) => answers[q.id])
        .map((q) => ({ question_id: q.id, ...answers[q.id] })),
      tag_ids: tagIds,
    }

    try {
      if (isEditing) {
        await updateTransaction.mutateAsync({ id: transaction.id!, input })
        toast.success("Transaction updated")
      } else {
        await createTransaction.mutateAsync(input)
        toast.success("Transaction recorded")
      }
      setOpen(false)
    } catch (error) {
      toast.error(error, "Couldn't save transaction")
    }
  }

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit transaction" : "New transaction"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={transactionType === type ? "default" : "outline"}
                  onClick={() => handleTypeChange(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            <FormField
              control={form.control}
              name="wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet</FormLabel>
                  <Select
                    items={Object.fromEntries(
                      (wallets.data ?? []).map((w) => [w.id, w.name])
                    )}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.data?.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    items={Object.fromEntries(
                      (categories.data ?? []).map((c) => [c.id, c.name])
                    )}
                    value={field.value}
                    onValueChange={handleCategoryChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.data?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {categoryId && (subcategories.data ?? []).length > 0 && (
              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select
                      items={Object.fromEntries(
                        (subcategories.data ?? []).map((s) => [s.id, s.name])
                      )}
                      value={field.value}
                      onValueChange={handleSubcategoryChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories.data?.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occurred_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(tags.data ?? []).length > 0 && (
              <div className="grid gap-1.5">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-1.5">
                  {tags.data?.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={tagIds.includes(tag.id) ? "default" : "outline"}
                      className={cn("cursor-pointer select-none")}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(questions.data ?? []).length > 0 && (
              <div className="grid gap-4 border-t pt-4">
                {questions.data?.map((question) => (
                  <DynamicQuestionField
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    onChange={(next) =>
                      setAnswers((current) => ({ ...current, [question.id]: next }))
                    }
                  />
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isEditing ? "Save changes" : "Add transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function inferAnswerType(answer: ExistingAnswer): AnswerValue["answer_type"] {
  if (answer.answer_text !== null) return "text"
  if (answer.answer_number !== null) return "number"
  if (answer.answer_boolean !== null) return "boolean"
  if (answer.answer_date !== null) return "date"
  if (answer.selected_option_id !== null) return "single_select"
  return "multi_select"
}
