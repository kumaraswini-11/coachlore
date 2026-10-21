// Node's types for this test alone: the package itself is DOM- and Node-free.
/// <reference types="node" />
import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

// The core preset keeps frameworks, interface and storage code out of a
// core package, and file reads in `src/files.ts` (spec 002, criterion 7).
const eslint = new ESLint({ cwd: import.meta.dirname + "/.." })

async function problems(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath })
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === "no-restricted-imports")
    .map((message) => message.message)
}

describe("the core preset", () => {
  it.each([
    'import React from "react"',
    'import { notFound } from "next/navigation"',
    'import { Button } from "@workspace/ui/components/shadcn-ui/button"',
    'import { drizzle } from "drizzle-orm"',
  ])("rejects %s", async (code) => {
    expect(await problems(`${code}\n`, "src/index.ts")).toHaveLength(1)
  })

  it("keeps file reads in src/files.ts", async () => {
    const code = 'import { readFileSync } from "node:fs"\n'
    expect(await problems(code, "src/index.ts")).toHaveLength(1)
    expect(await problems(code, "src/files.ts")).toHaveLength(0)
  })
})
