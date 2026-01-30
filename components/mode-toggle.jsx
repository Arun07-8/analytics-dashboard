"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="
        relative h-9 w-[72px] rounded-full
        border border-border
        bg-background
        shadow-sm
        transition-all duration-300
        hover:shadow-md
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
        focus-visible:ring-offset-2
        focus-visible:ring-offset-background
        mb-1
      "
    >
      {/* Track depth */}
      <div className="absolute inset-0 rounded-full bg-muted/40" />

      {/* Sliding knob */}
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 30,
        }}
        animate={{
          x: isDark ? 36 : 4,
        }}
        className="
          absolute top-1
          h-7 w-7
          rounded-full
          bg-foreground
          shadow-lg
          flex items-center justify-center
        "
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.25 }}
            >
              <Moon className="h-3.5 w-3.5 text-background" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
              transition={{ duration: 0.25 }}
            >
              <Sun className="h-3.5 w-3.5 text-background" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background icons */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
        <Sun className="h-4 w-4 text-foreground/70" />
        <Moon className="h-4 w-4 text-foreground/70" />
      </div>
    </button>
  )
}
