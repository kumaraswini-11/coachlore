/**
 * No interface text written into a component's accessible names: a screen
 * reader would read it in English on every page (WCAG 3.1.2). Names come
 * from the app's messages, passed in as props (AGENTS.md, "Interface"). An
 * empty value passes: `alt=""` is how a decorative image is marked.
 * Shared by `./next-js` and `./react-internal`.
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const interfaceTextRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "JSXAttribute[name.name=/^(aria-label|aria-description|aria-roledescription|aria-valuetext|aria-placeholder|alt|title|placeholder|label)$/] > Literal[value=/\\S/]",
      message:
        "Write accessible names from the messages, passed in as props, not as text in the component.",
    },
  ],
}
