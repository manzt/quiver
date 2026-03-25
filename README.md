<h1>
<p align="center">
  🏹 quiver
</h1>
<p align="center">
  a (type-safe) place for your arrows
</p>
</p>

**quiver** lets you define [Apache Arrow](https://arrow.apache.org) table
schemas in TypeScript, validate Arrow IPC data against them at parse time, and
get back fully typed tables. Think [zod](https://zod.dev) or
[valibot](https://valibot.dev), but for Arrow.

Built on [`@uwdata/flechette`](https://github.com/uwdata/flechette).

```
npx jsr add @manzt/quiver
```

```ts
import * as q from "@manzt/quiver";

let schema = q.table({
	id: q.int32(),
	name: q.utf8().nullable(),
	score: q.float64(),
}, { useDate: true });

let table = schema.parseIPC(bytes); // throws if schema doesn't match
table.at(0).name; // string | null
table.at(0).score; // number
```

## usage

Use `q.infer` to extract the table type from a schema and pass it around your
code. Types flow through every operation — `getChild`, `select`, `toArray`,
iteration. Change `useBigInt` or `useDate` and the types update.

```ts
let schema = q.table({
	id: q.int32(),
	name: q.utf8().nullable(),
	score: q.float64(),
	created: q.dateDay(),
}, { useDate: true });

type MyTable = q.infer<typeof schema>;

function processTable(table: MyTable) {
	for (let row of table) {
		row.id; // number
		row.name; // string | null
		row.created; // Date (because useDate: true)
	}
}

let response = await fetch("https://example.com/data.arrow");
let bytes = new Uint8Array(await response.arrayBuffer());

processTable(schema.parseIPC(bytes));
```

## recipes

```ts
// Specific types
q.table({ id: q.int32(), lat: q.float64() });

// Flexible — accept any variant
q.table({ num: q.int(), text: q.string(), day: q.date() });

// Accept alternatives
q.table({ value: q.of([q.int32(), q.float64()]) });

// Ordered columns (tuple form) — getChildAt knows exact types
q.table([["id", q.int32()], ["name", q.utf8()]]);

// Nested
q.table({
	tags: q.list(q.utf8()),
	meta: q.struct({ key: q.utf8(), count: q.int32() }),
	category: q.dictionary(q.utf8()),
});
```

## how it works

Flechette parses Arrow IPC into JavaScript values, but the mapping from Arrow
types to JS types depends on the data type, the extraction options, and whether
nulls are present. Quiver captures all of this statically. See
[flechette's type mapping table](https://idl.uw.edu/flechette/api/data-types)
for the full Arrow → JS correspondence.

Builders return phantom schema entries — no runtime data, just match criteria
and a type-level generic. `parseIPC` calls flechette's `tableFromIPC`, validates
the Arrow schema against your declared types, and returns the flechette table
with quiver's generics overlaid.

Quiver tracks two type mappings from `DataType + ExtractionOptions`:

- `Scalar` — what `column.at(i)` returns (`number`, `bigint`, `Date`,
  `Int32Array` for list elements, `{ field: type }` for structs, etc.)
- `ValueArray` — what `column.toArray()` returns. Non-nullable numeric columns
  get zero-copy typed arrays (`Int32Array`, `Float64Array`). Nullable numeric
  columns can be either typed arrays or `Array<number | null>` depending on
  whether nulls are present in the data. Non-numeric columns always return
  `Array`.

Options propagate through nested types — a struct containing an `int64` field
with `{ useBigInt: true }` correctly resolves to `{ x: bigint }`.

## versioning

Tracks flechette — quiver `2.3.x` targets flechette `2.3.x`.
