import { MoreVertical, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { WalletFormDialog } from "@/features/wallets/components/wallet-form-dialog"
import { useDeleteWallet, useSetWalletArchived } from "@/features/wallets/hooks/use-wallets"
import { WALLET_TYPE_LABELS, type WalletType } from "@/types/enums"
import { formatCurrency } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { Wallet, WalletBalance } from "@/services/repositories/wallets.repository"

export function WalletCard({ wallet, balance }: { wallet: Wallet; balance?: WalletBalance }) {
  const setArchived = useSetWalletArchived()
  const deleteWallet = useDeleteWallet()

  async function handleToggleArchive() {
    try {
      await setArchived.mutateAsync({ id: wallet.id, isArchived: !wallet.is_archived })
      toast.success(wallet.is_archived ? "Wallet restored" : "Wallet archived")
    } catch (error) {
      toast.error(error)
    }
  }

  async function handleDelete() {
    try {
      await deleteWallet.mutateAsync(wallet.id)
      toast.success("Wallet deleted")
    } catch (error) {
      toast.error(error, "Couldn't delete wallet")
    }
  }

  return (
    <Card className={wallet.is_archived ? "opacity-60" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{wallet.name}</CardTitle>
          <Badge variant="secondary" className="mt-1">
            {WALLET_TYPE_LABELS[wallet.type as WalletType]}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <WalletFormDialog
              wallet={wallet}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onSelect={handleToggleArchive}>
              {wallet.is_archived ? (
                <>
                  <ArchiveRestore className="size-4" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="size-4" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{wallet.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This hides the wallet and its transactions from your lists. This can't be
                    undone from the UI.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {balance
            ? formatCurrency(
                balance.current_balance ?? 0,
                balance.currency_code ?? "USD",
                balance.currency_decimal_digits ?? 2
              )
            : "—"}
        </p>
      </CardContent>
    </Card>
  )
}
