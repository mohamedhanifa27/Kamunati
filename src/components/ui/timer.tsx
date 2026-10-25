"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

const timerVariants = cva(
  [
    "inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200",
    "",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border-border border shadow-[0_2px_4px_rgba(0,0,0,0.02),_0px_1px_2px_rgba(0,0,0,0.04)] shadow-[inset_0px_-2.10843px_0px_0px_hsl(var(--muted)),_0px_1.20482px_6.3253px_0px_hsl(var(--muted))]",
        outline:
          "border-input bg-background text-foreground border shadow-[0px_1px_0px_0px_hsla(0,_0%,_0%,_0.02)_inset,_0px_0px_0px_1px_hsla(0,_0%,_0%,_0.02)_inset,_0px_0px_0px_1px_rgba(255,_255,_255,_0.25)]",
        ghost: "text-foreground bg-transparent",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 border",
      },
      size: {
        sm: "h-6 gap-1.5 px-2 py-1 text-xs",
        md: "h-7 gap-2 px-2.5 py-1.5 text-sm",
        lg: "h-8 gap-2.5 px-3 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const timerIconVariants = cva("transition-transform duration-[2000ms]", {
  variants: {
    size: {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    },
    loading: {
      true: "animate-spin",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    loading: false,
  },
})

const timerDisplayVariants = cva("font-mono tracking-tight tabular-nums", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export type TimerRootProps = {
  loading?: boolean
} & VariantProps<typeof timerVariants> &
  React.HTMLAttributes<HTMLDivElement>

export type TimerIconProps = {
  icon?: React.ComponentType<{ className?: string }>
} & VariantProps<typeof timerIconVariants> &
  React.HTMLAttributes<HTMLDivElement>

export type TimerDisplayProps = {
  time: string
  label?: string
} & VariantProps<typeof timerDisplayVariants> &
  React.HTMLAttributes<HTMLDivElement>

export type UseTimerOptions = {
  loading?: boolean
  onTick?: (seconds: number, milliseconds: number) => void
  resetOnLoadingChange?: boolean
  format?: "SS.MS" | "MM:SS" | "HH:MM:SS"
}

export type UseTimerReturn = {
  elapsedTime: number
  milliseconds: number
  formattedTime: {
    seconds: string
    milliseconds: string
    display: string
  }
  isRunning: boolean
  reset: () => void
  start: () => void
  stop: () => void
}

export const TimerRoot = React.forwardRef<HTMLDivElement, TimerRootProps>(
  ({ variant, size, loading, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timerVariants({ variant, size }), className)}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimerRoot.displayName = "TimerRoot"

export const TimerIcon = React.forwardRef<HTMLDivElement, TimerIconProps>(
  ({ size, loading, icon: Icon = Clock, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timerIconVariants({ size, loading }), className)}
        {...props}
      >
        <Icon className="h-full w-full" />
      </div>
    )
  }
)
TimerIcon.displayName = "TimerIcon"

export const TimerDisplay = React.forwardRef<HTMLDivElement, TimerDisplayProps>(
  ({ size, time, label, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timerDisplayVariants({ size }), className)}
        aria-label={label || `Timer: ${time}`}
        {...props}
      >
        {time}
      </div>
    )
  }
)
TimerDisplay.displayName = "TimerDisplay"

export type TimerProps = TimerRootProps &
  UseTimerOptions & {
    format?: "SS.MS" | "MM:SS" | "HH:MM:SS"
  } & React.HTMLAttributes<HTMLDivElement>

export const Timer = React.forwardRef<HTMLDivElement, TimerProps>(
  (
    {
      loading = false,
      onTick,
      resetOnLoadingChange = true,
      format = "SS.MS",
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    const { formattedTime } = useTimer({
      loading,
      onTick,
      resetOnLoadingChange,
      format,
    })

    return (
      <TimerRoot
        ref={ref}
        variant={variant}
        size={size}
        loading={loading}
        className={className}
        {...props}
      >
        <TimerIcon size={size} loading={loading} />
        <TimerDisplay size={size} time={formattedTime.display} />
      </TimerRoot>
    )
  }
)
Timer.displayName = "Timer"

export function useTimer({
  loading = false,
  onTick,
  resetOnLoadingChange = true,
  format = "SS.MS",
}: UseTimerOptions = {}): UseTimerReturn {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [milliseconds, setMilliseconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  const reset = useCallback(() => {
    setElapsedTime(0)
    setMilliseconds(0)
    startTimeRef.current = 0
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
    startTimeRef.current = performance.now()
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const updateTimer = () => {
      const now = performance.now()
      const elapsed = now - startTimeRef.current

      const newElapsedTime = Math.floor(elapsed / 1000)
      const newMilliseconds = Math.floor(elapsed % 1000)

      setElapsedTime(newElapsedTime)
      setMilliseconds(newMilliseconds)

      rafRef.current = requestAnimationFrame(updateTimer)
    }

    rafRef.current = requestAnimationFrame(updateTimer)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (loading) {
      if (resetOnLoadingChange) {
        reset()
      }
      start()
    } else {
      stop()
    }
  }, [loading, resetOnLoadingChange, reset, start, stop])

  useEffect(() => {
    if (onTick) {
      onTick(elapsedTime, milliseconds)
    }
  }, [elapsedTime, milliseconds, onTick])

  const formatTime = useCallback(
    (totalSeconds: number, ms: number) => {
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      switch (format) {
        case "HH:MM:SS":
          return {
            seconds: seconds.toString().padStart(2, "0"),
            milliseconds: Math.floor(ms / 10)
              .toString()
              .padStart(2, "0"),
            display: `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          }
        case "MM:SS":
          const totalMinutes = Math.floor(totalSeconds / 60)
          const remainingSeconds = totalSeconds % 60
          return {
            seconds: remainingSeconds.toString().padStart(2, "0"),
            milliseconds: Math.floor(ms / 10)
              .toString()
              .padStart(2, "0"),
            display: `${totalMinutes
              .toString()
              .padStart(2, "0")}:${remainingSeconds
              .toString()
              .padStart(2, "0")}`,
          }
        case "SS.MS":
        default:
          return {
            seconds: totalSeconds.toString().padStart(2, "0"),
            milliseconds: Math.floor(ms / 10)
              .toString()
              .padStart(2, "0"),
            display: `${totalSeconds.toString().padStart(2, "0")}.${Math.floor(
              ms / 10
            )
              .toString()
              .padStart(2, "0")}`,
          }
      }
    },
    [format]
  )

  const formattedTime = formatTime(elapsedTime, milliseconds)

  return {
    elapsedTime,
    milliseconds,
    formattedTime,
    isRunning,
    reset,
    start,
    stop,
  }
}
