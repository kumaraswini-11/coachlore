import * as Sentry from "@sentry/nextjs"

import { sentryOptions } from "@/lib/sentry-options"

// Error reporting on the server (Node.js runtime), loaded by instrumentation.ts.
Sentry.init(sentryOptions(process.env, "server"))
