/**
 * Snapshot tests for the apache-arrow entry point's type system.
 *
 * Each test creates a table, parses it through quiver, and checks the
 * inferred TypeScript type via tintype's `expectType`.
 *
 * Unlike the flechette entry point, apache-arrow has NO extraction options:
 *   - Int64 always returns bigint (no useBigInt toggle)
 *   - Dates/timestamps always return number (no useDate toggle)
 *   - Maps always return MapRow (no useMap toggle)
 *
 * To update snapshots:  deno task test:update
 * To verify:            deno task test
 */

import { expect, test } from "vitest";
import { expectType } from "tintype";
import * as NodeFs from "node:fs";
import * as NodePath from "node:path";

import * as f from "@uwdata/flechette";
import * as arrow from "apache-arrow";
import * as q from "../apache-arrow/mod.ts";

/** Build IPC via flechette, parse with apache-arrow. */
function makeTable(
  data: [string, unknown[]][],
  types: Record<string, f.DataType>,
): arrow.Table {
  const table = f.tableFromArrays(data, { types });
  const ipc = f.tableToIPC(table, { format: "stream" });
  if (!ipc) throw new Error("tableToIPC returned null");
  return arrow.tableFromIPC(ipc);
}

// =============================================================================
// Integers — signed
// =============================================================================

