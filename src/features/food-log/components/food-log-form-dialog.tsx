import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Star } from "lucide-react"

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
import { Label } from "@/components/ui/label"
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
import { useCurrencies } from "@/features/currencies/hooks/use-currencies"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useTransaction } from "@/features/transactions/hooks/use-transactions"
import { TransactionPicker } from "@/features/food-log/components/transaction-picker"
import {
  useCreateFoodLogEntry,
  useUpdateFoodLogEntry,
} from "@/features/food-log/hooks/use-food-log"
import {
  foodLogFormSchema,
  type FoodLogFormValues,
  FLAVORS,
  FLAVOR_LABELS,
  TEXTURES,
  TEXTURE_LABELS,
  WOULD_ORDER_AGAIN_OPTIONS,
  WOULD_ORDER_AGAIN_LABELS,
} from "@/features/food-log/schemas"
import type { FoodLogEntry } from "@/services/repositories/food-log.repository"
import type { TransactionDetailed } from "@/services/repositories/transactions.repository"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-6",
              n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function FoodLogFormDialog({
  entry,
  trigger,
}: {
  entry?: FoodLogEntry
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const [linkedTransaction, setLinkedTransaction] = React.useState<TransactionDetailed | null>(null)

  const isEditing = !!entry

  const currencies = useCurrencies()
  const settings = useSettings()
  const linkedTransactionQuery = useTransaction(entry?.transaction_id ?? undefined)
  const createEntry = useCreateFoodLogEntry()
  const updateEntry = useUpdateFoodLogEntry()

  const form = useForm<FoodLogFormValues>({
    resolver: zodResolver(foodLogFormSchema),
    defaultValues: {
      food_name: "",
      shop: "",
      price: undefined,
      currency_id: "",
      occurred_at: new Date().toISOString().slice(0, 10),
      overall_rating: 0,
      flavors: [],
      texture: [],
      would_order_again: undefined,
      notes: "",
    },
  })

  React.useEffect(() => {
    if (!open) return

    if (entry) {
      form.reset({
        food_name: entry.food_name,
        shop: entry.shop ?? "",
        price: entry.price ?? undefined,
        currency_id: entry.currency_id ?? settings.data?.default_currency_id ?? "",
        occurred_at: toDateInputValue(entry.occurred_at),
        overall_rating: entry.overall_rating,
        flavors: (entry.flavors ?? []) as FoodLogFormValues["flavors"],
        texture: (entry.texture ?? []) as FoodLogFormValues["texture"],
        would_order_again: entry.would_order_again as FoodLogFormValues["would_order_again"],
        notes: entry.notes ?? "",
      })
      setLinkedTransaction(entry.transaction_id ? (linkedTransactionQuery.data ?? null) : null)
    } else {
      form.reset({
        food_name: "",
        shop: "",
        price: undefined,
        currency_id: settings.data?.default_currency_id ?? "",
        occurred_at: new Date().toISOString().slice(0, 10),
        overall_rating: 0,
        flavors: [],
        texture: [],
        would_order_again: undefined,
        notes: "",
      })
      setLinkedTransaction(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry?.id, settings.data?.default_currency_id])

  // The linked transaction loads asynchronously — sync it in once it arrives.
  React.useEffect(() => {
    if (open && entry?.transaction_id && linkedTransactionQuery.data) {
      setLinkedTransaction(linkedTransactionQuery.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedTransactionQuery.data])

  function handleTransactionSelect(transaction: TransactionDetailed | null) {
    setLinkedTransaction(transaction)
    if (transaction) {
      form.setValue("shop", transaction.merchant ?? "")
      form.setValue("price", transaction.amount ?? undefined)
      form.setValue("currency_id", transaction.currency_id ?? "")
      if (transaction.occurred_at) {
        form.setValue("occurred_at", toDateInputValue(transaction.occurred_at))
      }
    }
  }

  function toggleFlavor(flavor: FoodLogFormValues["flavors"][number]) {
    const current = form.getValues("flavors")
    form.setValue(
      "flavors",
      current.includes(flavor) ? current.filter((f) => f !== flavor) : [...current, flavor]
    )
  }

  function toggleTexture(texture: FoodLogFormValues["texture"][number]) {
    const current = form.getValues("texture")
    form.setValue(
      "texture",
      current.includes(texture) ? current.filter((t) => t !== texture) : [...current, texture]
    )
  }

  async function onSubmit(values: FoodLogFormValues) {
    const input = {
      food_name: values.food_name,
      transaction_id: linkedTransaction?.id ?? null,
      shop: values.shop || null,
      price: values.price ?? null,
      currency_id: values.currency_id || null,
      occurred_at: new Date(values.occurred_at).toISOString(),
      overall_rating: values.overall_rating,
      flavors: values.flavors,
      texture: values.texture,
      would_order_again: values.would_order_again,
      notes: values.notes || null,
    }

    try {
      if (isEditing) {
        await updateEntry.mutateAsync({ id: entry.id, input })
        toast.success("Food log entry updated")
      } else {
        await createEntry.mutateAsync(input)
        toast.success("Food log entry added")
      }
      setOpen(false)
    } catch (error) {
      toast.error(error, "Couldn't save food log entry")
    }
  }

  const isSubmitting = createEntry.isPending || updateEntry.isPending
  const watchedFlavors = form.watch("flavors")
  const watchedTexture = form.watch("texture")
  const watchedRating = form.watch("overall_rating")
  const watchedOrderAgain = form.watch("would_order_again")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit food log entry" : "New food log entry"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="food_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did you eat?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mango sticky rice" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-1.5">
              <Label>Link a transaction</Label>
              <TransactionPicker value={linkedTransaction} onSelect={handleTransactionSelect} />
              {linkedTransaction && (
                <p className="text-xs text-muted-foreground">
                  Auto-filled from a linked transaction — editing the fields below won't change
                  it.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setLinkedTransaction(null)}
                  >
                    Unlink
                  </button>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      items={Object.fromEntries(
                        (currencies.data ?? []).map((c) => [c.id, `${c.code} (${c.symbol})`])
                      )}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.data?.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.code} ({currency.symbol})
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
              name="overall_rating"
              render={() => (
                <FormItem>
                  <FormLabel>Overall rating</FormLabel>
                  <FormControl>
                    <StarRatingInput
                      value={watchedRating}
                      onChange={(n) => form.setValue("overall_rating", n)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-1.5">
              <Label>Dominant flavors</Label>
              <div className="flex flex-wrap gap-1.5">
                {FLAVORS.map((flavor) => (
                  <Badge
                    key={flavor}
                    variant={watchedFlavors.includes(flavor) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleFlavor(flavor)}
                  >
                    {FLAVOR_LABELS[flavor]}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Texture</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEXTURES.map((texture) => (
                  <Badge
                    key={texture}
                    variant={watchedTexture.includes(texture) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleTexture(texture)}
                  >
                    {TEXTURE_LABELS[texture]}
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="would_order_again"
              render={() => (
                <FormItem>
                  <FormLabel>Would you order this again?</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {WOULD_ORDER_AGAIN_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={watchedOrderAgain === option ? "default" : "outline"}
                        onClick={() => form.setValue("would_order_again", option)}
                      >
                        {WOULD_ORDER_AGAIN_LABELS[option]}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Tastes like... reminds me of... anything else"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isEditing ? "Save changes" : "Add entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
