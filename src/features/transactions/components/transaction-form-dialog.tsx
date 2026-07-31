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
import { useWallets } from "@/features/wallets/hooks/use-wallets"
import { useCategories } from "@/features/categories/hooks/use-categories"
import { useSubcategories } from "@/features/categories/hooks/use-subcategories"
import {
  useQuestionsForCategory,
  useQuestionsForSubcategory,
} from "@/features/categories/hooks/use-questions"
import { useCurrencies } from "@/features/currencies/hooks/use-currencies"
import {
  useCreateTransaction,
  useUpdateTransaction,
  useMerchants,
} from "@/features/transactions/hooks/use-transactions"
import { transactionFormSchema, type TransactionFormValues } from "@/features/transactions/schemas"
import {
  DynamicQuestionField,
  type AnswerValue,
} from "@/features/transactions/components/dynamic-question-field"
import { ShopPicker } from "@/features/dishes/components/shop-picker"
import { DishPicker } from "@/features/dishes/components/dish-picker"
import { DishCart, cartTotal, type CartItem } from "@/features/dishes/components/dish-cart"
import { CostConfirmDialog } from "@/features/dishes/components/cost-confirm-dialog"
import { DishTastePromptDialog } from "@/features/dishes/components/dish-taste-prompt-dialog"
import { useShops } from "@/features/dishes/hooks/use-shops"
import { useCreateTransactionDishItems } from "@/features/dishes/hooks/use-transaction-dishes"
import { useEnsureFoodLogEntriesForDishes } from "@/features/food-log/hooks/use-food-log"
import { TRANSACTION_RECORD_TYPES, TRANSACTION_RECORD_TYPE_LABELS } from "@/types/enums"
import type { TransactionDetailed } from "@/services/repositories/transactions.repository"
import type { Dish } from "@/services/repositories/dishes.repository"
import type { Shop } from "@/services/repositories/shops.repository"
import type { FoodLogEntry } from "@/services/repositories/food-log.repository"
import { toast } from "@/lib/toast"

