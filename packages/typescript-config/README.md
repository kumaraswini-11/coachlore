# @workspace/typescript-config

Draftboard's shared TypeScript settings: one base and two presets that every
app and package extends, so compiler options are set in one place.

## Why a separate package

It owns compiler options and nothing else: plain JSON, no code, no framework.
A change to how the repository type-checks is one edit here.

## Use

Add it, with TypeScript from the workspace catalog, to the package's
`devDependencies`:

```json
"devDependencies": {
  "@workspace/typescript-config": "workspace:*",
  "typescript": "catalog:"
}
```

Then extend a preset in the package's `tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/nextjs.json"
}
```

## Files

| File                 | Extends     | For             | Extended by                         |
| -------------------- | ----------- | --------------- | ----------------------------------- |
| `base.json`          | (nothing)   | every package   | `nextjs.json`, `react-library.json` |
| `nextjs.json`        | `base.json` | Next.js apps    | `apps/web`                          |
| `react-library.json` | `base.json` | React libraries | `packages/ui`                       |

There's no root `tsconfig.json`: each package has its own, as Turborepo's
[TypeScript guide](https://turborepo.dev/docs/guides/tools/typescript)
advises, so a change at the root doesn't invalidate every package's cache.
Packages import each other by package name, through each package's `exports`,
never through `compilerOptions.paths`: the same guide warns that such paths
"can cause failed compilation when using Just-in-Time Packages".

TypeScript is 6.0, the newest line that
[typescript-eslint](https://typescript-eslint.io/users/dependency-versions/)
supports. TypeScript 7 has no stable JavaScript API yet; see
[ADR 0002](../../docs/adr/0002-toolchain-baseline.md).

## Why these settings

JSON can't hold comments that explain, so the reasons live here. Each option
links to the [TSConfig reference](https://www.typescriptlang.org/tsconfig/).

`base.json`:

- [`strict`](https://www.typescriptlang.org/tsconfig/#strict): every strict
  type check on.
- [`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess):
  reading an array or record by index gives `T | undefined`, so a missing entry
  (a Pokémon not in a map, say) has to be handled.
- [`isolatedModules`](https://www.typescriptlang.org/tsconfig/#isolatedModules):
  every file can be compiled on its own, as bundlers compile them; code that
  needs the whole program's types to compile is flagged.
- [`module`](https://www.typescriptlang.org/tsconfig/#module) and
  [`moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)
  `NodeNext`: imports resolve as Node.js resolves them, honouring each
  package's `exports`, which is how the internal packages expose their
  subpaths.
- [`moduleDetection`](https://www.typescriptlang.org/tsconfig/#moduleDetection)
  `force`: every file is a module, so top-level names never leak between files.
- [`target`](https://www.typescriptlang.org/tsconfig/#target) `ES2022`, with
  [`lib`](https://www.typescriptlang.org/tsconfig/#lib) `es2022`, `DOM` and
  `DOM.Iterable`: modern syntax is kept as written, and browser types are
  available.
- [`skipLibCheck`](https://www.typescriptlang.org/tsconfig/#skipLibCheck):
  declaration files in `node_modules` aren't re-checked; faster, and free of
  third-party type errors.
- [`esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop)
  and [`resolveJsonModule`](https://www.typescriptlang.org/tsconfig/#resolveJsonModule):
  CommonJS packages can be default-imported, and JSON files imported.
- [`declaration`](https://www.typescriptlang.org/tsconfig/#declaration) and
  [`declarationMap`](https://www.typescriptlang.org/tsconfig/#declarationMap):
  type declarations, with maps back to the source, for a package compiled with
  `tsc`. No package is compiled today (every one is type-checked with
  `--noEmit`), so these only take effect if one becomes compiled.

`nextjs.json`:

- `module` `ESNext` and `moduleResolution` `Bundler`: Next.js's bundler, not
  Node.js, resolves the app's imports, so TypeScript follows the bundler's
  rules.
- [`jsx`](https://www.typescriptlang.org/tsconfig/#jsx) `preserve` and
  [`noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit): TypeScript only
  checks; Next.js compiles the JSX and the output.
- [`allowJs`](https://www.typescriptlang.org/tsconfig/#allowJs): JavaScript
  files, such as config files, are part of the program.
- The `next` plugin: Next.js's checks in the editor.

`react-library.json`:

- `jsx` `react-jsx`: the automatic JSX runtime, so components need no
  `import React`.

## Status

Internal and private (`"private": true`): never published. Nothing to build.
