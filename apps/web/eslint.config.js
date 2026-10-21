import { defineConfig } from "eslint/config"

import { nextJsConfig } from "@workspace/eslint-config/next-js"

const eslintConfig = defineConfig([
  ...nextJsConfig,
  {
    // Where the Next.js app is, whatever directory ESLint runs from.
    settings: { next: { rootDir: import.meta.dirname } },
  },
  {
    // No interface text in components: every string comes from the messages
    // (spec 001, criterion 11). Attribute strings such as `className` are
    // allowed; so are punctuation and symbols that aren't words.
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: true,
          ignoreProps: true,
          allowedStrings: ["·", "–", "—", "×", "/", ":", "(", ")", "%", "#"],
        },
      ],
    },
  },
])

export default eslintConfig