type ExistingAnswer = {
  question_id: string
  answer_text: string | null
  answer_number: number | null
  answer_boolean: boolean | null
  answer_date: string | null
  selected_option_id: string | null
  selected_option_ids: string[] | null
}
type ExistingDishItem = {
  id: string
  dish_id: string | null
  dish_name: string
  unit_price: number
  quantity: number
  image_storage_path: string | null
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
  const [shop, setShop] = React.useState<Shop | null>(null)
  const [dishCart, setDishCart] = React.useState<CartItem[]>([])
  const [amountManuallyEdited, setAmountManuallyEdited] = React.useState(false)
  const [costConfirmOpen, setCostConfirmOpen] = React.useState(false)
  const [pendingSubmitValues, setPendingSubmitValues] = React.useState<TransactionFormValues | null>(null)
  const [tastePrompt, setTastePrompt] = React.useState<{ open: boolean; entries: FoodLogEntry[] }>({
    open: false,
    entries: [],
  })

  const isEditing = !!transaction

  const wallets = useWallets()
  const shops = useShops()
  const currencies = useCurrencies()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const createTransactionDishItems = useCreateTransactionDishItems()
  const ensureFoodLogEntries = useEnsureFoodLogEntriesForDishes()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      wallet_id: "",
      transaction_type: "expense",
      category_id: "",
      subcategory_id: "",
      to_wallet_id: "",
      merchant: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      note: "",
    },
  })

  const transactionType = form.watch("transaction_type")
  const categoryId = form.watch("category_id")
  const subcategoryId = form.watch("subcategory_id")
  const walletId = form.watch("wallet_id")

  const isTransfer = transactionType === "transfer"

  // TRANSACTION_RECORD_TYPES includes 'transfer', but categories only ever
  // exist for income/expense — pass undefined (all) rather than a type the
  // categories table can never have. Checking transactionType directly
  // (not the isTransfer bool) lets TS narrow the else branch to
  // "income" | "expense".
  const categories = useCategories(transactionType === "transfer" ? undefined : transactionType)
  const subcategories = useSubcategories(categoryId || undefined)

  // Queried separately (not combined into one "transaction context" query)
  // so picking a different subcategory only ever changes the subcategory
  // query's key — the category questions stay on their own stable,
  // cached key and never flash empty while a subcategory-scoped refetch is
  // in flight. See use-questions.ts for the full story on why this matters.
  const categoryQuestions = useQuestionsForCategory(categoryId || undefined)
  const subcategoryQuestions = useQuestionsForSubcategory(subcategoryId || undefined)
  const allQuestions = React.useMemo(
    () =>
      [...(categoryQuestions.data ?? []), ...(subcategoryQuestions.data ?? [])].sort(
        (a, b) => a.display_order - b.display_order
      ),
    [categoryQuestions.data, subcategoryQuestions.data]
  )

  const merchants = useMerchants()

  const sourceWallet = wallets.data?.find((w) => w.id === walletId)
  const destinationWalletOptions = (wallets.data ?? []).filter(
    (w) => w.id !== walletId && (!sourceWallet || w.currency_id === sourceWallet.currency_id)
  )

  const currencyById = new Map((currencies.data ?? []).map((c) => [c.id, c]))
  const walletCurrencyCode = sourceWallet ? currencyById.get(sourceWallet.currency_id)?.code : undefined

  // The dish/shop catalog flow only applies to the Food category — everything
  // else keeps the plain free-text merchant field.
  const selectedCategoryName = categories.data?.find((c) => c.id === categoryId)?.name
  const isFoodCategory = !isTransfer && selectedCategoryName === "Food"

  // While the amount tracks the cart total live, it's read-only; "Edit
  // manually" (or the cost-confirm dialog's override) unlocks it.
  React.useEffect(() => {
    if (isFoodCategory && dishCart.length > 0 && !amountManuallyEdited) {
      form.setValue("amount", cartTotal(dishCart))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishCart, amountManuallyEdited, isFoodCategory])

  React.useEffect(() => {
    if (!open) return

    if (transaction) {
      form.reset({
        wallet_id: transaction.wallet_id ?? "",
        transaction_type: transaction.transaction_type as TransactionFormValues["transaction_type"],
        category_id: transaction.category_id ?? "",
        subcategory_id: transaction.subcategory_id ?? "",
        to_wallet_id: transaction.to_wallet_id ?? "",
        merchant: transaction.merchant ?? "",
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

      // Reconstruct the shop/cart display from the saved snapshot. Amount
      // stays manually-controlled on edit (not re-synced to the cart total)
      // so a discount-adjusted historical amount is never silently
      // overwritten just by opening the dialog.
      const matchedShop = shops.data?.find((s) => s.name === transaction.merchant) ?? null
      setShop(matchedShop)
      const existingDishItems = (transaction.dish_items as unknown as ExistingDishItem[] | null) ?? []
      setDishCart(
        existingDishItems.map((item) => ({
          key: item.id,
          dish_id: item.dish_id,
          dish_name: item.dish_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          currency_id: sourceWallet?.currency_id ?? null,
          image_storage_path: item.image_storage_path,
        }))
      )
      setAmountManuallyEdited(true)
    } else {
      form.reset({
        wallet_id: "",
        transaction_type: "expense",
        category_id: "",
        subcategory_id: "",
        to_wallet_id: "",
        merchant: "",
        amount: 0,
        occurred_at: new Date().toISOString().slice(0, 10),
        note: "",
      })
      setAnswers({})
      setShop(null)
      setDishCart([])
      setAmountManuallyEdited(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id])

  function handleTypeChange(nextType: TransactionFormValues["transaction_type"]) {
    form.setValue("transaction_type", nextType)
    form.setValue("category_id", "")
    form.setValue("subcategory_id", "")
    form.setValue("to_wallet_id", "")
    setAnswers({})
    setShop(null)
    setDishCart([])
    setAmountManuallyEdited(false)
  }

  function handleCategoryChange(nextCategoryId: string | null) {
    form.setValue("category_id", nextCategoryId ?? "")
    form.setValue("subcategory_id", "")
    setAnswers({})
    setShop(null)
    setDishCart([])
    setAmountManuallyEdited(false)
  }

  function handleShopSelect(nextShop: Shop | null) {
    setShop(nextShop)
    form.setValue("merchant", nextShop?.name ?? "")
    setDishCart([])
    setAmountManuallyEdited(false)
  }

  function handleAddDish(dish: Dish) {
    setDishCart((current) => {
      const existing = current.find((item) => item.dish_id === dish.id)
      if (existing) {
        return current.map((item) =>
          item.key === existing.key ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...current,
        {
          key: dish.id,
          dish_id: dish.id,
          dish_name: dish.name,
          unit_price: dish.price,
          quantity: 1,
          currency_id: dish.currency_id,
          image_storage_path: dish.image_storage_path,
        },
      ]
    })
  }

  function handleDishQuantityChange(key: string, quantity: number) {
    setDishCart((current) => current.map((item) => (item.key === key ? { ...item, quantity } : item)))
  }

  function handleRemoveDish(key: string) {
    setDishCart((current) => current.filter((item) => item.key !== key))
  }

  function handleSubcategoryChange(nextSubcategoryId: string | null) {
    form.setValue("subcategory_id", nextSubcategoryId ?? "")
    setAnswers({})
  }

  async function performSave(values: TransactionFormValues) {
    const isTransferSubmit = values.transaction_type === "transfer"

    const input = {
      wallet_id: values.wallet_id,
      category_id: isTransferSubmit ? null : values.category_id || null,
      subcategory_id: isTransferSubmit ? null : values.subcategory_id || null,
      transaction_type: values.transaction_type,
      to_wallet_id: isTransferSubmit ? values.to_wallet_id || null : null,
      merchant: isTransferSubmit ? null : values.merchant || null,
      amount: values.amount,
      occurred_at: new Date(values.occurred_at).toISOString(),
      note: values.note || null,
      answers: isTransferSubmit
        ? []
        : allQuestions.filter((q) => answers[q.id]).map((q) => ({ question_id: q.id, ...answers[q.id] })),
    }

    try {
      let savedId: string
      if (isEditing) {
        const saved = await updateTransaction.mutateAsync({ id: transaction.id!, input })
        savedId = saved.id
        toast.success("Transaction updated")
      } else {
        const saved = await createTransaction.mutateAsync(input)
        savedId = saved.id
        toast.success("Transaction recorded")
      }

      let ensuredEntries: FoodLogEntry[] = []
      if (isFoodCategory && dishCart.length > 0) {
        try {
          await createTransactionDishItems.mutateAsync({
            transactionId: savedId,
            items: dishCart.map(({ key, ...item }) => item),
          })
        } catch (error) {
          toast.error(error, "Transaction saved, but the dishes couldn't be attached")
        }

        // Every dish gets a Food Log entry the moment it's bought — even
        // before its taste is logged — so it always shows up in the Food
        // Log tab. Existing entries (a repeat purchase) are left untouched.
        try {
          ensuredEntries = await ensureFoodLogEntries.mutateAsync(
            dishCart
              .filter((item) => item.dish_id)
              .map((item) => ({
                dish_id: item.dish_id!,
                food_name: item.dish_name,
                price: item.unit_price,
                currency_id: item.currency_id,
                shop: shop?.name,
                image_storage_path: item.image_storage_path,
                occurred_at: new Date(values.occurred_at).toISOString(),
              }))
          )
        } catch (error) {
          toast.error(error, "Transaction saved, but the food log couldn't be updated")
        }
      }

      setOpen(false)

      // Only prompt on a fresh Food purchase, not when correcting an old one.
      if (!isEditing && isFoodCategory && ensuredEntries.length > 0) {
        setTastePrompt({ open: true, entries: ensuredEntries })
      }
    } catch (error) {
      toast.error(error, "Couldn't save transaction")
    }
  }

  async function onSubmit(values: TransactionFormValues) {
    const unanswered = allQuestions.filter((q) => q.is_required && !answers[q.id])
    if (unanswered.length > 0) {
      toast.error(`Please answer: ${unanswered.map((q) => q.prompt).join(", ")}`)
      return
    }

    // A dish-sum amount needs a "is this really the cost?" checkpoint before
    // saving, since discounts/offers mean the catalog sum isn't always the
    // real total. Manually-edited amounts skip straight through.
    if (isFoodCategory && dishCart.length > 0 && !amountManuallyEdited) {
      setPendingSubmitValues(values)
      setCostConfirmOpen(true)
      return
    }

    await performSave(values)
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
            <div className="grid grid-cols-3 gap-2">
              {TRANSACTION_RECORD_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={transactionType === type ? "default" : "outline"}
                  onClick={() => handleTypeChange(type)}
                >
                  {TRANSACTION_RECORD_TYPE_LABELS[type]}
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

            {isTransfer ? (
              <FormField
                control={form.control}
                name="to_wallet_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To wallet</FormLabel>
                    <Select
                      items={Object.fromEntries(
                        destinationWalletOptions.map((w) => [w.id, w.name])
                      )}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!walletId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              walletId ? "Select a wallet" : "Select a source wallet first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {destinationWalletOptions.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {walletId && destinationWalletOptions.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No other wallet shares this wallet's currency — transfers are
                        same-currency only for now.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
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

                {isFoodCategory ? (
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label>Shop</Label>
                      <ShopPicker value={shop} onSelect={handleShopSelect} />
                    </div>
                    {shop && (
                      <div className="grid gap-1.5">
                        <Label>Dishes</Label>
                        <DishPicker
                          shopId={shop.id}
                          onSelect={handleAddDish}
                          defaultCurrencyId={sourceWallet?.currency_id}
                        />
                        <DishCart
                          items={dishCart}
                          currencyCode={walletCurrencyCode ?? "USD"}
                          onQuantityChange={handleDishQuantityChange}
                          onRemove={handleRemoveDish}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="merchant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop / merchant (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7-Eleven" list="merchant-options" {...field} />
                        </FormControl>
                        <datalist id="merchant-options">
                          {merchants.data?.map((name) => <option key={name} value={name} />)}
                        </datalist>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const isAutoTracking = isFoodCategory && dishCart.length > 0 && !amountManuallyEdited
                  return (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          readOnly={isAutoTracking}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      {isAutoTracking && (
                        <p className="text-xs text-muted-foreground">
                          Tracking the dish total —{" "}
                          <button
                            type="button"
                            className="underline"
                            onClick={() => setAmountManuallyEdited(true)}
                          >
                            edit manually
                          </button>
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
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

            {allQuestions.length > 0 && (
              <div className="grid gap-4 border-t pt-4">
                {allQuestions.map((question) => (
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

      <CostConfirmDialog
        open={costConfirmOpen}
        onOpenChange={setCostConfirmOpen}
        amount={cartTotal(dishCart)}
        currencyCode={walletCurrencyCode ?? "USD"}
        onConfirm={() => {
          setCostConfirmOpen(false)
          if (pendingSubmitValues) performSave(pendingSubmitValues)
        }}
        onOverride={() => {
          setCostConfirmOpen(false)
          setAmountManuallyEdited(true)
        }}
      />

      <DishTastePromptDialog
        open={tastePrompt.open}
        onOpenChange={(nextOpen) => setTastePrompt((current) => ({ ...current, open: nextOpen }))}
        entries={tastePrompt.entries}
      />
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
