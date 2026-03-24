# Contributing

## Project structure

```
src/
  mod.ts          — public API, re-exports, table() builder
  data-types.ts   — Arrow DataType interfaces (generic versions of flechette's)
  jsvalue.ts      — Scalar<D, O>, ValueArray<D, O, N>, TypedArrayFor<D, O>
  table.gen.ts    — codegen'd Table<Fields, Opts> and Column<D, Opts, Nullable>
scripts/
  codegen.ts      — reads flechette .d.ts, generates table.gen.ts
__tests__/
  jsvalue.test-d.ts          — compile-time Scalar/ValueArray type assertions
  flechette-behavior.test.ts — runtime tests verifying flechette's actual output
```

## Versioning

Quiver versions track flechette — quiver `2.3.x` targets flechette `2.3.x`.

## Codegen

`src/table.gen.ts` is generated from flechette's `Table` and `Column` `.d.ts`
files. After upgrading flechette, regenerate and check for warnings:

```sh
deno run -A scripts/codegen.ts
```

The script warns about new members it doesn't know how to generify. Add rules
for them in `scripts/codegen.ts` and fix any `// TODO:` comments in the output.

## Type architecture

Everything flows from `DataType + ExtractionOptions`:

```
DataType + Options → Scalar<D, O>              — what column.at(i) returns
                   → ValueArray<D, O, Nullable> — what column.toArray() returns

Column<D, Options, Nullable>  — wraps flechette Column
Table<Fields, Options>        — wraps flechette Table
```

## Tests

```sh
deno fmt --check        # formatting
deno check              # compile-time type assertions
deno test               # runtime flechette behavior tests
```
