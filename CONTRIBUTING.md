# Contributing

## Project structure

```
src/
  mod.ts          — public API, builders, assertSchema, table()
  data-types.ts   — Arrow DataType definitions (intersection-narrowed from flechette)
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

The script parses generic method signatures, accumulates multi-line return
types, and runs `deno fmt` on the output. It warns about new members it doesn't
know how to generify — add rules for them in `scripts/codegen.ts`.

## Type architecture

Everything flows from `DataType + ExtractionOptions`:

```
DataType + Options → Scalar<D, O>              — what column.at(i) returns
                   → ValueArray<D, O, Nullable> — what column.toArray() returns

Column<D, Options, Nullable>  — wraps flechette Column
Table<Fields, Options>        — wraps flechette Table
```

`data-types.ts` uses two strategies: simple types re-export from flechette
directly, parameterized types use intersection narrowing
(`f.IntType & { bitWidth: 32 }`), and container types are interfaces (because
they reference `Field` recursively). All types are phantom — they exist only at
the type level for inference.

## Schema validation

Record form (`q.table({...})`) is partial — only declared columns are validated.
Extra columns in the table are ignored. Tuple form (`q.table([...])`) is strict
— exact column count and order required.

`assertSchema` collects all issues into a `QuiverError` with typed issue objects
carrying `code`, `path`, `expected`, and `received`. `flatten()` returns
`{ formErrors, fieldErrors }` matching zod's shape.

## Type coverage

| Aspect                       | Typed?  | Notes                                                           |
| ---------------------------- | ------- | --------------------------------------------------------------- |
| Scalar value per DataType    | yes     | all 27 Arrow types mapped                                       |
| Options affect scalar type   | yes     | `useBigInt`, `useDate`, `useDecimalInt`, `useMap`               |
| Struct fields                | yes     | `{ [name]: Scalar<childType> }` with option propagation         |
| Union variants               | yes     | union of children's scalar types                                |
| Map key/value types          | yes     | when parameterized; falls back to `unknown` otherwise           |
| List child type              | yes     | typed array for numeric, `Array` otherwise                      |
| Dictionary unwrap            | yes     | resolves to inner value type                                    |
| RunEndEncoded                | yes     | resolves to values child type                                   |
| `toArray()` typed array      | yes     | `TypedArrayFor<D, O>` for non-nullable numerics                 |
| `toArray()` nullable         | partial | `TypedArray \| Array<T \| null>` — depends on runtime nullCount |
| `getChildAt(i)` tuple form   | yes     | exact type per index                                            |
| `getChild(name)`             | yes     | exact type via `Extract`                                        |
| `getChildAt(i)` record form  | unsafe  | index may refer to unvalidated column                           |
| Column generic decomposition | no      | `Column<infer D>` hits TS recursion depth; use `.type` property |
| `useProxy` struct shape      | no      | proxy objects don't support enumeration                         |

## Tests

```sh
deno fmt                # formatting
deno lint               # linting
deno check              # compile-time type assertions
deno test               # runtime behavior + schema validation tests
```
