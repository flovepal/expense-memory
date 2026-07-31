import { Archive, ArchiveRestore, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDeleteQuestion, useSetQuestionArchived } from "@/features/categories/hooks/use-questions"
import { ANSWER_TYPE_LABELS, type AnswerType } from "@/types/enums"
import type { QuestionWithOptions } from "@/services/repositories/questions.repository"
import { toast } from "@/lib/toast"

export function QuestionList({ questions }: { questions: QuestionWithOptions[] }) {
  const deleteQuestion = useDeleteQuestion()
  const setArchived = useSetQuestionArchived()

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions yet.</p>
  }

  async function handleDelete(question: QuestionWithOptions) {
    try {
      await deleteQuestion.mutateAsync({
        id: question.id,
        category_id: question.category_id,
        subcategory_id: question.subcategory_id,
      })
      toast.success("Question deleted")
    } catch (error) {
      toast.error(
        error,
        "Couldn't delete — it's already been answered on a transaction. Archive it instead."
      )
    }
  }

  async function handleToggleArchive(question: QuestionWithOptions) {
    try {
      await setArchived.mutateAsync({ id: question.id, isArchived: !question.is_archived })
      toast.success(question.is_archived ? "Question restored" : "Question archived")
    } catch (error) {
      toast.error(error, "Couldn't update the question")
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {questions.map((question) => (
        <li
          key={question.id}
          className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {question.prompt}
              {question.is_archived && (
                <Badge variant="outline" className="ml-1.5 text-[10px]">
                  Archived
                </Badge>
              )}
            </span>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">
                {ANSWER_TYPE_LABELS[question.answer_type as AnswerType]}
              </Badge>
              {question.is_required && <Badge variant="outline">Required</Badge>}
              {question.question_options.map((option) => (
                <Badge key={option.id} variant="outline">
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => handleToggleArchive(question)}
              aria-label={question.is_archived ? "Restore question" : "Archive question"}
            >
              {question.is_archived ? (
                <ArchiveRestore className="size-3.5" />
              ) : (
                <Archive className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => handleDelete(question)}
              aria-label="Delete question"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
