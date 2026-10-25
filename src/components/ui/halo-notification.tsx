"use client"

import {
  forwardRef,
  useEffect,
  type ReactNode,
} from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { XIcon } from "lucide-react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const

const BORDER_TRAIL_LOOP_MS = 5250

const CARD_INNER_RADIUS_CLASS = "rounded-[calc(1rem-1px)]"

export type RimVariant = "default" | "success" | "destructive"

const RIM_BLOB_GRADIENTS: Record<
  RimVariant,
  { primaryBg: string; secondaryBg: string; tertiaryBg: string }
> = {
  default: {
    primaryBg: "linear-gradient(90deg, #501A96, #108AC2, #501A96)",
    secondaryBg: "linear-gradient(90deg, #108AC2, #501A96, #108AC2)",
    tertiaryBg: "linear-gradient(90deg, #501A96, #108AC2, #501A96)",
  },
  success: {
    primaryBg:
      "linear-gradient(90deg, #047857, #059669, #10b981, #14b8a6, #0d9488)",
    secondaryBg: "linear-gradient(90deg, #34d399, #6ee7b7, #2dd4bf, #5eead4)",
    tertiaryBg: "linear-gradient(90deg, #065f46, #047857, #0f766e)",
  },
  destructive: {
    primaryBg:
      "linear-gradient(90deg, #991b1b, #dc2626, #e11d48, #f43f5e, #be123c)",
    secondaryBg: "linear-gradient(90deg, #fb7185, #fda4af, #f87171, #fecdd3)",
    tertiaryBg: "linear-gradient(90deg, #7f1d1d, #b91c1c, #dc2626)",
  },
}

interface BorderTrailChrome {
  ambientGradient: string
  ambientGlow: string
  coreGradient: string
  coreGlow: string
}

const RIM_BORDER_TRAIL: Record<RimVariant, BorderTrailChrome> = {
  default: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(80,26,150,0) 6%, rgba(80,26,150,0.38) 24%, rgba(80,26,150,0.5) 50%, rgba(16,138,194,0.42) 76%, rgba(16,138,194,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(80,26,150,0.72) 20%, rgba(80,26,150,0.92) 50%, rgba(16,138,194,0.78) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(80,26,150,0.28), 0 0 44px rgba(16,138,194,0.18), 0 0 2px rgba(255,255,255,0.12)",
    coreGlow:
      "0 0 14px rgba(80,26,150,0.35), 0 0 28px rgba(16,138,194,0.32), inset 0 0 1px rgba(255,255,255,0.22)",
  },
  success: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0) 6%, rgba(16,185,129,0.36) 24%, rgba(20,184,166,0.48) 50%, rgba(13,148,136,0.4) 76%, rgba(13,148,136,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0.68) 20%, rgba(52,211,153,0.88) 50%, rgba(20,184,166,0.8) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(16,185,129,0.32), 0 0 44px rgba(13,148,136,0.22), 0 0 2px rgba(255,255,255,0.1)",
    coreGlow:
      "0 0 14px rgba(5,150,105,0.42), 0 0 28px rgba(20,184,166,0.4), inset 0 0 1px rgba(255,255,255,0.2)",
  },
  destructive: {
    ambientGradient:
      "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0) 6%, rgba(220,38,38,0.4) 24%, rgba(244,63,94,0.52) 50%, rgba(190,18,60,0.44) 76%, rgba(190,18,60,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.75) 20%, rgba(251,113,133,0.9) 50%, rgba(244,63,94,0.82) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(220,38,38,0.35), 0 0 44px rgba(244,63,94,0.24), 0 0 2px rgba(255,255,255,0.08)",
    coreGlow:
      "0 0 14px rgba(220,38,38,0.48), 0 0 28px rgba(244,63,94,0.4), inset 0 0 1px rgba(255,255,255,0.16)",
  },
}

function NotificationCardBorderTrail({
  active,
  rimVariant = "default",
}: {
  active: boolean
  rimVariant?: RimVariant
}) {
  const progress = useMotionValue(0)
  const offsetDistance = useTransform(progress, (v: number) => {
    const wrapped = ((v % 100) + 100) % 100
    return `${wrapped}%`
  })

  useEffect(() => {
    if (!active) {
      return
    }
    let rafId = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      const next = progress.get() + (dt / BORDER_TRAIL_LOOP_MS) * 100
      progress.set(((next % 100) + 100) % 100)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active, progress])

  const pathCornerRadiusPx = 16
  const trailLengthPx = 184
  const trailThicknessPx = 32

  const trailBox = {
    height: trailThicknessPx,
    offsetPath: `rect(0 auto auto 0 round ${pathCornerRadiusPx}px)`,
    width: trailLengthPx,
  } as const

  const trail = RIM_BORDER_TRAIL[rimVariant]

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
        active ? "visible opacity-100" : "invisible opacity-0"
      )}
    >
      <motion.div
        className="absolute opacity-95 dark:opacity-[0.98]"
        style={{
          ...trailBox,
          filter: "blur(12px)",
          offsetDistance,
        }}
      >
        <div
          className="size-full rounded-[999px]"
          style={{
            background: trail.ambientGradient,
            boxShadow: trail.ambientGlow,
          }}
        />
      </motion.div>
      <motion.div
        className="absolute dark:opacity-[0.94]"
        style={{
          ...trailBox,
          filter: "blur(4px)",
          offsetDistance,
        }}
      >
        <div
          className="size-full rounded-[999px]"
          style={{
            background: trail.coreGradient,
            boxShadow: trail.coreGlow,
          }}
        />
      </motion.div>
    </div>
  )
}

