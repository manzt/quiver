<h1>
<p align="center">
  quiver
</h1>
<p align="center">
  a (type-safe) place for your arrows
</p>
</p>

**quiver** lets you define [Apache Arrow](https://arrow.apache.org) table
schemas in TypeScript, validate Arrow IPC data against them at parse time, and
get back fully typed tables. Think [zod](https://zod.dev) for Arrow.

```
npx jsr add @manzt/quiver
```

Quiver has two entry points, one for each major Arrow JS implementation:

| Entry point                  | Backing library                                            | `table()` returns     |
| ---------------------------- | ---------------------------------------------------------- | --------------------- |
| `@manzt/quiver/flechette`    | [`@uwdata/flechette`](https://github.com/uwdata/flechette) | `{ parseIPC }`        |
| `@manzt/quiver/apache-arrow` | [`apache-arrow`](https://github.com/apache/arrow-js)       | `{ parse, parseIPC }` |

Both share the same type builders (`q.int32()`, `q.utf8()`, etc.). The
difference is `table()` itself: flechette's accepts extraction options as a
second argument and only exposes `parseIPC`, while apache-arrow's has no options
and exposes both `parse` and `parseIPC`.

## flechette

Flechette's type mapping depends on extraction options (`useBigInt`, `useDate`,
etc.) that are baked in at parse time. Because of this, the flechette entry
point only exposes `parseIPC` — options and validation happen together:

```ts
import * as q from "@manzt/quiver/flechette";

let schema = q.table({
  name: q.utf8().nullable(),
  score: q.float64(),
  created: q.dateDay(),
}, { useDate: true });

let table = schema.parseIPC(bytes);
table.at(0).name; // string | null
table.at(0).score; // number
table.at(0).created; // Date (because useDate: true)
```

Change `useDate` to `false` and the type of `created` becomes `number`. Types
flow through `getChild`, `toArray`, iteration — everything stays in sync.

## apache-arrow

Apache Arrow JS has no extraction options — scalar types are fixed by the
`DataType` alone. So the entry point exposes both `parse` (validate an existing
table) and `parseIPC` (deserialize + validate):

```ts
import { tableFromIPC } from "apache-arrow";
import * as q from "@manzt/quiver/apache-arrow";

let schema = q.table({ name: q.utf8(), age: q.int32() });

// validate an already-parsed table
let typed = schema.parse(tableFromIPC(buffer));

// or deserialize + validate in one step
let table = schema.parseIPC(buffer);
```

## builders

Both entry points share the same type builders. Choose the level of strictness
that matches your trust in the producer:

```ts
// JS-level — "I care about the JS type I get back"
q.like("number")   q.like("string")   q.like("bytes")
q.like("bigint")   q.like("boolean")  q.like("date")

// Arrow-level — "I care about the Arrow type family"
q.int()     q.float()    q.string()
q.date()    q.time()

// Arrow-specific — "I care about the exact wire type"
q.int32()   q.float64()  q.utf8()
q.dateDay() q.timeSecond()  // ...
```

These compose with the rest of the API:

```ts
// Accept alternatives
q.table({ value: q.oneOf([q.int32(), q.float64()]) });

// Ordered columns (tuple form, flechette only)
q.table([["id", q.int32()], ["name", q.utf8()]]);

// Nested types
q.table({
  tags: q.list(q.utf8()),
  meta: q.struct({ key: q.utf8(), count: q.int32() }),
  category: q.dictionary(q.utf8()),
});
```

## `q.infer`

Use `q.infer` to extract the table type from a schema:

```ts
let schema = q.table({ id: q.int32(), name: q.utf8() });
type MyTable = q.infer<typeof schema>;

function processTable(table: MyTable) {
  for (let row of table) {
    row.id; // number
    row.name; // string
  }
}
```

## what gets narrowed

Stricter builders give tighter types for both scalar access and array access:

```ts
let loose = q.table({ value: q.like("number") });
let table = loose.parseIPC(bytes);
let col = table.getChild("value");

col.at(0); // number
col.toArray(); // Int8Array | Int16Array | ... | Float64Array

let strict = q.table({ value: q.float64() });
let table = strict.parseIPC(bytes);
let col = table.getChild("value");

col.at(0); // number
col.toArray(); // Float64Array
```

## how it works

Builders return phantom schema entries — no runtime data, just match criteria
and a type-level generic. At parse time, the Arrow schema is validated against
your declared types, and the table is returned with narrowed generics overlaid.

Both libraries return a generic `Table`, but the generics differ. Quiver narrows
each column down to two things:

- `Scalar` — what `column.at(i)` returns (`number`, `bigint`, `Date`,
  `Int32Array` for list elements, `{ field: type }` for structs, etc.)
- `ValueArray` — what `column.toArray()` returns (zero-copy typed arrays like
  `Float64Array` for non-nullable numerics, `Array<T | null>` otherwise)

For **flechette**, both are computed from `DataType + ExtractionOptions`. A
`dateDay` column returns `number` by default but `Date` with
`{ useDate: true }`. Options propagate through nested types: a struct with an
`int64` field and `{ useBigInt: true }` resolves to `{ x: bigint }`. See
[flechette's type mapping table](https://idl.uw.edu/flechette/api/data-types)
for the full correspondence.

For **apache-arrow**, the table generic is parameterized by `arrow.DataType`
alone — there are no extraction options. Quiver maps its builders to the
corresponding type (e.g., `q.int32()` becomes `arrow.Int32`) and narrows the
table directly.

Both entry points share a backend-agnostic assertion module. The challenge is
that `apache-arrow` uses negative `typeId` values for concrete subtypes
(`Int32 = -4`, `Float64 = -12`) while `flechette` and the IPC spec use
family-level values (`Int = 2`, `Float = 3`). A normalization layer bridges this
so the shared validation logic works unchanged.

## versioning

Tracks flechette — quiver `2.3.x` targets flechette `2.3.x`.
