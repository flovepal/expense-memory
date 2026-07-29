import * as React from "react"
import type { Session, User } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase/client"

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/**
 * Tracks the Supabase session for the whole app. Real email/password
 * accounts are required (see features/auth/login-page.tsx) so the same
 * data follows a user across devices — unlike an anonymous session, which
 * is scoped to one browser and can't be "logged into" from a phone.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setIsLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isLoading }),
    [session, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
