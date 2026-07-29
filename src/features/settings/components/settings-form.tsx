import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
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
import { useSettings, useUpdateSettings } from "@/features/settings/hooks/use-settings"
import { settingsFormSchema, type SettingsFormValues } from "@/features/settings/schemas"
import { THEME_PREFERENCES } from "@/types/enums"
import { toast } from "@/lib/toast"

const THEME_LABELS: Record<(typeof THEME_PREFERENCES)[number], string> = {
  light: "Light",
  dark: "Dark",
  system: "Match system",
}

export function SettingsForm() {
  const { data: settings } = useSettings()
  const { data: currencies } = useCurrencies()
  const updateSettings = useUpdateSettings()
  const { setTheme } = useTheme()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: {
      default_currency_id: settings?.default_currency_id ?? "",
      locale: settings?.locale ?? "en-US",
      theme: (settings?.theme as SettingsFormValues["theme"]) ?? "system",
    },
  })

  async function onSubmit(values: SettingsFormValues) {
    try {
      await updateSettings.mutateAsync(values)
      setTheme(values.theme)
      toast.success("Settings saved")
    } catch (error) {
      toast.error(error, "Couldn't save settings")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-md gap-4">
        <FormField
          control={form.control}
          name="default_currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default currency</FormLabel>
              <Select
                items={Object.fromEntries(
                  (currencies ?? []).map((c) => [c.id, `${c.code} (${c.symbol}) — ${c.name}`])
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
                      {currency.code} ({currency.symbol}) — {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Used as the default when creating a new wallet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Locale</FormLabel>
              <FormControl>
                <Input placeholder="en-US" {...field} />
              </FormControl>
              <FormDescription>Used to format dates and numbers.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <Select items={THEME_LABELS} value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {THEME_PREFERENCES.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {THEME_LABELS[theme]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-fit" disabled={updateSettings.isPending}>
          Save settings
        </Button>
      </form>
    </Form>
  )
}
