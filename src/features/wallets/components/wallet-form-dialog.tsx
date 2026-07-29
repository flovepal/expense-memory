import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useCreateWallet, useUpdateWallet } from "@/features/wallets/hooks/use-wallets"
import { walletFormSchema, type WalletFormValues } from "@/features/wallets/schemas"
import { WALLET_TYPES, WALLET_TYPE_LABELS } from "@/types/enums"
import type { Wallet } from "@/services/repositories/wallets.repository"
import { toast } from "@/lib/toast"

export function WalletFormDialog({
  wallet,
  trigger,
}: {
  wallet?: Wallet
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const { data: currencies } = useCurrencies()
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()

  const isEditing = !!wallet

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    values: {
      name: wallet?.name ?? "",
      type: (wallet?.type as WalletFormValues["type"]) ?? "cash",
      currency_id: wallet?.currency_id ?? "",
      initial_balance: wallet?.initial_balance ?? 0,
      icon: wallet?.icon ?? "",
      color: wallet?.color ?? "",
    },
  })

  async function onSubmit(values: WalletFormValues) {
    try {
      if (isEditing) {
        await updateWallet.mutateAsync({ id: wallet.id, input: values })
        toast.success("Wallet updated")
      } else {
        await createWallet.mutateAsync(values)
        toast.success("Wallet created")
      }
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error(error, "Couldn't save wallet")
    }
  }

  const isSubmitting = createWallet.isPending || updateWallet.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit wallet" : "New wallet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this wallet's details."
              : "Add a cash, bank, or card wallet to track transactions against."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Everyday Cash" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      items={WALLET_TYPE_LABELS}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WALLET_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {WALLET_TYPE_LABELS[type]}
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
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      items={Object.fromEntries(
                        (currencies ?? []).map((c) => [c.id, `${c.code} (${c.symbol})`])
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
                        {currencies?.map((currency) => (
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
            </div>
            <FormField
              control={form.control}
              name="initial_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isEditing ? "Save changes" : "Create wallet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
