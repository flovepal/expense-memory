import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FoodLogFormDialog } from "@/features/food-log/components/food-log-form-dialog"
import { formatCurrency } from "@/lib/format"

export type TastePromptDish = {
  dish_id: string
  dish_name: string
  unit_price: number
  currency_code: string
  shop_name?: string | null
  image_storage_path?: string | null
}

/** Shown after saving a Food transaction with dishes — fully skippable, one tap per dish opens the existing Food Log questionnaire pre-filled from that dish. */
export function DishTastePromptDialog({
  open,
  onOpenChange,
  dishes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dishes: TastePromptDish[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log the taste of these dishes?</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {dishes.map((dish) => (
            <div key={dish.dish_id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border p-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{dish.dish_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(dish.unit_price, dish.currency_code)}
                </span>
              </div>
              <FoodLogFormDialog
                prefill={{
                  dish_id: dish.dish_id,
                  food_name: dish.dish_name,
                  price: dish.unit_price,
                  shop: dish.shop_name,
                  image_storage_path: dish.image_storage_path,
                }}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    Log taste
                  </Button>
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