test("int8", () => {
  const t = q.table({ a: q.int8() }).parse(
    makeTable([["a", [1]]], { a: f.int8() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Int8; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Int8>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int8Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Int8Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("int16", () => {
  const t = q.table({ a: q.int16() }).parse(
    makeTable([["a", [1]]], { a: f.int16() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Int16; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Int16>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int16Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Int16Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("int32", () => {
  const t = q.table({ a: q.int32() }).parse(
    makeTable([["a", [1]]], { a: f.int32() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Int32; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Int32>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Int32Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("int64", () => {
  const t = q.table({ a: q.int64() }).parse(
    makeTable([["a", [1n]]], { a: f.int64() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Int64; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Int64>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(BigInt64Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`bigint | null`);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Integers — unsigned
// =============================================================================

test("uint8", () => {
  const t = q.table({ a: q.uint8() }).parse(
    makeTable([["a", [1]]], { a: f.uint8() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Uint8; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Uint8>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Uint8Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("uint16", () => {
  const t = q.table({ a: q.uint16() }).parse(
    makeTable([["a", [1]]], { a: f.uint16() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Uint16; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Uint16>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint16Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Uint16Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("uint32", () => {
  const t = q.table({ a: q.uint32() }).parse(
    makeTable([["a", [1]]], { a: f.uint32() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Uint32; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Uint32>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Uint32Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("uint64", () => {
  const t = q.table({ a: q.uint64() }).parse(
    makeTable([["a", [1n]]], { a: f.uint64() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Uint64; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Uint64>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigUint64Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(BigUint64Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`bigint | null`);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Floats
// =============================================================================

test("float16", () => {
  const t = q.table({ a: q.float16() }).parse(
    makeTable([["a", [1.5]]], { a: f.float16() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Float16; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Float16>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint16Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Uint16Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("float32", () => {
  const t = q.table({ a: q.float32() }).parse(
    makeTable([["a", [1.5]]], { a: f.float32() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Float32; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Float32>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Float32Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("float64", () => {
  const t = q.table({ a: q.float64() }).parse(
    makeTable([["a", [1.5]]], { a: f.float64() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Float64; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Float64>`);
  const arr = vec.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Float64Array);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Strings
// =============================================================================

test("utf8", () => {
  const t = q.table({ a: q.utf8() }).parse(
    makeTable([["a", ["hi"]]], { a: f.utf8() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Utf8; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Utf8>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(typeof val).toBe("string");
});

test("largeUtf8", () => {
  const t = q.table({ a: q.largeUtf8() }).parse(
    makeTable([["a", ["hi"]]], { a: f.largeUtf8() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.LargeUtf8; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.LargeUtf8>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(typeof val).toBe("string");
});

// =============================================================================
// Bool
// =============================================================================

test("bool", () => {
  const t = q.table({ a: q.bool() }).parse(
    makeTable([["a", [true]]], { a: f.bool() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Bool; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Bool>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`boolean | null`);
  expect(typeof val).toBe("boolean");
});

// =============================================================================
// Binary
// =============================================================================

test("binary", () => {
  const t = q.table({ a: q.binary() }).parse(
    makeTable([["a", [new Uint8Array([1, 2])]]], { a: f.binary() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Binary; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Binary>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike> | null`);
  expect(val).toBeInstanceOf(Uint8Array);
});

test("fixedSizeBinary", () => {
  const t = q.table({ a: q.fixedSizeBinary(4) }).parse(
    makeTable([["a", [new Uint8Array([1, 2, 3, 4])]]], {
      a: f.fixedSizeBinary(4),
    }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.FixedSizeBinary; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.FixedSizeBinary>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike> | null`);
  expect(val).toBeInstanceOf(Uint8Array);
});

// =============================================================================
// Date — always number in apache-arrow (no useDate)
// =============================================================================

test("dateDay", () => {
  const t = q.table({ a: q.dateDay() }).parse(
    makeTable([["a", [new Date("2024-01-01")]]], { a: f.dateDay() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.DateDay; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.DateDay>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("dateMillisecond", () => {
  const t = q.table({ a: q.dateMillisecond() }).parse(
    makeTable([["a", [new Date("2024-01-01")]]], { a: f.dateMillisecond() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.DateMillisecond; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.DateMillisecond>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Time
// =============================================================================

test("timeSecond", () => {
  const t = q.table({ a: q.timeSecond() }).parse(
    makeTable([["a", [3600]]], { a: f.timeSecond() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Time<Times>; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Time<Times>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | bigint | null`);
  expect(typeof val).toBe("number");
});

test("timeMicrosecond", () => {
  const t = q.table({ a: q.timeMicrosecond() }).parse(
    makeTable([["a", [3600000000n]]], { a: f.timeMicrosecond() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Time<Times>; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Time<Times>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | bigint | null`);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Timestamp — always number in apache-arrow (no useDate)
// =============================================================================

test("timestamp", () => {
  const t = q.table({ a: q.timestamp() }).parse(
    makeTable([["a", [1000000]]], { a: f.timestamp() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Timestamp<Timestamps>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Timestamp<Timestamps>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Duration — always bigint in apache-arrow
// =============================================================================

test("duration", () => {
  const t = q.table({ a: q.duration() }).parse(
    makeTable([["a", [1000n]]], { a: f.duration() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Duration<Durations>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Duration<Durations>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`bigint | null`);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Decimal
// =============================================================================

test("decimal128", () => {
  const t = q.table({ a: q.decimal128(10, 2) }).parse(
    makeTable([["a", [1.5]]], { a: f.decimal(10, 2, 128) }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Decimal; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Decimal>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`Uint32Array<ArrayBufferLike> | null`);
  expect(val).toBeInstanceOf(Uint32Array);
});

// =============================================================================
// Dictionary
// =============================================================================

test("dictionary(utf8)", () => {
  const t = q.table({ a: q.dictionary(q.utf8()) }).parse(
    makeTable([["a", ["a", "b", "a"]]], { a: f.dictionary(f.utf8()) }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Dictionary<arrow.Utf8, TKeys>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Dictionary<arrow.Utf8, TKeys>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(typeof val).toBe("string");
});

// =============================================================================
// List
// =============================================================================

test("list(int32)", () => {
  const t = q.table({ a: q.list(q.int32()) }).parse(
    makeTable([["a", [[1, 2]]]], { a: f.list(f.int32()) }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.List<arrow.Int32>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.List<arrow.Int32>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`arrow.Vector<arrow.Int32> | null`);
  expect(val).toBeInstanceOf(arrow.Vector);
});

test("list(utf8)", () => {
  const t = q.table({ a: q.list(q.utf8()) }).parse(
    makeTable([["a", [["a", "b"]]]], { a: f.list(f.utf8()) }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.List<arrow.Utf8>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.List<arrow.Utf8>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`arrow.Vector<arrow.Utf8> | null`);
  expect(val).toBeInstanceOf(arrow.Vector);
});

// =============================================================================
// Struct
// =============================================================================

test("struct", () => {
  const t = q.table({ a: q.struct({ x: q.int32(), y: q.utf8() }) }).parse(
    makeTable(
      [["a", [{ x: 1, y: "hi" }]]],
      { a: f.struct({ x: f.int32(), y: f.utf8() }) },
    ),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Struct<StructTypeMap<(q.Field<"x", IntType<32, true>> | q.Field<"y", f.Utf8Type>)[]>>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Struct<StructTypeMap<(q.Field<"x", IntType<32, true>> | q.Field<"y", f.Utf8Type>)[]>>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(
    `arrow.StructRowProxy<StructTypeMap<(q.Field<"x", IntType<32, true>> | q.Field<"y", f.Utf8Type>)[]>> | null`,
  );
  expect(val?.x).toBe(1);
  expect(val?.y).toBe("hi");
});

// =============================================================================
// Map
// =============================================================================

test("map(utf8, int32)", () => {
  const t = q.table({ a: q.map(q.utf8(), q.int32()) }).parse(
    makeTable(
      [["a", [new Map([["k", 1]])]]],
      { a: f.map(f.utf8(), f.int32()) },
    ),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Map_<arrow.Utf8, arrow.Int32>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Map_<arrow.Utf8, arrow.Int32>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(
    `arrow.MapRow<arrow.Utf8, arrow.Int32> | null`,
  );
  expect(val).not.toBeNull();
});

// =============================================================================
// Either
// =============================================================================

test("either([int32, float64])", () => {
  const t = q.table({ a: q.oneOf([q.int32(), q.float64()]) }).parse(
    makeTable([["a", [1]]], { a: f.int32() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Int32 | arrow.Float64; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Int32 | arrow.Float64>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Broad matchers
// =============================================================================

test("broad int()", () => {
  const t = q.table({ a: q.int() }).parse(
    makeTable([["a", [1]]], { a: f.int32() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Int<Ints>; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Int<Ints>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | bigint | null`);
  expect(typeof val).toBe("number");
});

test("broad float()", () => {
  const t = q.table({ a: q.float() }).parse(
    makeTable([["a", [1.5]]], { a: f.float64() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Float<Floats>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Float<Floats>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("broad string()", () => {
  const t = q.table({ a: q.string() }).parse(
    makeTable([["a", ["hi"]]], { a: f.utf8() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Utf8 | arrow.LargeUtf8; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Utf8 | arrow.LargeUtf8>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(typeof val).toBe("string");
});

test("broad date()", () => {
  const t = q.table({ a: q.date() }).parse(
    makeTable([["a", [new Date()]]], { a: f.dateDay() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Date_<Dates>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Date_<Dates>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

test("broad time()", () => {
  const t = q.table({ a: q.time() }).parse(
    makeTable([["a", [3600]]], { a: f.timeSecond() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Time<Times>; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Time<Times>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | bigint | null`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// JS-type builders — q.like("type")
// =============================================================================

test('js("number")', () => {
  const t = q.table({ a: q.like("number") }).parse(
    makeTable([["a", [1]]], { a: f.int32() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Int<Ints> | arrow.Float<Floats>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Int<Ints> | arrow.Float<Floats>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | bigint | null`);
  expect(typeof val).toBe("number");
});

test('js("bigint")', () => {
  const t = q.table({ a: q.like("bigint") }).parse(
    makeTable([["a", [1n]]], { a: f.int64() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Int<Ints>; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Int<Ints>>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | bigint | null`);
  expect(typeof val).toBe("bigint");
});

test('js("string")', () => {
  const t = q.table({ a: q.like("string") }).parse(
    makeTable([["a", ["hi"]]], { a: f.utf8() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Utf8 | arrow.LargeUtf8; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Utf8 | arrow.LargeUtf8>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(typeof val).toBe("string");
});

test('js("boolean")', () => {
  const t = q.table({ a: q.like("boolean") }).parse(
    makeTable([["a", [true]]], { a: f.bool() }),
  );
  expectType(t).toMatchInlineSnapshot(`arrow.Table<{ a: arrow.Bool; }>`);
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(`arrow.Vector<arrow.Bool>`);
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`boolean | null`);
  expect(typeof val).toBe("boolean");
});

test('js("bytes")', () => {
  const t = q.table({ a: q.like("bytes") }).parse(
    makeTable([["a", [new Uint8Array([1, 2])]]], { a: f.binary() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Binary | arrow.FixedSizeBinary | arrow.LargeBinary; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Binary | arrow.FixedSizeBinary | arrow.LargeBinary>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike> | null`);
  expect(val).toBeInstanceOf(Uint8Array);
});

test('js("date")', () => {
  const t = q.table({ a: q.like("date") }).parse(
    makeTable([["a", [new Date("2024-01-01")]]], { a: f.dateDay() }),
  );
  expectType(t).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Timestamp<Timestamps> | arrow.Date_<Dates>; }>`,
  );
  const vec = t.getChild("a")!;
  expectType(vec).toMatchInlineSnapshot(
    `arrow.Vector<arrow.Timestamp<Timestamps> | arrow.Date_<Dates>>`,
  );
  const val = vec.get(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// infer utility type
// =============================================================================

test("infer resolves table type", () => {
  const s = q.table({ a: q.int32(), b: q.utf8() });
  type T = q.infer<typeof s>;
  expectType({} as T).toMatchInlineSnapshot(
    `arrow.Table<{ a: arrow.Int32; b: arrow.Utf8; }>`,
  );
});

// =============================================================================
// Types unsupported by apache-arrow JS — map to never, parseIPC throws
// =============================================================================

const unsupportedFixture = NodeFs.readFileSync(
  NodePath.resolve(
    import.meta.dirname!,
    "../../fixtures/unsupported_types.arrow",
  ),
);

test("largeList maps to never and parseIPC throws", () => {
  const s = q.table({ large_list: q.largeList(q.int32()) });
  expect(() => {
    const t = s.parseIPC(unsupportedFixture);
    const col: arrow.Vector<never> = t.getChild("large_list")!;
    void col;
  }).toThrow();
});

test("listView maps to never and parseIPC throws", () => {
  const s = q.table({ list_view: q.listView(q.int32()) });
  expect(() => {
    const t = s.parseIPC(unsupportedFixture);
    const col: arrow.Vector<never> = t.getChild("list_view")!;
    void col;
  }).toThrow();
});

test("largeListView maps to never and parseIPC throws", () => {
  const s = q.table({ large_list_view: q.largeListView(q.int32()) });
  expect(() => {
    const t = s.parseIPC(unsupportedFixture);
    const col: arrow.Vector<never> = t.getChild("large_list_view")!;
    void col;
  }).toThrow();
});

test("binaryView maps to never and parseIPC throws", () => {
  const s = q.table({ binary_view: q.binaryView() });
  expect(() => {
    const t = s.parseIPC(unsupportedFixture);
    const col: arrow.Vector<never> = t.getChild("binary_view")!;
    void col;
  }).toThrow();
});