function notificationBorderGlowConfig(
  translucent: boolean,
  rimEmphasis: boolean,
  rimVariant: RimVariant = "default"
) {
  let idleOpacity: number
  if (translucent) {
    idleOpacity = rimEmphasis ? 0.92 : 0.72
  } else {
    idleOpacity = rimEmphasis ? 0.78 : 0.5
  }
  const gradients = RIM_BLOB_GRADIENTS[rimVariant]
  return {
    opacityIdle: idleOpacity,
    primaryBg: gradients.primaryBg,
    secondaryBg: gradients.secondaryBg,
    tertiaryBg: gradients.tertiaryBg,
    primaryLeft: ["-5%", "75%", "-5%"],
    secondaryLeft: ["65%", "10%", "65%"],
    tertiaryLeft: ["25%", "55%", "25%"],
    durationMain: 6,
    durationSec: 5,
    durationTer: 4,
  }
}

type NotificationBorderGlowState = ReturnType<
  typeof notificationBorderGlowConfig
>

function NotificationCardRimBlobs({
  borderGlow,
  reduceMotion,
}: {
  borderGlow: NotificationBorderGlowState
  reduceMotion: boolean
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        CARD_INNER_RADIUS_CLASS
      )}
    >
      <motion.div
        animate={{
          opacity: reduceMotion
            ? borderGlow.opacityIdle * 0.82
            : borderGlow.opacityIdle,
        }}
        className="absolute inset-x-0 bottom-0 h-[58%]"
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <motion.div
          animate={{
            left: borderGlow.primaryLeft,
          }}
          className="-bottom-10 absolute h-32 w-88 blur-2xl"
          style={{
            background: borderGlow.primaryBg,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : borderGlow.durationMain,
            repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          animate={{
            left: borderGlow.secondaryLeft,
          }}
          className="-bottom-7 absolute h-24 w-52 blur-2xl"
          style={{
            background: borderGlow.secondaryBg,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : borderGlow.durationSec,
            repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          animate={{
            left: borderGlow.tertiaryLeft,
          }}
          className="-bottom-5 absolute h-20 w-44 blur-xl"
          style={{
            background: borderGlow.tertiaryBg,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : borderGlow.durationTer,
            repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  )
}

export interface HaloPolishedNotificationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode
  description?: ReactNode
  politeness?: "alert" | "status"
  messageKey?: string
  onDismiss?: () => void
  slideFrom?: "top" | "bottom"
  rimVariant?: RimVariant
  translucent?: boolean
}

export const HaloPolishedNotification = forwardRef<
  HTMLDivElement,
  HaloPolishedNotificationProps
>(
  (
    {
      className,
      title,
      description,
      politeness = "status",
      messageKey,
      onDismiss,
      slideFrom = "bottom",
      rimVariant = "default",
      translucent = true,
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion() ?? false
    const borderGlow = notificationBorderGlowConfig(
      translucent,
      true,
      rimVariant
    )

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: slideFrom === "top" ? -24 : 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl p-px",
          translucent
            ? "bg-background/40 backdrop-blur-xl backdrop-saturate-150"
            : "bg-background",
          className
        )}
        role={politeness}
        aria-live={politeness}
        {...props}
      >
        <NotificationCardBorderTrail active={true} rimVariant={rimVariant} />
        <NotificationCardRimBlobs
          borderGlow={borderGlow}
          reduceMotion={reduceMotion}
        />

        <div
          className={cn(
            "relative z-10 flex w-full flex-col gap-2 bg-background/80 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_2px_10px_rgba(0,0,0,0.35)]",
            CARD_INNER_RADIUS_CLASS,
            paddingClass.sm
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">
                {title}
              </span>
              {description && (
                <span className="text-sm text-muted-foreground text-pretty">
                  {description}
                </span>
              )}
            </div>
            {onDismiss && (
              <ButtonPrimitive
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onDismiss}
                aria-label="Dismiss notification"
              >
                <XIcon className="size-4" />
              </ButtonPrimitive>
            )}
          </div>
        </div>
      </motion.div>
    )
  }
)
HaloPolishedNotification.displayName = "HaloPolishedNotification"
