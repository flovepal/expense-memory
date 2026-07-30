import { NavLink, Outlet } from "react-router"
import {
  LayoutDashboard,
  Receipt,
  Wallet as WalletIcon,
  Tags,
  FolderTree,
  UtensilsCrossed,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/wallets", label: "Wallets", icon: WalletIcon },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/food-log", label: "Food Log", icon: UtensilsCrossed },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

export function AppShell() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight">
            <svg width="22" height="22" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <rect width="56" height="56" rx="13" fill="#211C15" />
              <line x1="28" y1="10" x2="28" y2="46" stroke="#D9A257" strokeWidth="3" strokeLinecap="round" />
              <path d="M28 17 L19 10 M28 17 L37 10" stroke="#D9A257" strokeWidth="3" strokeLinecap="round" />
              <path d="M28 25 L18 17 M28 25 L38 17" stroke="#D9A257" strokeWidth="3" strokeLinecap="round" />
              <path d="M28 33 L18 25 M28 33 L38 25" stroke="#D9A257" strokeWidth="3" strokeLinecap="round" />
              <circle cx="28" cy="10" r="3" fill="#D9A257" />
            </svg>
            Flovepal DJ
          </span>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
