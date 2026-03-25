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

Builders return phantom schema entries — no runtime data, just match criteria
and a type-level generic. `parseIPC` calls flechette's `tableFromIPC`, validates
the Arrow schema against your declared types, and returns the flechette table
with quiver's generics overlaid.

Types map every `DataType + ExtractionOptions` to the JS type flechette actually
returns: `number`, `bigint`, `Date`, `Int32Array`, `{ field:
type }` for
structs, etc. Options propagate through nested types.

## versioning

Tracks flechette — quiver `2.3.x` targets flechette `2.3.x`.
