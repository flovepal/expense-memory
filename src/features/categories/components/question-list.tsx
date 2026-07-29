import { Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDeleteQuestion } from "@/features/categories/hooks/use-questions"
import { ANSWER_TYPE_LABELS, type AnswerType } from "@/types/enums"
import type { QuestionWithOptions } from "@/services/repositories/questions.repository"
import { toast } from "@/lib/toast"

export function QuestionList({ questions }: { questions: QuestionWithOptions[] }) {
  const deleteQuestion = useDeleteQuestion()

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions yet.</p>
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuestion.mutateAsync(id)
      toast.success("Question removed")
    } catch (error) {
      toast.error(error, "Couldn't remove question")
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
            <span className="font-medium">{question.prompt}</span>
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
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => handleDelete(question.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
