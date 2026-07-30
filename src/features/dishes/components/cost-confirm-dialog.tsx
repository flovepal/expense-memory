import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"

/** "Is this the cost?" — the dish-catalog sum is a starting point, not gospel (discounts/offers vary), so this always offers a manual override rather than just confirming. */
export function CostConfirmDialog({
  open,
  onOpenChange,
  amount,
  currencyCode,
  onConfirm,
  onOverride,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  currencyCode: string
  onConfirm: () => void
  onOverride: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Is {formatCurrency(amount, currencyCode)} the cost?</AlertDialogTitle>
          <AlertDialogDescription>
            That's the sum of the dishes you added. If a discount or offer changed the actual
            total, you can enter it yourself instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onOverride}>
            No, let me enter it
          </Button>
          <AlertDialogAction onClick={onConfirm}>Yes, that's right</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
