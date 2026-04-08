/**
 * Snapshot tests for quiver's type system.
 *
 * This file is the source of truth for what quiver infers. Each test
 * creates a single-column Arrow table, parses it through quiver, and
 * checks both the inferred TypeScript type and the runtime value.
 *
 * Type snapshots use `expectType(expr).toMatchInlineSnapshot(...)`.
 * At transform time a Vite plugin resolves the TS type of `expr` and
 * vitest's built-in `--update` mechanism keeps them in sync.
 *
 * To update all snapshots after a change:
 *
 *   deno task test:update
 *
 * To verify they match:
 *
 *   deno task test
 */

import { expect, test } from "vitest";
import { expectType } from "tintype";
import * as NodeFs from "node:fs";
import * as NodePath from "node:path";

import * as f from "@uwdata/flechette";
import * as q from "../flechette/mod.ts";

function ipc(data: unknown[], type: f.DataType): Uint8Array {
  const t = f.tableFromArrays([["a", data]], { types: { a: type } });
  const bytes = f.tableToIPC(t, { format: "stream" });
  if (!bytes) throw new Error("tableToIPC returned null");
  return bytes;
}

// =============================================================================
// Integers — signed
// =============================================================================

test("int8", () => {
  const t = q.table({ a: q.int8() }).parseIPC(ipc([1], f.int8()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<8, true>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int8Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int8Array);
  expect(typeof val).toBe("number");
});

test("int16", () => {
  const t = q.table({ a: q.int16() }).parseIPC(ipc([1], f.int16()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<16, true>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int16Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int16Array);
  expect(typeof val).toBe("number");
});

test("int32", () => {
  const t = q.table({ a: q.int32() }).parseIPC(ipc([1], f.int32()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<32, true>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

test("int64", () => {
  const t = q.table({ a: q.int64() }).parseIPC(ipc([1n], f.int64()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<64, true>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("int64 + useBigInt", () => {
  const t = q.table({ a: q.int64() }, { useBigInt: true }).parseIPC(
    ipc([1n], f.int64()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<64, true>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(arr).toBeInstanceOf(BigInt64Array);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Integers — unsigned
// =============================================================================

test("uint8", () => {
  const t = q.table({ a: q.uint8() }).parseIPC(ipc([1], f.uint8()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<8, false>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Uint8Array);
  expect(typeof val).toBe("number");
});

test("uint16", () => {
  const t = q.table({ a: q.uint16() }).parseIPC(ipc([1], f.uint16()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<16, false>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint16Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Uint16Array);
  expect(typeof val).toBe("number");
});

test("uint32", () => {
  const t = q.table({ a: q.uint32() }).parseIPC(ipc([1], f.uint32()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<32, false>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Uint32Array);
  expect(typeof val).toBe("number");
});

test("uint64", () => {
  const t = q.table({ a: q.uint64() }).parseIPC(ipc([1n], f.uint64()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<64, false>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("uint64 + useBigInt", () => {
  const t = q.table({ a: q.uint64() }, { useBigInt: true }).parseIPC(
    ipc([1n], f.uint64()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<64, false>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigUint64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(arr).toBeInstanceOf(BigUint64Array);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Floats
// =============================================================================

test("float16", () => {
  const t = q.table({ a: q.float16() }).parseIPC(ipc([1.5], f.float16()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<FloatType<0>, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("float32", () => {
  const t = q.table({ a: q.float32() }).parseIPC(ipc([1.5], f.float32()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<FloatType<1>, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float32Array);
  expect(typeof val).toBe("number");
});

test("float64", () => {
  const t = q.table({ a: q.float64() }).parseIPC(ipc([1.5], f.float64()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<FloatType<2>, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Strings
// =============================================================================

test("utf8", () => {
  const t = q.table({ a: q.utf8() }).parseIPC(ipc(["hi"], f.utf8()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.Utf8Type, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("string");
});

test("largeUtf8", () => {
  const t = q.table({ a: q.largeUtf8() }).parseIPC(ipc(["hi"], f.largeUtf8()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.LargeUtf8Type, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("string");
});

// =============================================================================
// Bool
// =============================================================================

test("bool", () => {
  const t = q.table({ a: q.bool() }).parseIPC(ipc([true], f.bool()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.BoolType, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`boolean[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`boolean`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("boolean");
});

// =============================================================================
// Binary
// =============================================================================

test("binary", () => {
  const t = q.table({ a: q.binary() }).parseIPC(
    ipc([new Uint8Array([1, 2])], f.binary()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.BinaryType, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Uint8Array);
});

test("fixedSizeBinary", () => {
  const t = q.table({ a: q.fixedSizeBinary(4) }).parseIPC(
    ipc([new Uint8Array([1, 2, 3, 4])], f.fixedSizeBinary(4)),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<f.FixedSizeBinaryType, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Uint8Array);
});

// =============================================================================
// Date
// =============================================================================

test("dateDay", () => {
  const t = q.table({ a: q.dateDay() }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateDay()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<DateType<0>, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("dateDay + useDate", () => {
  const t = q.table({ a: q.dateDay() }, { useDate: true }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateDay()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<0>, { readonly useDate: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Date[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Date);
});

test("dateMillisecond + useDate", () => {
  const t = q.table({ a: q.dateMillisecond() }, { useDate: true }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateMillisecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<1>, { readonly useDate: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Date[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Date);
});

// =============================================================================
// Time
// =============================================================================

test("timeSecond", () => {
  const t = q.table({ a: q.timeSecond() }).parseIPC(
    ipc([3600], f.timeSecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<32, f.TimeUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

test("timeMicrosecond + useBigInt", () => {
  const t = q
    .table({ a: q.timeMicrosecond() }, { useBigInt: true })
    .parseIPC(ipc([3600000000n], f.timeMicrosecond()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<64, f.TimeUnit_>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(arr).toBeInstanceOf(BigInt64Array);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Timestamp
// =============================================================================

test("timestamp", () => {
  const t = q.table({ a: q.timestamp() }).parseIPC(
    ipc([1000000], f.timestamp()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimestampType<f.TimeUnit_, string | null>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("timestamp + useDate", () => {
  const t = q.table({ a: q.timestamp() }, { useDate: true }).parseIPC(
    ipc([1000000], f.timestamp()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimestampType<f.TimeUnit_, string | null>, { readonly useDate: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Date[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Date);
});

// =============================================================================
// Duration
// =============================================================================

test("duration", () => {
  const t = q.table({ a: q.duration() }).parseIPC(
    ipc([1000n], f.duration()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DurationType<f.TimeUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("duration + useBigInt", () => {
  const t = q.table({ a: q.duration() }, { useBigInt: true }).parseIPC(
    ipc([1000n], f.duration()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DurationType<f.TimeUnit_>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(arr).toBeInstanceOf(BigInt64Array);
  expect(typeof val).toBe("bigint");
});

// =============================================================================
// Decimal
// =============================================================================

test("decimal128", () => {
  const t = q.table({ a: q.decimal128(10, 2) }).parseIPC(
    ipc([1.5], f.decimal(10, 2, 128)),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<128>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("decimal128 + useDecimalInt", () => {
  const t = q
    .table({ a: q.decimal128(10, 2) }, { useDecimalInt: true })
    .parseIPC(ipc([1.5], f.decimal(10, 2, 128)));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<128>, { readonly useDecimalInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`bigint[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("bigint");
});

test("decimal32 + useDecimalInt", () => {
  const t = q
    .table({ a: q.decimal32(5, 2) }, { useDecimalInt: true })
    .parseIPC(ipc([1.5], f.decimal(5, 2, 32)));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<32>, { readonly useDecimalInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Dictionary
// =============================================================================

test("dictionary(utf8)", () => {
  const t = q.table({ a: q.dictionary(q.utf8()) }).parseIPC(
    ipc(["a", "b", "a"], f.dictionary(f.utf8())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DictionaryType<f.Utf8Type>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("string");
});

test("dictionary(int32)", () => {
  const t = q.table({ a: q.dictionary(q.int32()) }).parseIPC(
    ipc([1, 2, 1], f.dictionary(f.int32())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DictionaryType<IntType<32, true>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`number[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("number");
});

// =============================================================================
// List
// =============================================================================

test("list(int32)", () => {
  const t = q.table({ a: q.list(q.int32()) }).parseIPC(
    ipc([[1, 2]], f.list(f.int32())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListType<q.Field<string, IntType<32, true>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Int32Array);
});

test("list(utf8)", () => {
  const t = q.table({ a: q.list(q.utf8()) }).parseIPC(
    ipc([["a", "b"]], f.list(f.utf8())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListType<q.Field<string, f.Utf8Type>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[][]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string[]`);
  expect(arr).toEqual([["a", "b"]]);
  expect(val).toEqual(["a", "b"]);
});

test("list(int64) + useBigInt", () => {
  const t = q
    .table({ a: q.list(q.int64()) }, { useBigInt: true })
    .parseIPC(ipc([[1n, 2n]], f.list(f.int64())));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListType<q.Field<string, IntType<64, true>>>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(BigInt64Array);
});

// =============================================================================
// Struct
// =============================================================================

test("struct", () => {
  const t = q
    .table({ a: q.struct({ x: q.int32(), y: q.utf8() }) })
    .parseIPC(
      ipc([{ x: 1, y: "hi" }], f.struct({ x: f.int32(), y: f.utf8() })),
    );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<StructType<(q.Field<"x", IntType<32, true>> | q.Field<"y", f.Utf8Type>)[]>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`{ x: number; y: string; }[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`{ x: number; y: string; }`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toEqual({ x: 1, y: "hi" });
});

test("struct + useBigInt", () => {
  const t = q
    .table({ a: q.struct({ v: q.int64() }) }, { useBigInt: true })
    .parseIPC(ipc([{ v: 1n }], f.struct({ v: f.int64() })));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<StructType<q.Field<"v", IntType<64, true>>[]>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`{ v: bigint; }[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`{ v: bigint; }`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toEqual({ "v": 1n });
});

// =============================================================================
// Map
// =============================================================================

test("map(utf8, int32)", () => {
  const t = q.table({ a: q.map(q.utf8(), q.int32()) }).parseIPC(
    ipc([new Map([["k", 1]])], f.map(f.utf8(), f.int32())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<MapType<q.Field<"entries", StructType<[q.Field<"key", f.Utf8Type>, q.Field<"value", IntType<32, true>>]>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`[string, number][][]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`[string, number][]`);
  expect(arr).toEqual([[["k", 1]]]);
  expect(val).toEqual([["k", 1]]);
});

// =============================================================================
// Nullable
// =============================================================================

test("nullable int32", () => {
  const t = q.table({ a: q.int32().nullable() }).parseIPC(
    ipc([1, null], f.int32()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<32, true>, {}, true>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Int32Array<ArrayBufferLike> | (number | null)[]`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  expect(arr).toEqual([1, null]);
  expect(val).toBe(1);
  expect(col.at(1)).toBe(null);
});

test("nullable utf8", () => {
  const t = q.table({ a: q.utf8().nullable() }).parseIPC(
    ipc(["hi", null], f.utf8()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.Utf8Type, {}, true>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`(string | null)[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(arr).toEqual(["hi", null]);
  expect(val).toBe("hi");
  expect(col.at(1)).toBe(null);
});

// =============================================================================
// OneOf
// =============================================================================

test("oneOf([int32, float64])", () => {
  const s = q.table({ a: q.oneOf([q.int32(), q.float64()]) });
  {
    const t = s.parseIPC(ipc([1], f.int32()));
    const col = t.getChild("a");
    expectType(col).toMatchInlineSnapshot(
      `q.Column<IntType<32, true> | FloatType<2>, {}, false>`,
    );
    const arr = col.toArray();
    expectType(arr).toMatchInlineSnapshot(
      `Int32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
    );
    const val = col.at(0);
    expectType(val).toMatchInlineSnapshot(`number`);
    expect(arr).toBeInstanceOf(Int32Array);
    expect(typeof val).toBe("number");
  }

  {
    const t = s.parseIPC(ipc([1], f.float64()));
    const col = t.getChild("a");
    expectType(col).toMatchInlineSnapshot(
      `q.Column<IntType<32, true> | FloatType<2>, {}, false>`,
    );
    const arr = col.toArray();
    expectType(arr).toMatchInlineSnapshot(
      `Int32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
    );
    const val = col.at(0);
    expectType(val).toMatchInlineSnapshot(`number`);
    expect(arr).toBeInstanceOf(Float64Array);
    expect(typeof val).toBe("number");
  }
});

// =============================================================================
// Nested — list of struct
// =============================================================================

test("list(struct)", () => {
  const t = q
    .table({ a: q.list(q.struct({ x: q.int32() })) })
    .parseIPC(
      ipc([[{ x: 1 }, { x: 2 }]], f.list(f.struct({ x: f.int32() }))),
    );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListType<q.Field<string, StructType<q.Field<"x", IntType<32, true>>[]>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`{ x: number; }[][]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`{ x: number; }[]`);
  expect(arr).toEqual([[{ "x": 1 }, { "x": 2 }]]);
  expect(val).toEqual([{ "x": 1 }, { "x": 2 }]);
});

// =============================================================================
// Nested — struct with list
// =============================================================================

test("struct with list", () => {
  const t = q
    .table({ a: q.struct({ vs: q.list(q.int32()) }) })
    .parseIPC(
      ipc([{ vs: [1, 2] }], f.struct({ vs: f.list(f.int32()) })),
    );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<StructType<q.Field<"vs", ListType<q.Field<string, IntType<32, true>>>>[]>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `{ vs: Int32Array<ArrayBufferLike>; }[]`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`{ vs: Int32Array<ArrayBufferLike>; }`);
  expect(arr).toEqual([{ "vs": Int32Array.from([1, 2]) }]);
  expect(val).toEqual({ "vs": Int32Array.from([1, 2]) });
});

// =============================================================================
// Option invariants — useBigInt doesn't affect small ints or floats
// =============================================================================

test("int32 + useBigInt still number", () => {
  const t = q.table({ a: q.int32() }, { useBigInt: true }).parseIPC(
    ipc([1], f.int32()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<32, true>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

test("float64 + useBigInt still number", () => {
  const t = q.table({ a: q.float64() }, { useBigInt: true }).parseIPC(
    ipc([1.5], f.float64()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<FloatType<2>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Nullable variants
// =============================================================================

test("nullable int64 + useBigInt", () => {
  const t = q
    .table({ a: q.int64().nullable() }, { useBigInt: true })
    .parseIPC(ipc([1n, null], f.int64()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<64, true>, { readonly useBigInt: true; }, true>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `BigInt64Array<ArrayBufferLike> | (bigint | null)[]`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint | null`);
  const nul = col.at(1);
  expectType(nul).toMatchInlineSnapshot(`bigint | null`);
  expect(arr).toEqual([1n, null]);
  expect(val).toBe(1n);
  expect(nul).toBe(null);
});

test("nullable dateDay + useDate", () => {
  const t = q
    .table({ a: q.dateDay().nullable() }, { useDate: true })
    .parseIPC(ipc([new Date("2024-01-01"), null], f.dateDay()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<0>, { readonly useDate: true; }, true>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`(Date | null)[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date | null`);
  const nul = col.at(1);
  expectType(nul).toMatchInlineSnapshot(`Date | null`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Date);
  expect(nul).toBe(null);
});

test("nullable bool", () => {
  const t = q.table({ a: q.bool().nullable() }).parseIPC(
    ipc([true, null], f.bool()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.BoolType, {}, true>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`(boolean | null)[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`boolean | null`);
  const nul = col.at(1);
  expectType(nul).toMatchInlineSnapshot(`boolean | null`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBe(true);
  expect(nul).toBe(null);
});

// =============================================================================
// Map + useMap
// =============================================================================

test("map(utf8, int32) + useMap", () => {
  const t = q
    .table({ a: q.map(q.utf8(), q.int32()) }, { useMap: true })
    .parseIPC(ipc([new Map([["k", 1]])], f.map(f.utf8(), f.int32())));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<MapType<q.Field<"entries", StructType<[q.Field<"key", f.Utf8Type>, q.Field<"value", IntType<32, true>>]>>>, { readonly useMap: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Map<string, number>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Map<string, number>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Map);
});

// =============================================================================
// Broad builders — with type snapshots
// =============================================================================

test("q.int() accepts int8", () => {
  const t = q.table({ a: q.int() }).parseIPC(ipc([1], f.int8()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<f.IntBitWidth, boolean>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Int8Array<ArrayBufferLike> | Int16Array<ArrayBufferLike> | Int32Array<ArrayBufferLike> | Uint8Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int8Array);
  expect(val).toBe(1);
});

test("q.string() accepts largeUtf8", () => {
  const t = q.table({ a: q.string() }).parseIPC(
    ipc(["hi"], f.largeUtf8()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<f.Utf8Type | f.LargeUtf8Type | f.Utf8ViewType, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string`);
  expect(arr).toBeInstanceOf(Array);
  expect(typeof val).toBe("string");
});

test("q.float() accepts float32", () => {
  const t = q.table({ a: q.float() }).parseIPC(ipc([1.5], f.float32()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<FloatType<f.Precision_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Float64Array<ArrayBufferLike> | Float32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float32Array);
  expect(typeof val).toBe("number");
});

test("q.date() accepts dateMillisecond", () => {
  const t = q.table({ a: q.date() }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateMillisecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<f.DateUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("q.time() accepts timeSecond", () => {
  const t = q.table({ a: q.time() }).parseIPC(
    ipc([3600], f.timeSecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<32 | 64, f.TimeUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Int32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Interval
// =============================================================================

test("interval", () => {
  const t = q.table({ a: q.interval() }).parseIPC(
    ipc([[1, 15, 0n]], f.interval()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntervalType<f.IntervalUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Float64Array);
});

test("interval + useDate", () => {
  const t = q.table({ a: q.interval() }, { useDate: true }).parseIPC(
    ipc([[1, 15, 0n]], f.interval()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntervalType<f.IntervalUnit_>, { readonly useDate: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Float64Array);
});

// =============================================================================
// infer utility type
// =============================================================================

test("infer resolves table type", () => {
  const s = q.table({ a: q.int32(), b: q.utf8() });
  type T = q.infer<typeof s>;
  expectType({} as T).toMatchInlineSnapshot(
    `q.Table<RecordToFields<{ readonly a: q.SchemaEntry<IntType<32, true>, false>; readonly b: q.SchemaEntry<f.Utf8Type, false>; }>, {}>`,
  );
});

// =============================================================================
// View / large types — parsed from pyarrow-generated fixture
// (flechette cannot build these via tableFromArrays)
// =============================================================================

const unsupportedFixture = NodeFs.readFileSync(
  NodePath.resolve(
    import.meta.dirname!,
    "../../fixtures/unsupported_types.arrow",
  ),
);

test("utf8View", () => {
  const t = q.table({ utf8_view: q.utf8View() }).parseIPC(unsupportedFixture);
  const col = t.getChild("utf8_view");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.Utf8ViewType, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string`);
  expect(typeof val).toBe("string");
});

test("binaryView", () => {
  const t = q.table({ binary_view: q.binaryView() }).parseIPC(
    unsupportedFixture,
  );
  const col = t.getChild("binary_view");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<f.BinaryViewType, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  expect(val).toBeInstanceOf(Uint8Array);
});

test("largeBinary", () => {
  const t = q.table({ a: q.largeBinary() }).parseIPC(
    ipc([new Uint8Array([1, 2])], f.largeBinary()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<f.LargeBinaryType, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Uint8Array);
});

// =============================================================================
// Missing time variants
// =============================================================================

test("timeMillisecond", () => {
  const t = q.table({ a: q.timeMillisecond() }).parseIPC(
    ipc([1000], f.timeMillisecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<32, f.TimeUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

test("timeNanosecond", () => {
  const t = q.table({ a: q.timeNanosecond() }).parseIPC(
    ipc([1000000000n], f.timeNanosecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<64, f.TimeUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("timeNanosecond + useBigInt", () => {
  const t = q.table({ a: q.timeNanosecond() }, { useBigInt: true }).parseIPC(
    ipc([1000000000n], f.timeNanosecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<64, f.TimeUnit_>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`BigInt64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(arr).toBeInstanceOf(BigInt64Array);
  expect(typeof val).toBe("bigint");
});

test("timeMicrosecond", () => {
  const t = q.table({ a: q.timeMicrosecond() }).parseIPC(
    ipc([1000000n], f.timeMicrosecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<64, f.TimeUnit_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

// =============================================================================
// Missing date/timestamp combos
// =============================================================================

test("dateMillisecond", () => {
  const t = q.table({ a: q.dateMillisecond() }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateMillisecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<1>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("timestamp + useDate + timezone", () => {
  const t = q
    .table({ a: q.timestamp(undefined, "UTC") }, { useDate: true })
    .parseIPC(ipc([new Date("2024-01-01")], f.timestamp(undefined, "UTC")));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimestampType<f.TimeUnit_, string | null>, { readonly useDate: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Date[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date`);
  expect(val).toBeInstanceOf(Date);
});

// =============================================================================
// Missing decimal variants
// =============================================================================

test("decimal32", () => {
  const t = q.table({ a: q.decimal32(7, 2) }).parseIPC(
    ipc([1.23], f.decimal32(7, 2)),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<32>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("decimal64", () => {
  const t = q.table({ a: q.decimal64(18, 2) }).parseIPC(
    ipc([1.23], f.decimal64(18, 2)),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<64>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("decimal64 + useDecimalInt", () => {
  const t = q
    .table({ a: q.decimal64(18, 2) }, { useDecimalInt: true })
    .parseIPC(ipc([1.23], f.decimal64(18, 2)));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<64>, { readonly useDecimalInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`bigint[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
});

test("decimal256", () => {
  const t = q.table({ a: q.decimal256(38, 2) }).parseIPC(
    ipc([1.23], f.decimal256(38, 2)),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<256>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Float64Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Float64Array);
  expect(typeof val).toBe("number");
});

test("decimal256 + useDecimalInt", () => {
  const t = q
    .table({ a: q.decimal256(38, 2) }, { useDecimalInt: true })
    .parseIPC(ipc([1.23], f.decimal256(38, 2)));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<256>, { readonly useDecimalInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`bigint[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
});

// =============================================================================
// Null type
// =============================================================================

test("nullType", () => {
  const t = q.table({ a: q.nullType() }).parseIPC(
    ipc([null, null], f.nullType()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.NullType, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`null[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`null`);
  expect(val).toBe(null);
});

// =============================================================================
// Missing list variants
// =============================================================================

test("fixedSizeList(int32, 3)", () => {
  const t = q.table({ a: q.fixedSizeList(q.int32(), 3) }).parseIPC(
    ipc([[1, 2, 3]], f.fixedSizeList(f.int32(), 3)),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<FixedSizeListType<[q.Field<string, IntType<32, true>>]>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`[number][]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`[number]`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Int32Array);
});

test("largeList(int32)", () => {
  const t = q.table({ a: q.largeList(q.int32()) }).parseIPC(
    ipc([[1, 2]], f.largeList(f.int32())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<LargeListType<q.Field<string, IntType<32, true>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Int32Array);
});

test("listView(int32)", () => {
  const t = q.table({ list_view: q.listView(q.int32()) }).parseIPC(
    unsupportedFixture,
  );
  const col = t.getChild("list_view");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListViewType<q.Field<string, IntType<32, true>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Int32Array);
});

test("largeListView(int32)", () => {
  const t = q.table({ large_list_view: q.largeListView(q.int32()) }).parseIPC(
    unsupportedFixture,
  );
  const col = t.getChild("large_list_view");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<LargeListViewType<q.Field<string, IntType<32, true>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>[]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Int32Array);
});

test("list(list(int32))", () => {
  const t = q.table({ a: q.list(q.list(q.int32())) }).parseIPC(
    ipc([[[1, 2], [3]]], f.list(f.list(f.int32()))),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListType<q.Field<string, ListType<q.Field<string, IntType<32, true>>>>>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>[][]`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>[]`);
  expect(arr).toBeInstanceOf(Array);
  expect(val).toBeInstanceOf(Array);
});

// =============================================================================
// Nested struct
// =============================================================================

test("nested struct", () => {
  const t = q
    .table({ a: q.struct({ inner: q.struct({ val: q.int32() }) }) })
    .parseIPC(
      ipc(
        [{ inner: { val: 42 } }],
        f.struct({ inner: f.struct({ val: f.int32() }) }),
      ),
    );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<StructType<q.Field<"inner", StructType<q.Field<"val", IntType<32, true>>[]>>[]>, {}, false>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`{ inner: { val: number; }; }`);
  expect(val).toEqual({ inner: { val: 42 } });
});

// =============================================================================
// Option isolation — options that should NOT affect certain types
// =============================================================================

test("int8 + useBigInt still number", () => {
  const t = q.table({ a: q.int8() }, { useBigInt: true }).parseIPC(
    ipc([1], f.int8()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<8, true>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int8Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int8Array);
  expect(typeof val).toBe("number");
});

test("uint16 + useBigInt still number", () => {
  const t = q.table({ a: q.uint16() }, { useBigInt: true }).parseIPC(
    ipc([1], f.uint16()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<16, false>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint16Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Uint16Array);
  expect(typeof val).toBe("number");
});

test("dateDay + useBigInt still number", () => {
  const t = q.table({ a: q.dateDay() }, { useBigInt: true }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateDay()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<0>, { readonly useBigInt: true; }, false>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(typeof val).toBe("number");
});

test("timeSecond + useBigInt still number", () => {
  const t = q.table({ a: q.timeSecond() }, { useBigInt: true }).parseIPC(
    ipc([3600], f.timeSecond()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimeType<32, f.TimeUnit_>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Int32Array<ArrayBufferLike>`);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(arr).toBeInstanceOf(Int32Array);
  expect(typeof val).toBe("number");
});

test("decimal32 + useDecimalInt still number", () => {
  const t = q
    .table({ a: q.decimal32(7, 2) }, { useDecimalInt: true })
    .parseIPC(ipc([1.23], f.decimal32(7, 2)));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DecimalType<32>, { readonly useDecimalInt: true; }, false>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(typeof val).toBe("number");
});

// =============================================================================
// More nullable variants
// =============================================================================

test("nullable float64", () => {
  const t = q.table({ a: q.float64().nullable() }).parseIPC(
    ipc([1.5, null], f.float64()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<FloatType<2>, {}, true>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Float64Array<ArrayBufferLike> | (number | null)[]`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number | null`);
  const nul = col.at(1);
  expectType(nul).toMatchInlineSnapshot(`number | null`);
  expect(val).toBe(1.5);
  expect(nul).toBe(null);
});

test("nullable timestamp + useDate", () => {
  const t = q
    .table({ a: q.timestamp().nullable() }, { useDate: true })
    .parseIPC(ipc([new Date("2024-01-01"), null], f.timestamp()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<TimestampType<f.TimeUnit_, string | null>, { readonly useDate: true; }, true>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date | null`);
  expect(val).toBeInstanceOf(Date);
  const nul = col.at(1);
  expect(nul).toBe(null);
});

test("nullable list(int32)", () => {
  const t = q.table({ a: q.list(q.int32()).nullable() }).parseIPC(
    ipc([[1, 2], null], f.list(f.int32())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<ListType<q.Field<string, IntType<32, true>>>, {}, true>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(
    `Int32Array<ArrayBufferLike> | null`,
  );
  expect(val).toBeInstanceOf(Int32Array);
  const nul = col.at(1);
  expect(nul).toBe(null);
});

test("nullable struct", () => {
  const t = q.table({ a: q.struct({ x: q.int32() }).nullable() }).parseIPC(
    ipc([{ x: 1 }, null], f.struct({ x: f.int32() })),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<StructType<q.Field<"x", IntType<32, true>>[]>, {}, true>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`{ x: number; } | null`);
  expect(val).toEqual({ x: 1 });
  const nul = col.at(1);
  expect(nul).toBe(null);
});

test("nullable dictionary(utf8)", () => {
  const t = q.table({ a: q.dictionary(q.utf8()).nullable() }).parseIPC(
    ipc(["hi", null], f.dictionary(f.utf8())),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DictionaryType<f.Utf8Type>, {}, true>`,
  );
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string | null`);
  expect(val).toBe("hi");
  const nul = col.at(1);
  expect(nul).toBe(null);
});

// =============================================================================
// JS-type builders — q.like("type")
// =============================================================================

test('js("number")', () => {
  const t = q.table({ a: q.like("number") }).parseIPC(ipc([1], f.int32()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<f.IntBitWidth, boolean> | FloatType<f.Precision_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Int8Array<ArrayBufferLike> | Int16Array<ArrayBufferLike> | Int32Array<ArrayBufferLike> | Uint8Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
  );
  expect(arr).toBeInstanceOf(Int32Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(typeof val).toBe("number");
});

test('js("number") with float64', () => {
  const t = q.table({ a: q.like("number") }).parseIPC(ipc([1.5], f.float64()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<f.IntBitWidth, boolean> | FloatType<f.Precision_>, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `Int8Array<ArrayBufferLike> | Int16Array<ArrayBufferLike> | Int32Array<ArrayBufferLike> | Uint8Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>`,
  );
  expect(arr).toBeInstanceOf(Float64Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`number`);
  expect(typeof val).toBe("number");
});

test('js("bigint")', () => {
  const t = q.table({ a: q.like("bigint") }, { useBigInt: true }).parseIPC(
    ipc([1n], f.int64()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<IntType<64, boolean>, { readonly useBigInt: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(
    `BigInt64Array<ArrayBufferLike> | BigUint64Array<ArrayBufferLike>`,
  );
  expect(arr).toBeInstanceOf(BigInt64Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`bigint`);
  expect(typeof val).toBe("bigint");
});

test('js("string")', () => {
  const t = q.table({ a: q.like("string") }).parseIPC(ipc(["hi"], f.utf8()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<f.Utf8Type | f.LargeUtf8Type | f.Utf8ViewType, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`string[]`);
  expect(arr).toBeInstanceOf(Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`string`);
  expect(typeof val).toBe("string");
});

test('js("boolean")', () => {
  const t = q.table({ a: q.like("boolean") }).parseIPC(ipc([true], f.bool()));
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(`q.Column<f.BoolType, {}, false>`);
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`boolean[]`);
  expect(arr).toBeInstanceOf(Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`boolean`);
  expect(typeof val).toBe("boolean");
});

test('js("bytes")', () => {
  const t = q.table({ a: q.like("bytes") }).parseIPC(
    ipc([new Uint8Array([1, 2])], f.binary()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<f.BinaryType | f.FixedSizeBinaryType | f.LargeBinaryType | f.BinaryViewType, {}, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>[]`);
  expect(arr).toBeInstanceOf(Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Uint8Array<ArrayBufferLike>`);
  expect(val).toBeInstanceOf(Uint8Array);
});

test('js("date")', () => {
  const t = q.table({ a: q.like("date") }, { useDate: true }).parseIPC(
    ipc([new Date("2024-01-01")], f.dateDay()),
  );
  const col = t.getChild("a");
  expectType(col).toMatchInlineSnapshot(
    `q.Column<DateType<f.DateUnit_> | TimestampType<f.TimeUnit_, string | null>, { readonly useDate: true; }, false>`,
  );
  const arr = col.toArray();
  expectType(arr).toMatchInlineSnapshot(`Date[]`);
  expect(arr).toBeInstanceOf(Array);
  const val = col.at(0);
  expectType(val).toMatchInlineSnapshot(`Date`);
  expect(val).toBeInstanceOf(Date);
});
