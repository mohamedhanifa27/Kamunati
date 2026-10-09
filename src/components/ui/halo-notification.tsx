"use client"

/**
 * Polished notification surface (`HaloPolishedToastSurface`) and
 * {@link HaloPolishedNotification} — slide + fade shell for local
 * `<AnimatePresence>` use. Self-contained {@link HaloCard}, rim variants, and
 * glyph stagger (no imports from `halo-card.tsx`). App-wide Sonner toasts:
 * `@/components/cult-pro/halo-toast`.
 */
import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
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

/* ─── Rim + card chrome (self-contained; no halo-card import) ─── */

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const

const BORDER_TRAIL_LOOP_MS = 5250

/** Inner corner radius for content inside `rounded-2xl` + `p-px` (concentric nested radii). */
const CARD_INNER_RADIUS_CLASS = "rounded-[calc(1rem-1px)]"

export type RimVariant = "default" | "success" | "destructive"

const RIM_BLOB_GRADIENTS: Record<
  RimVariant,
  { primaryBg: string; secondaryBg: string; tertiaryBg: string }
> = {
  default: {
    primaryBg: "linear-gradient(90deg, #ff0080, #7928ca, #00d4ff, #0070f3)",
    secondaryBg: "linear-gradient(90deg, #ff4d4d, #f9cb28, #ff0080)",
    tertiaryBg: "linear-gradient(90deg, #0070f3, #00d4ff, #7928ca)",
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
      "linear-gradient(90deg, transparent 0%, rgba(255,0,128,0) 6%, rgba(255,0,128,0.38) 24%, rgba(121,40,202,0.5) 50%, rgba(0,212,255,0.42) 76%, rgba(0,212,255,0) 94%, transparent 100%)",
    coreGradient:
      "linear-gradient(90deg, transparent 0%, rgba(255,0,128,0.72) 20%, rgba(200,140,255,0.92) 50%, rgba(0,212,255,0.78) 80%, transparent 100%)",
    ambientGlow:
      "0 0 22px rgba(121,40,202,0.28), 0 0 44px rgba(0,212,255,0.18), 0 0 2px rgba(255,255,255,0.12)",
    coreGlow:
      "0 0 14px rgba(255,0,128,0.35), 0 0 28px rgba(0,212,255,0.32), inset 0 0 1px rgba(255,255,255,0.22)",
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

interface HaloCardProps extends React.HTMLAttributes<HTMLDivElement> {
  translucent?: boolean
  rim?: RimVariant
  rimEmphasis?: boolean
  trailActive?: boolean
  padding?: keyof typeof paddingClass
}

/** Local fork of HaloCardPolished optimized for the notification surface. */
const HaloCard = forwardRef<HTMLDivElement, HaloCardProps>(
  (
    {
      className,
      children,
      translucent = false,
      rim = "default",
      rimEmphasis = false,
      trailActive = false,
      padding = "md",
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion() ?? false
    const borderGlow = useMemo(
      () => notificationBorderGlowConfig(translucent, rimEmphasis, rim),
      [translucent, rimEmphasis, rim]
    )

    return (
      <div
        ref={ref}
        className={cn(
          "group/halo-card relative w-full rounded-2xl p-px",
          "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_8px_32px_rgba(0,0,0,0.18)]",
          className
        )}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] border border-border/65 dark:border-border/85"
          style={
            translucent
              ? {
                  maskImage:
                    "linear-gradient(to bottom, #000 65%, transparent 100%)",
                }
              : undefined
          }
        />
        {translucent ? (
          <NotificationCardRimBlobs
            borderGlow={borderGlow}
            reduceMotion={reduceMotion}
          />
        ) : null}
        {!reduceMotion ? (
          <NotificationCardBorderTrail active={trailActive} rimVariant={rim} />
        ) : null}

        <div
          className={cn(
            "relative z-10 size-full overflow-hidden",
            CARD_INNER_RADIUS_CLASS,
            paddingClass[padding]
          )}
        >
          {translucent ? (
            <div className="pointer-events-none absolute inset-0 -z-10 bg-card/65 backdrop-blur-3xl backdrop-saturate-150" />
          ) : (
            <div className="pointer-events-none absolute inset-0 -z-10 bg-card" />
          )}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/10 to-transparent opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover/halo-card:opacity-100" />
          <div className="pointer-events-none absolute inset-0 -z-10 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]" />
          {children}
        </div>
      </div>
    )
  }
)
HaloCard.displayName = "HaloCard"

/* ─── Notification implementations ─── */

export interface HaloPolishedToastSurfaceProps extends HaloCardProps {
  onDismiss?: () => void
}

/**
 * The inner frosted surface containing the text and dismiss button.
 * Renders raw, without entrance animations. Use {@link HaloPolishedNotification}
 * when rendering in an `<AnimatePresence>`.
 */
export const HaloPolishedToastSurface = forwardRef<
  HTMLDivElement,
  HaloPolishedToastSurfaceProps
>(
  (
    {
      title,
      children,
      onDismiss,
      className,
      rim = "default",
      rimEmphasis = true,
      translucent = true,
      trailActive = true,
      ...props
    },
    ref
  ) => {
    return (
      <HaloCard
        className={cn(
          "pointer-events-auto min-w-[280px] max-w-sm",
          "shadow-[0_4px_24px_rgba(0,0,0,0.08),0_12px_48px_rgba(0,0,0,0.06)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.35),0_16px_64px_rgba(0,0,0,0.25)]",
          className
        )}
        padding="none"
        ref={ref}
        rim={rim}
        rimEmphasis={rimEmphasis}
        trailActive={trailActive}
        translucent={translucent}
        {...props}
      >
        <div className="flex items-start gap-4 p-4 sm:p-5">
          <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
            {title && (
              <h3 className="font-medium text-foreground text-sm tracking-tight">
                {title}
              </h3>
            )}
            {children && (
              <div className="text-muted-foreground text-sm/relaxed">
                {children}
              </div>
            )}
          </div>
          {onDismiss && (
            <ButtonPrimitive
              className={cn(
                "group -mt-1 -mr-2 relative flex shrink-0 cursor-pointer items-center justify-center rounded-full p-2 outline-none transition-colors fine-hover:hover:bg-muted/60",
                "focus-visible:ring-2 focus-visible:ring-ring/40"
              )}
              onClick={onDismiss}
            >
              <XIcon
                aria-hidden
                className="size-4 text-muted-foreground/70 transition-colors group-hover:text-foreground"
              />
              <span className="sr-only">Dismiss</span>
            </ButtonPrimitive>
          )}
        </div>
      </HaloCard>
    )
  }
)
HaloPolishedToastSurface.displayName = "HaloPolishedToastSurface"

export interface HaloPolishedNotificationProps
  extends HaloPolishedToastSurfaceProps {
  /** Unique key for the notification to drive stagger and presence. */
  messageKey: string
  /** Text shown below the title. Passed as children to the surface. */
  description?: ReactNode
  /** Direction the notification slides in from. */
  slideFrom?: "bottom" | "top"
  /**
   * ARIA live region politeness. `assertive` generally causes immediate
   * screen reader interruption. `polite` waits until the reader is idle.
   */
  politeness?: "alert" | "status"
}

/**
 * A self-contained local notification ready to drop inside `<AnimatePresence>`.
 * Handles the slide, scale, fade, and text stagger automatically.
 */
export const HaloPolishedNotification = forwardRef<
  HTMLDivElement,
  HaloPolishedNotificationProps
>(
  (
    {
      messageKey,
      title,
      description,
      onDismiss,
      className,
      slideFrom = "bottom",
      politeness = "status",
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion() ?? false
    const yOffset = slideFrom === "bottom" ? 24 : -24
    const isAlert = politeness === "alert" || props.rim === "destructive"

    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
      setIsMounted(true)
    }, [])

    return (
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-atomic="true"
        aria-live={isAlert ? "assertive" : "polite"}
        className="flex w-full justify-center"
        exit={{
          opacity: 0,
          scale: 0.96,
          y: yOffset * 0.5,
          transition: { duration: 0.2 },
        }}
        initial={{ opacity: 0, y: yOffset, scale: 0.98 }}
        ref={ref}
        role={isAlert ? "alert" : "status"}
        transition={{
          type: "spring",
          bounce: 0,
          duration: 0.45,
        }}
      >
        <HaloPolishedToastSurface
          className={className}
          onDismiss={onDismiss}
          title={
            !reduceMotion && isMounted ? (
              <StaggeredText text={title || ""} />
            ) : (
              title
            )
          }
          {...props}
        >
          {!reduceMotion && isMounted ? (
            <motion.span
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {description}
            </motion.span>
          ) : (
            description
          )}
        </HaloPolishedToastSurface>
      </motion.div>
    )
  }
)
HaloPolishedNotification.displayName = "HaloPolishedNotification"

/* ─── Utils ─── */

function StaggeredText({ text }: { text: ReactNode }) {
  if (typeof text !== "string") return <>{text}</>

  const chars = text.split("")
  return (
    <span className="inline-block">
      {chars.map((char, i) => (
        <motion.span
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="inline-block"
          // biome-ignore lint/suspicious/noArrayIndexKey: Character index is stable for this entrance animation
          key={`${char}-${i}`}
          initial={{ opacity: 0, filter: "blur(4px)", y: 2 }}
          transition={{
            duration: 0.25,
            delay: i * 0.015,
            ease: "easeOut",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  )
}
