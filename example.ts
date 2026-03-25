/**
 * Playground for exploring quiver's type system.
 *
 * Hover over variables in your editor to see inferred types.
 * Run: deno check example.ts
 */

// deno-lint-ignore-file no-unused-vars

import * as q from "./src/mod.ts";

// =============================================================================
// Record form — unordered fields, use getChild("name") for column access
// =============================================================================

const schema = q.table({
  id: q.int32(),
  name: q.utf8().nullable(),
  score: q.float64(),
  created: q.dateDay(),
}, { useDate: true });

type MyTable = q.infer<typeof schema>;
declare const table: MyTable;

// Row type: { id: number; name: string | null; score: number; created: Date }
const row = table.at(0);
const rows = table.toArray();
const cols = table.toColumns();

// getChild by name — exact type per column
const idCol = table.getChild("id"); // Column<IntType<32, true>, ..., false>
const nameCol = table.getChild("name"); // Column<Utf8Type, ..., true>

// select preserves types
const sub = table.select(["id", "created"]);
const subRow = sub.at(0); // { id: number; created: Date }

// =============================================================================
// Tuple form — ordered fields, getChildAt knows exact types
// =============================================================================

const ordered = q.table([
  ["id", q.int32()],
  ["name", q.utf8().nullable()],
  ["score", q.float64()],
], { useDate: true });

type OrderedTable = q.infer<typeof ordered>;
declare const ot: OrderedTable;

const orow = ot.at(0); // { id: number; name: string | null; score: number }
const col0 = ot.getChildAt(0); // Column<IntType<32, true>, ..., false>
const col1 = ot.getChildAt(1); // Column<Utf8Type, ..., true>
const col2 = ot.getChildAt(2); // Column<FloatType<2>, ..., false>

// =============================================================================
// Options change the JS types
// =============================================================================

const bigintSchema = q.table({
  x: q.int64(),
  y: q.int32(),
}, { useBigInt: true });

type BigIntTable = q.infer<typeof bigintSchema>;
declare const bt: BigIntTable;
const brow = bt.at(0); // { x: bigint; y: number }

// =============================================================================
// Broad types — accept any variant of a type family
// =============================================================================

const flexSchema = q.table({
  num: q.int(), // any int (int8, int16, int32, int64, unsigned)
  text: q.string(), // any string (utf8, largeUtf8, utf8View)
  day: q.date(), // any date (dateDay, dateMillisecond)
  n: q.float(), // any float (float16, float32, float64)
});

type FlexTable = q.infer<typeof flexSchema>;
declare const ft: FlexTable;
const frow = ft.at(0); // { num: number; text: string; day: number; n: number }

// =============================================================================
// of() — accept any of these specific types
// =============================================================================

const unionSchema = q.table({
  value: q.either([q.int32(), q.float64()]),
  label: q.utf8().nullable(),
});

type UnionTable = q.infer<typeof unionSchema>;
declare const ut: UnionTable;
const urow = ut.at(0); // { value: number; label: string | null }

// =============================================================================
// Nested types
// =============================================================================

const nestedSchema = q.table({
  tags: q.list(q.utf8()),
  meta: q.struct({ key: q.utf8(), count: q.int32() }),
  category: q.dictionary(q.utf8()),
});
