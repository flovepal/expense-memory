import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { useSettings } from "@/features/settings/hooks/use-settings"

export function SettingsPage() {
  const settings = useSettings()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      {settings.isLoading && <LoadingState />}
      {settings.isError && (
        <ErrorState message="Couldn't load settings." onRetry={() => settings.refetch()} />
      )}
      {settings.isSuccess && <SettingsForm />}
    </div>
  )
}
