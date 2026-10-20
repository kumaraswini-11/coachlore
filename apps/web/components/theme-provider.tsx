"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import { ThemeHotkey } from "@/components/theme-hotkey"

// The theme's settings live here, once, for both places that render the
// provider: the root layout and global-error.tsx.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
