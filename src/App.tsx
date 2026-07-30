import { RouterProvider } from "react-router"

import { useAuth } from "@/hooks/use-auth"
import { router } from "@/routes"
import { LoadingState } from "@/components/shared/loading-state"
import { LoginPage } from "@/features/auth/login-page"
import { Toaster } from "@/components/ui/sonner"

function App() {
  const { isLoading, session } = useAuth()

  return (
    <>
      {isLoading ? (
        <div className="flex min-h-svh items-center justify-center">
          <LoadingState label="Loading..." />
        </div>
      ) : session ? (
        <RouterProvider router={router} />
      ) : (
        <LoginPage />
      )}
      <Toaster />
    </>
  )
}

export default App
