import * as Sentry from "@sentry/nextjs"

import { sentryOptions } from "@/lib/sentry-options"

// Error reporting in the edge runtime, loaded by instrumentation.ts.
Sentry.init(sentryOptions(process.env, "server"))
