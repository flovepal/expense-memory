import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { QuestionWithOptions } from "@/services/repositories/questions.repository"
import type { TransactionAnswerInput } from "@/services/repositories/transactions.repository"

export type AnswerValue = Omit<TransactionAnswerInput, "question_id">

export function DynamicQuestionField({
  question,
  value,
  onChange,
}: {
  question: QuestionWithOptions
  value: AnswerValue | undefined
  onChange: (next: AnswerValue) => void
}) {
  const answerType = question.answer_type as AnswerValue["answer_type"]

  return (
    <div className="grid gap-1.5">
      <Label>
        {question.prompt}
        {question.is_required && <span className="text-destructive"> *</span>}
      </Label>

      {answerType === "text" && (
        <Input
          value={value?.answer_text ?? ""}
          onChange={(e) => onChange({ answer_type: "text", answer_text: e.target.value })}
        />
      )}

      {answerType === "number" && (
        <Input
          type="number"
          value={value?.answer_number ?? ""}
          onChange={(e) =>
            onChange({ answer_type: "number", answer_number: e.target.valueAsNumber })
          }
        />
      )}

      {answerType === "date" && (
        <Input
          type="date"
          value={value?.answer_date ?? ""}
          onChange={(e) => onChange({ answer_type: "date", answer_date: e.target.value })}
        />
      )}

      {answerType === "boolean" && (
        <Switch
          checked={value?.answer_boolean ?? false}
          onCheckedChange={(checked) => onChange({ answer_type: "boolean", answer_boolean: checked })}
        />
      )}

      {answerType === "single_select" && (
        <Select
          items={Object.fromEntries(question.question_options.map((o) => [o.id, o.label]))}
          value={value?.selected_option_id ?? undefined}
          onValueChange={(optionId) =>
            onChange({ answer_type: "single_select", selected_option_id: optionId })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {question.question_options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {answerType === "multi_select" && (
        <div className="flex flex-col gap-2">
          {question.question_options.map((option) => {
            const selectedIds = value?.selected_option_ids ?? []
            const checked = selectedIds.includes(option.id)
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) =>
                    onChange({
                      answer_type: "multi_select",
                      selected_option_ids: next
                        ? [...selectedIds, option.id]
                        : selectedIds.filter((id) => id !== option.id),
                    })
                  }
                />
                {option.label}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
