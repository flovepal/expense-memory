import { createBrowserRouter } from "react-router"

import { AppShell } from "@/components/layout/app-shell"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      {
        index: true,
        lazy: () => import("@/features/dashboard/dashboard-page").then((m) => ({ Component: m.DashboardPage })),
      },
      {
        path: "transactions",
        lazy: () =>
          import("@/features/transactions/transactions-page").then((m) => ({
            Component: m.TransactionsPage,
          })),
      },
      {
        path: "wallets",
        lazy: () =>
          import("@/features/wallets/wallets-page").then((m) => ({ Component: m.WalletsPage })),
      },
      {
        path: "food-log",
        lazy: () =>
          import("@/features/food-log/food-log-page").then((m) => ({ Component: m.FoodLogPage })),
      },
      {
        path: "settings",
        lazy: () =>
          import("@/features/settings/settings-page").then((m) => ({ Component: m.SettingsPage })),
      },
    ],
  },
])
