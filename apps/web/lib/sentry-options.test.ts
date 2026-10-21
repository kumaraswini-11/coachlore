import * as Sentry from "@sentry/nextjs"
import { afterAll, describe, expect, it } from "vitest"

import {
  realValue,
  sentryOptions,
  stripPersonalData,
  stripSpan,
} from "./sentry-options"

const DSN = "https://abc123@o1.ingest.sentry.io/1"

describe("realValue", () => {
  it("treats empty and placeholder values as unset", () => {
    expect(realValue(undefined)).toBeUndefined()
    expect(realValue("")).toBeUndefined()
    expect(realValue("   ")).toBeUndefined()
    expect(realValue("<your-sentry-dsn>")).toBeUndefined()
  })

  it("keeps a real value", () => {
    expect(realValue(` ${DSN} `)).toBe(DSN)
  })
})

describe("sentryOptions", () => {
  it("sends nothing without a real DSN", () => {
    for (const value of [undefined, "", "<your-sentry-dsn>"]) {
      const options = sentryOptions(
        { NEXT_PUBLIC_SENTRY_DSN: value },
        "browser"
      )
      expect(options.dsn).toBeUndefined()
      expect(options.enabled).toBe(false)
    }
  })

  it("is enabled with a real DSN", () => {
    const options = sentryOptions({ NEXT_PUBLIC_SENTRY_DSN: DSN }, "server")
    expect(options.dsn).toBe(DSN)
    expect(options.enabled).toBe(true)
  })

  it("names the environment and samples traces by it", () => {
    const at = (env: Record<string, string>) => sentryOptions(env, "server")
    expect(at({ VERCEL_ENV: "production" })).toMatchObject({
      environment: "production",
      tracesSampleRate: 0.1,
    })
    expect(at({ NEXT_PUBLIC_VERCEL_ENV: "preview" })).toMatchObject({
      environment: "preview",
      tracesSampleRate: 1,
    })
    expect(at({})).toMatchObject({
      environment: "development",
      tracesSampleRate: 0,
    })
  })

  it("traces nothing in the browser", () => {
    expect(
      sentryOptions({ VERCEL_ENV: "production" }, "browser")
    ).not.toHaveProperty("tracesSampleRate")
  })

  it("strips personal attributes from performance spans", () => {
    const span = stripSpan({
      attributes: {
        "user.id": "42",
        "client.address": "203.0.113.7",
        "http.request.header.cookie": "session=abc",
        "url.query": "secret=1",
        "host.name": "a-machine",
        "http.route": "/dex",
        "server.address": "coachlore.vercel.app",
      },
    })
    expect(span.attributes).toEqual({
      "http.route": "/dex",
      "server.address": "coachlore.vercel.app",
    })
  })

  it("keeps a page's address without its query string or fragment", () => {
    const event = stripPersonalData({
      type: undefined,
      request: { url: "https://coachlore.vercel.app/dex/garchomp?e=a@b.c#x" },
    })
    expect(event.request?.url).toBe("https://coachlore.vercel.app/dex/garchomp")
  })

  it("collects no personal data", () => {
    expect(sentryOptions({}, "browser").dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    })
  })
})

describe("an outgoing error report", () => {
  afterAll(async () => {
    await Sentry.close()
  })

  it("carries no IP address, user, cookies, headers or variables", async () => {
    const sent: string[] = []
    Sentry.init({
      ...sentryOptions({ NEXT_PUBLIC_SENTRY_DSN: DSN }, "server"),
      // A fake transport: keeps what would have been sent.
      transport: () => ({
        send: async (envelope: unknown) => {
          sent.push(JSON.stringify(envelope))
          return {}
        },
        flush: async () => true,
      }),
    })

    Sentry.withScope((scope) => {
      scope.setUser({ id: "42", ip_address: "203.0.113.7" })
      scope.setSDKProcessingMetadata({
        normalizedRequest: {
          url: "https://coachlore.vercel.app/dex?secret=1",
          method: "GET",
          headers: {
            cookie: "session=abc",
            "x-forwarded-for": "203.0.113.7",
          },
          cookies: { session: "abc" },
          data: '{"password":"hunter2"}',
          query_string: "secret=1",
        },
      })
      scope.addBreadcrumb({
        category: "navigation",
        data: { to: "/dex?email=someone@example.com" },
      })
      const local = "a local value"
      Sentry.captureException(new Error(`check ${local.length}`))
    })
    await Sentry.flush(2000)

    // Each frame carries a few lines of the source code around it (this test's
    // own source, which contains the sample values); check the rest of the
    // report, and that no frame carries variables.
    const frames: Array<Record<string, unknown>> = []
    const report = sent
      .join("\n")
      .replace(
        /"stacktrace":\{"frames":(\[.*?\])\}(?=,"mechanism")/,
        (_, list) => {
          frames.push(...(JSON.parse(list) as Array<Record<string, unknown>>))
          return '"stacktrace":{}'
        }
      )
    expect(frames.length).toBeGreaterThan(0)
    expect(frames.some((frame) => "vars" in frame)).toBe(false)
    expect(report).toContain("check 13")
    expect(report).not.toContain("server_name")
    expect(report).not.toContain("breadcrumbs")
    for (const forbidden of [
      "203.0.113.7",
      "ip_address",
      "session=abc",
      "hunter2",
      "x-forwarded-for",
      "secret=1",
      "a local value",
      "someone@example.com",
      '"user"',
    ]) {
      expect(report).not.toContain(forbidden)
    }
  })
})
