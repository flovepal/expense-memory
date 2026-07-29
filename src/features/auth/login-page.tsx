import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/lib/toast"
import { authFormSchema, type AuthFormValues } from "@/features/auth/schemas"

type Mode = "sign-in" | "sign-up"

export function LoginPage() {
  const [mode, setMode] = React.useState<Mode>("sign-in")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = React.useState<string | null>(null)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: AuthFormValues) {
    setIsSubmitting(true)
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword(values)
        if (error) throw error
        // Session updates via onAuthStateChange; App re-renders into the app.
      } else {
        const { data, error } = await supabase.auth.signUp(values)
        if (error) throw error

        if (data.session) {
          // Email confirmation is off for this project - signed in immediately.
          toast.success("Account created")
        } else {
          // Email confirmation is required - no session until the link is clicked.
          setConfirmationSentTo(values.email)
        }
      }
    } catch (error) {
      toast.error(error, mode === "sign-in" ? "Couldn't sign in" : "Couldn't sign up")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmationSentTo) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <MailCheck className="size-8 text-muted-foreground" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{confirmationSentTo}</strong>. Click it,
              then come back and sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setConfirmationSentTo(null)
                setMode("sign-in")
                form.reset()
              }}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Expense Memory</CardTitle>
          <CardDescription>
            {mode === "sign-in"
              ? "Sign in to see your wallets and transactions."
              : "Create an account to start tracking expenses."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in")
                  form.reset()
                }}
              >
                {mode === "sign-in"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
