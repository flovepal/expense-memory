import { AlertCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ErrorState({
  className,
  message = "Something went wrong.",
  onRetry,
}: {
  className?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center",
        className
      )}
    >
      <AlertCircle className="size-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  )
}
