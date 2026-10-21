import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"

// Spec 000, criterion 4: throws on purpose, so a preview proves that errors
// reach Sentry with their stack trace and digest, and without personal data.
// Production has no such page.
export const metadata: Metadata = {
  title: "Error check",
  description: "Throws an error on purpose, to check error reporting.",
  robots: { index: false },
}

export default function ErrorCheckPage() {
  // Decided at build time: production builds this page as a 404.
  if (process.env.VERCEL_ENV === "production") {
    notFound()
  }

  return (
    <Suspense fallback={null}>
      <Throw />
    </Suspense>
  )
}

async function Throw(): Promise<never> {
  // Waits for a real request, so the error isn't thrown during the build.
  await connection()
  throw new Error("Error check: thrown on purpose to test error reporting")
}
