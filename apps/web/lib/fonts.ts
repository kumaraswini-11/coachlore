import { Geist_Mono, Inter } from "next/font/google"

import { cn } from "@workspace/ui/lib/utils"

// Loaded once and imported where needed (the root layout and global-error),
// as Next.js's "font definitions file" recommends.
export const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// The classes on <html>: both fonts' variables, the sans font as the default,
// and antialiasing. The root layout and global-error both render <html>.
export const rootClassName = cn(
  "antialiased",
  fontMono.variable,
  "font-sans",
  fontSans.variable
)
