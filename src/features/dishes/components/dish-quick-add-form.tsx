import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, Images } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/hooks/use-auth"
import { useCurrencies } from "@/features/currencies/hooks/use-currencies"
import { useDishCategories } from "@/features/dishes/hooks/use-dish-categories"
import { useCreateDish } from "@/features/dishes/hooks/use-dishes"
import { useUploadDishImage } from "@/features/dishes/hooks/use-dish-images"
import { dishQuickAddFormSchema, type DishQuickAddFormValues } from "@/features/dishes/schemas"
import type { Dish } from "@/services/repositories/dishes.repository"
import { toast } from "@/lib/toast"

/** Inline "add new dish" form embedded in DishPicker's popover when a search doesn't match anything — creates the dish, then (if a photo was picked) uploads it as a follow-up step, same pattern as AttachmentPicker's stage-then-upload-after-save. */
export function DishQuickAddForm({
  shopId,
  initialName,
  defaultCurrencyId,
  onCreated,
  onCancel,
}: {
  shopId: string
  initialName: string
  defaultCurrencyId?: string
  onCreated: (dish: Dish) => void
  onCancel: () => void
}) {
  const { user } = useAuth()
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const galleryInputRef = React.useRef<HTMLInputElement>(null)

  const currencies = useCurrencies()
  const dishCategories = useDishCategories()
  const createDish = useCreateDish()
  const uploadDishImage = useUploadDishImage()

  const form = useForm<DishQuickAddFormValues>({
    resolver: zodResolver(dishQuickAddFormSchema),
    defaultValues: {
      name: initialName,
      price: 0,
      currency_id: defaultCurrencyId ?? "",
      dish_category_id: "",
    },
  })

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  async function onSubmit(values: DishQuickAddFormValues) {
    if (!user) return
    try {
      const dish = await createDish.mutateAsync({
        shop_id: shopId,
        name: values.name,
        price: values.price,
        currency_id: values.currency_id || null,
        dish_category_id: values.dish_category_id || null,
      })

      let finalDish = dish
      if (imageFile) {
        try {
          finalDish = await uploadDishImage.mutateAsync({
            dishId: dish.id,
            userId: user.id,
            file: imageFile,
          })
        } catch (error) {
          toast.error(error, "Dish saved, but the photo failed to upload")
        }
      }

      onCreated(finalDish)
    } catch (error) {
      toast.error(error, "Couldn't add dish")
    }
  }

  const isSubmitting = createDish.isPending || uploadDishImage.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 border-t pt-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dish name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
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
                      field.onChange(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  items={Object.fromEntries((currencies.data ?? []).map((c) => [c.id, c.code]))}
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
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dish_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food category (optional)</FormLabel>
              <Select
                items={Object.fromEntries((dishCategories.data ?? []).map((c) => [c.id, c.name]))}
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dishCategories.data?.map((category) => (
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

        <div className="grid gap-1.5">
          <Label>Photo (optional)</Label>
          <div className="flex items-center gap-2">
            {imagePreviewUrl && (
              <img src={imagePreviewUrl} alt="" className="size-14 rounded-md border object-cover" />
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="size-3.5" />
              Camera
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()}>
              <Images className="size-3.5" />
              Gallery
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            Add dish
          </Button>
        </div>
      </form>
    </Form>
  )
}
