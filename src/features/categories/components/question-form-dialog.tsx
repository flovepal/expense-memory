import * as React from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
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
import { useCreateQuestion, useCreateQuestionOption } from "@/features/categories/hooks/use-questions"
import { questionFormSchema, type QuestionFormValues } from "@/features/categories/schemas"
import { ANSWER_TYPES, ANSWER_TYPE_LABELS } from "@/types/enums"
import { toast } from "@/lib/toast"

type QuestionScope = { categoryId: string } | { subcategoryId: string }

export function QuestionFormDialog({
  scope,
  trigger,
}: {
  scope: QuestionScope
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const createQuestion = useCreateQuestion()
  const createOption = useCreateQuestionOption()

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: { prompt: "", answer_type: "text", is_required: false, options: [] },
  })

  const optionFields = useFieldArray({ control: form.control, name: "options" })
  const answerType = form.watch("answer_type")
  const needsOptions = answerType === "single_select" || answerType === "multi_select"

  async function onSubmit(values: QuestionFormValues) {
    try {
      const question = await createQuestion.mutateAsync({
        prompt: values.prompt,
        answer_type: values.answer_type,
        is_required: values.is_required,
        category_id: "categoryId" in scope ? scope.categoryId : null,
        subcategory_id: "subcategoryId" in scope ? scope.subcategoryId : null,
      })

      if (needsOptions) {
        for (const [index, option] of values.options.entries()) {
          await createOption.mutateAsync({
            question_id: question.id,
            label: option.label,
            value: option.value,
            display_order: index,
          })
        }
      }

      toast.success("Question added")
      setOpen(false)
      form.reset({ prompt: "", answer_type: "text", is_required: false, options: [] })
    } catch (error) {
      toast.error(error, "Couldn't save question")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Input placeholder="Who was this with?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer type</FormLabel>
                  <Select items={ANSWER_TYPE_LABELS} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ANSWER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {ANSWER_TYPE_LABELS[type]}
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
              name="is_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Required</FormLabel>
                </FormItem>
              )}
            />
            {needsOptions && (
              <div className="grid gap-2">
                <FormLabel>Options</FormLabel>
                {optionFields.fields.map((optionField, index) => (
                  <div key={optionField.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Label"
                      {...form.register(`options.${index}.label`)}
                      onChange={(e) => {
                        form.setValue(`options.${index}.label`, e.target.value)
                        form.setValue(`options.${index}.value`, slugify(e.target.value))
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => optionFields.remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => optionFields.append({ label: "", value: "" })}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
                {form.formState.errors.options?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.options.message}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={createQuestion.isPending}>
                Add question
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}
