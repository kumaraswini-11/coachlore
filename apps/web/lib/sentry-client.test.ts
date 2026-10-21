import { describe, expect, it } from "vitest"

import { isServerError } from "./sentry-client"

describe("isServerError", () => {
  it("is true for an error with a digest (the server reported it)", () => {
    expect(
      isServerError(Object.assign(new Error("hidden"), { digest: "123" }))
    ).toBe(true)
  })

  it("is false for errors from the browser", () => {
    expect(isServerError(new Error("in the browser"))).toBe(false)
    expect(isServerError(Object.assign(new Error("x"), { digest: "" }))).toBe(
      false
    )
    expect(isServerError("a message")).toBe(false)
    expect(isServerError(null)).toBe(false)
    expect(isServerError(undefined)).toBe(false)
    expect(isServerError({ digest: 0 })).toBe(false)
  })

  it("is true for any object with a digest", () => {
    expect(isServerError({ digest: "abc" })).toBe(true)
  })
})
