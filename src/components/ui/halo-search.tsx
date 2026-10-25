// [RECTIFICATION:REMOVE_TEXT_LIVE_GRADIENT_AND_ADD_SEARCH_BAR_GLOW]
"use client"

import React, { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface HaloSearchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  gradientVariant?: "violet" | "default"
}

export function HaloSearch({
  className,
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  gradientVariant = "violet",
  ...props
}: HaloSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value?.toString() || "")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value)
      onChange?.(e.target.value)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    setLocalValue("")
    onChange?.("")
    inputRef.current?.focus()
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSearch?.(localValue)
      } else if (e.key === "Escape") {
        inputRef.current?.blur()
      }
    },
    [localValue, onSearch]
  )

  const liveGradientClass = gradientVariant === "violet" 
    ? "halo-violet-live" 
    : "halo-indigo-live"

  return (
    <div
      className={cn(
        "relative group flex w-full max-w-md items-center rounded-full transition-all duration-300",
        className
      )}
    >
      {/* [RECTIFICATION:REMOVE_TEXT_LIVE_GRADIENT_AND_ADD_SEARCH_BAR_GLOW] */}
      {/* Subtle outline live gradient edge */}
      <div 
        className={cn(
          "absolute -inset-[1px] rounded-full pointer-events-none transition-opacity duration-300",
          liveGradientClass,
          isFocused ? "opacity-95" : "opacity-40 group-hover:opacity-70"
        )}
      />

      {/* [RECTIFICATION:REMOVE_TEXT_LIVE_GRADIENT_AND_ADD_SEARCH_BAR_GLOW] */}
      {/* Subtle live gradient glow around the search bar edge */}
      <div 
        className={cn(
          "absolute -inset-[3px] rounded-full -z-10 blur-md pointer-events-none transition-all duration-300",
          liveGradientClass,
          isFocused ? "opacity-75 blur-lg" : "opacity-25 group-hover:opacity-45"
        )}
      />

      {/* Inner search bar container */}
      <div 
        className={cn(
          "relative z-10 flex w-full items-center rounded-full bg-[#0d0d12]/90 backdrop-blur-xl border border-white/10",
          "transition-colors duration-200",
          isFocused ? "border-white/25 shadow-lg bg-[#0d0d12]/95" : "hover:border-white/15"
        )}
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground transition-colors group-hover:text-foreground">
          <Search size={18} />
        </div>
        
        <input
          ref={inputRef}
          className={cn(
            "w-full h-11 bg-transparent pl-11 pr-11 text-sm text-foreground",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-0 rounded-full"
          )}
          value={value !== undefined ? value : localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          {...props}
        />

        <AnimatePresence>
          {(value !== undefined ? value : localValue) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
