import * as React from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type LightboxImage = { id: string; url: string }

const MIN_SCALE = 1
const MAX_SCALE = 4
const SWIPE_THRESHOLD_PX = 60
const DOUBLE_TAP_MS = 300

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Full-screen photo viewer: pinch (two-finger) or double-tap/double-click to
 * zoom, drag to pan while zoomed, drag left/right to swipe between images
 * when at 1x. Built on native Pointer Events (unifies mouse/touch/pen) —
 * no gesture library needed.
 */
export function ImageLightbox({
  images,
  initialIndex,
  open,
  onOpenChange,
}: {
  images: LightboxImage[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [index, setIndex] = React.useState(initialIndex)
  const [scale, setScale] = React.useState(1)
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 })
  const [isGesturing, setIsGesturing] = React.useState(false)

  const pointers = React.useRef(new Map<number, { x: number; y: number }>())
  const gesture = React.useRef<{
    mode: "none" | "pan" | "pinch"
    startDistance: number
    startScale: number
    startTranslate: { x: number; y: number }
    startPoint: { x: number; y: number }
    dx: number
  }>({
    mode: "none",
    startDistance: 0,
    startScale: 1,
    startTranslate: { x: 0, y: 0 },
    startPoint: { x: 0, y: 0 },
    dx: 0,
  })
  const lastTapAt = React.useRef(0)

  React.useEffect(() => {
    if (open) {
      setIndex(initialIndex)
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialIndex])

  function goTo(nextIndex: number) {
    setIndex(clamp(nextIndex, 0, images.length - 1))
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  function toggleZoom() {
    setScale((s) => (s > 1 ? 1 : 2.5))
    setTranslate({ x: 0, y: 0 })
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setIsGesturing(true)

    if (pointers.current.size === 1) {
      gesture.current.mode = "pan"
      gesture.current.startTranslate = translate
      gesture.current.startPoint = { x: e.clientX, y: e.clientY }
      gesture.current.dx = 0
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      gesture.current.mode = "pinch"
      gesture.current.startDistance = distance(pts[0], pts[1])
      gesture.current.startScale = scale
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (gesture.current.mode === "pinch" && pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      const nextScale = clamp(
        gesture.current.startScale * (distance(pts[0], pts[1]) / gesture.current.startDistance),
        MIN_SCALE,
        MAX_SCALE
      )
      setScale(nextScale)
    } else if (gesture.current.mode === "pan" && pointers.current.size === 1) {
      const dx = e.clientX - gesture.current.startPoint.x
      const dy = e.clientY - gesture.current.startPoint.y
      gesture.current.dx = dx
      if (scale > 1) {
        setTranslate({ x: gesture.current.startTranslate.x + dx, y: gesture.current.startTranslate.y + dy })
      }
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const wasSinglePointerDrag = pointers.current.size === 1 && gesture.current.mode === "pan"
    const dx = gesture.current.dx
    pointers.current.delete(e.pointerId)

    if (pointers.current.size === 0) {
      setIsGesturing(false)

      if (wasSinglePointerDrag && scale === 1 && Math.abs(dx) > SWIPE_THRESHOLD_PX) {
        goTo(index + (dx < 0 ? 1 : -1))
      } else if (scale > 1) {
        // no swipe while zoomed in — just settle the pan in place
      } else if (wasSinglePointerDrag && Math.abs(dx) < 10) {
        const now = Date.now()
        if (now - lastTapAt.current < DOUBLE_TAP_MS) {
          toggleZoom()
          lastTapAt.current = 0
        } else {
          lastTapAt.current = now
        }
      }

      gesture.current.mode = "none"
      gesture.current.dx = 0
    }
  }

  const current = images[index]
  if (!current) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none bg-black/95 p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Receipt photo</DialogTitle>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 text-white hover:bg-white/10 hover:text-white"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-5" />
        </Button>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
              onClick={() => goTo(index + 1)}
              disabled={index === images.length - 1}
            >
              <ChevronRight className="size-6" />
            </Button>
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-xs text-white/80">
              {index + 1} / {images.length}
            </div>
          </>
        )}

        <div
          className="flex flex-1 touch-none items-center justify-center overflow-hidden select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            key={current.id}
            src={current.url}
            alt=""
            draggable={false}
            className={cn(
              "max-h-full max-w-full object-contain",
              !isGesturing && "transition-transform duration-200"
            )}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
