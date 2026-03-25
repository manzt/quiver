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
  snap.ts         — type snapshot checker (//^? queries via TS language service)
__tests__/
  snap.test.ts               — literate type + runtime snapshot tests (vitest + //^?)
  types.test-d.ts            — compile-time Scalar/ValueArray/Table type assertions
  schema.test.ts             — runtime builder + schema validation tests (Deno.test)
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
deno fmt --check         # formatting
deno lint                # linting
deno check               # compile-time type assertions
deno task test           # everything: deno test + vitest + type snapshots
deno task test:update    # update all snapshots (vitest + type)
```

`deno task test` runs three things in sequence:

1. `deno test` — schema validation, builders, flechette behavior (Deno.test)
2. `vitest run` — runtime inline snapshots in `snap.test.ts`
3. `scripts/snap.ts` — type snapshots (`//^?` queries) in `snap.test.ts`

The snapshot file (`snap.test.ts`) is a literate test that checks both the
inferred TypeScript type and the runtime value for every builder × option
combination. Two kinds of snapshots live side by side:

```ts
const col = t.getChild("a");
//    ^? q.Column<IntType<32, true>, {}, false>   ← type (scripts/snap.ts)
const val = col.at(0);
//    ^? number                                    ← type (scripts/snap.ts)
test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));  ← runtime (vitest)
```
