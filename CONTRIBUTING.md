# Contributing

## Project structure

```
src/
  mod.ts          — public API, builders, assertSchema, table()
  data-types.ts   — Arrow DataType interfaces (generic versions of flechette's)
  types.ts        — Scalar<D, O>, ValueArray<D, O, N>, TypedArrayFor<D, O>
  table.gen.ts    — codegen'd Table<Fields, Opts> and Column<D, Opts, Nullable>
scripts/
  codegen.ts      — reads flechette .d.ts, generates table.gen.ts
__tests__/
  types.test-d.ts            — compile-time Scalar/ValueArray/Table type assertions
  schema.test.ts             — runtime builder + schema validation tests
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

## Type coverage

What quiver can statically type from a declared schema, and where the
limits are.

| Aspect | Typed? | Notes |
|--------|--------|-------|
| Scalar value per DataType | yes | `Scalar<D, O>` — all 27 Arrow types mapped |
| Options affect scalar type | yes | `useBigInt`, `useDate`, `useDecimalInt`, `useMap` |
| Struct fields | yes | `{ [name]: Scalar<childType> }` with option propagation |
| Union variants | yes | union of children's scalar types |
| Map key/value types | yes | when parameterized; falls back to `unknown` otherwise |
| List child type | yes | `Int32Array` for numeric, `Array<T>` for others |
| Dictionary unwrap | yes | resolves to inner value type |
| RunEndEncoded | yes | resolves to values child type |
| `toArray()` typed array | yes | `TypedArrayFor<D, O>` for non-nullable numerics |
| `toArray()` nullable | partial | `TypedArray \| Array<T \| null>` — can't know at compile time whether nulls are present |
| `getChildAt(i)` record form | partial | returns union of all column types (order unknown) |
| `getChildAt(i)` tuple form | yes | exact type per index |
| `getChild(name)` | yes | exact type via `Extract` |
| Column generic decomposition | no | `Column<infer D>` hits TS recursion depth; use `.type` property instead |
| `useProxy` struct shape | no | proxy objects don't support enumeration; type says `{ ... }` but `Object.keys()` returns `[]` |

## Tests

```sh
deno fmt --check        # formatting
deno check              # compile-time type assertions
deno test               # runtime flechette behavior tests
```
