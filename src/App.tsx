import { RouterProvider } from "react-router"

import { useAuth } from "@/hooks/use-auth"
import { router } from "@/routes"
import { LoadingState } from "@/components/shared/loading-state"
import { LoginPage } from "@/features/auth/login-page"

function App() {
  const { isLoading, session } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState label="Loading..." />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <RouterProvider router={router} />
}

export default App
