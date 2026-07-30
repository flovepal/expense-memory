import { Link as LinkIcon, Pencil, Star, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FoodLogFormDialog } from "@/features/food-log/components/food-log-form-dialog"
import { useDeleteFoodLogEntry } from "@/features/food-log/hooks/use-food-log"
import { useCurrencies } from "@/features/currencies/hooks/use-currencies"
import {
  FLAVOR_LABELS,
  TEXTURE_LABELS,
  WOULD_ORDER_AGAIN_LABELS,
  type Flavor,
  type Texture,
  type WouldOrderAgain,
} from "@/features/food-log/schemas"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { FoodLogEntry } from "@/services/repositories/food-log.repository"

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= rating ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-muted-foreground"}
        />
      ))}
    </div>
  )
}

export function FoodLogList({ entries }: { entries: FoodLogEntry[] }) {
  const deleteEntry = useDeleteFoodLogEntry()
  const currencies = useCurrencies()

  const currencyById = new Map((currencies.data ?? []).map((c) => [c.id, c]))

  function formatPrice(entry: FoodLogEntry) {
    if (entry.price == null) return null
    const currency = entry.currency_id ? currencyById.get(entry.currency_id) : undefined
    return formatCurrency(entry.price, currency?.code ?? "USD", currency?.decimal_digits ?? 2)
  }

  async function handleDelete(id: string) {
    try {
      await deleteEntry.mutateAsync(id)
      toast.success("Food log entry deleted")
    } catch (error) {
      toast.error(error, "Couldn't delete food log entry")
    }
  }

  function FlavorTextureBadges({ entry }: { entry: FoodLogEntry }) {
    const flavors = (entry.flavors ?? []) as Flavor[]
    const texture = (entry.texture ?? []) as Texture[]
    if (flavors.length === 0 && texture.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1">
        {flavors.map((f) => (
          <Badge key={f} variant="outline" className="text-[10px]">
            {FLAVOR_LABELS[f]}
          </Badge>
        ))}
        {texture.map((t) => (
          <Badge key={t} variant="outline" className="text-[10px]">
            {TEXTURE_LABELS[t]}
          </Badge>
        ))}
      </div>
    )
  }

  function RowActions({ entry }: { entry: FoodLogEntry }) {
    return (
      <div className="flex items-center justify-end gap-1">
        <FoodLogFormDialog
          entry={entry}
          trigger={
            <Button variant="ghost" size="icon" className="size-7">
              <Pencil className="size-3.5" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon" className="size-7">
                <Trash2 className="size-3.5" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this food log entry?</AlertDialogTitle>
              <AlertDialogDescription>This can't be undone from the UI.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(entry.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <>
      {/* Card layout below sm — same reasoning as the transactions list: avoid a horizontally-scrolling table on phones. */}
      <div className="grid gap-3 sm:hidden">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{entry.food_name}</span>
                  {entry.transaction_id && (
                    <LinkIcon className="size-3 text-muted-foreground" aria-label="Linked to a transaction" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(entry.occurred_at)}</span>
              </div>
              <StarDisplay rating={entry.overall_rating} />
            </div>

            {(entry.shop || formatPrice(entry)) && (
              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                <span>{entry.shop || "—"}</span>
                <span>{formatPrice(entry)}</span>
              </div>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <FlavorTextureBadges entry={entry} />
              <Badge variant="secondary" className="text-[10px]">
                {WOULD_ORDER_AGAIN_LABELS[entry.would_order_again as WouldOrderAgain]}
              </Badge>
            </div>

            {entry.notes && (
              <p className="mt-1.5 truncate text-sm text-muted-foreground">{entry.notes}</p>
            )}

            <div className="mt-1.5 flex justify-end">
              <RowActions entry={entry} />
            </div>
          </div>
        ))}
      </div>

      {/* Table layout from sm up. */}
      <div className="hidden overflow-x-auto rounded-lg border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Shop / Price</TableHead>
              <TableHead>Flavors &amp; texture</TableHead>
              <TableHead>Order again</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{formatDate(entry.occurred_at)}</TableCell>
                <TableCell className="max-w-56">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{entry.food_name}</span>
                    {entry.transaction_id && (
                      <LinkIcon className="size-3 shrink-0 text-muted-foreground" aria-label="Linked to a transaction" />
                    )}
                  </div>
                  {entry.notes && (
                    <p className="truncate text-xs text-muted-foreground">{entry.notes}</p>
                  )}
                </TableCell>
                <TableCell>
                  <StarDisplay rating={entry.overall_rating} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-col">
                    <span>{entry.shop || "—"}</span>
                    {formatPrice(entry) && <span>{formatPrice(entry)}</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-56">
                  <FlavorTextureBadges entry={entry} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {WOULD_ORDER_AGAIN_LABELS[entry.would_order_again as WouldOrderAgain]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RowActions entry={entry} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
