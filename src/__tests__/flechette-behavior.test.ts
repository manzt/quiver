/**
 * Runtime tests verifying what flechette ACTUALLY returns for each
 * DataType × ExtractionOptions combination.
 *
 * This is the ground truth that our JsValue type mapping must match.
 * If any of these tests are wrong, our type system is built on lies.
 *
 * Pattern: build a table with tableFromArrays → encode to IPC →
 * decode with tableFromIPC(ipc, options) → check typeof / instanceof
 * on extracted values.
 */

import { assertEquals, assertInstanceOf, assertThrows } from "@std/assert";
import * as f from "@uwdata/flechette";

/** Round-trip helper: build a table, encode to IPC, decode with options. */
function roundTrip(
  data: Record<string, unknown[]>,
  buildOpts?: f.TableBuilderOptions,
  extractOpts?: f.ExtractionOptions,
): f.Table {
  const table = f.tableFromArrays(data, buildOpts);
  const ipc = f.tableToIPC(table, { format: "stream" });
  if (!ipc) throw new Error("tableToIPC returned null");
  return f.tableFromIPC(ipc, extractOpts);
}

/** Round-trip with explicit column types. */
function roundTripTyped(
  data: [string, unknown[]][],
  types: Record<string, f.DataType>,
  extractOpts?: f.ExtractionOptions,
): f.Table {
  const table = f.tableFromArrays(data, { types });
  const ipc = f.tableToIPC(table, { format: "stream" });
  if (!ipc) throw new Error("tableToIPC returned null");
  return f.tableFromIPC(ipc, extractOpts);
}

/** Get the first non-null value from a column. */
function firstValue(table: f.Table, name: string): unknown {
  return table.getChild(name)!.at(0);
}

// =============================================================================
// Bool
// =============================================================================

Deno.test("bool → boolean", () => {
  const t = roundTrip({ x: [true, false] });
  assertEquals(typeof firstValue(t, "x"), "boolean");
  assertEquals(firstValue(t, "x"), true);
});

// =============================================================================
// Int — small widths always number
// =============================================================================

Deno.test("int8 → number", () => {
  const t = roundTripTyped(
    [["x", [42]]],
    { x: f.int8() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
  assertEquals(firstValue(t, "x"), 42);
});

Deno.test("int16 → number", () => {
  const t = roundTripTyped(
    [["x", [1000]]],
    { x: f.int16() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("int32 → number", () => {
  const t = roundTripTyped(
    [["x", [100000]]],
    { x: f.int32() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("uint8 → number", () => {
  const t = roundTripTyped(
    [["x", [200]]],
    { x: f.uint8() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("uint16 → number", () => {
  const t = roundTripTyped(
    [["x", [60000]]],
    { x: f.uint16() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("uint32 → number", () => {
  const t = roundTripTyped(
    [["x", [4000000]]],
    { x: f.uint32() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// Int64 — depends on useBigInt
// =============================================================================

Deno.test("int64 default → number", () => {
  const t = roundTripTyped(
    [["x", [42n]]],
    { x: f.int64() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
  assertEquals(firstValue(t, "x"), 42);
});

Deno.test("int64 useBigInt:true → bigint", () => {
  const t = roundTripTyped(
    [["x", [42n]]],
    { x: f.int64() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
  assertEquals(firstValue(t, "x"), 42n);
});

Deno.test("int64 useBigInt:false → number", () => {
  const t = roundTripTyped(
    [["x", [42n]]],
    { x: f.int64() },
    { useBigInt: false },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("uint64 default → number", () => {
  const t = roundTripTyped(
    [["x", [42n]]],
    { x: f.uint64() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("uint64 useBigInt:true → bigint", () => {
  const t = roundTripTyped(
    [["x", [42n]]],
    { x: f.uint64() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

// =============================================================================
// Int8/16/32 with useBigInt:true — should STILL be number
// =============================================================================

Deno.test("int32 useBigInt:true → still number", () => {
  const t = roundTripTyped(
    [["x", [42]]],
    { x: f.int32() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("int8 useBigInt:true → still number", () => {
  const t = roundTripTyped(
    [["x", [42]]],
    { x: f.int8() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// Float
// =============================================================================

Deno.test("float32 → number", () => {
  const t = roundTripTyped(
    [["x", [3.14]]],
    { x: f.float32() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("float64 → number", () => {
  const t = roundTripTyped(
    [["x", [3.14]]],
    { x: f.float64() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("float64 useBigInt:true → still number", () => {
  const t = roundTripTyped(
    [["x", [3.14]]],
    { x: f.float64() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// Utf8
// =============================================================================

Deno.test("utf8 → string", () => {
  const t = roundTripTyped(
    [["x", ["hello"]]],
    { x: f.utf8() },
  );
  assertEquals(typeof firstValue(t, "x"), "string");
  assertEquals(firstValue(t, "x"), "hello");
});

Deno.test("largeUtf8 → string", () => {
  const t = roundTripTyped(
    [["x", ["hello"]]],
    { x: f.largeUtf8() },
  );
  assertEquals(typeof firstValue(t, "x"), "string");
});

// =============================================================================
// Binary
// =============================================================================

Deno.test("binary → Uint8Array", () => {
  const t = roundTripTyped(
    [["x", [new Uint8Array([1, 2, 3])]]],
    { x: f.binary() },
  );
  assertInstanceOf(firstValue(t, "x"), Uint8Array);
});

Deno.test("fixedSizeBinary → Uint8Array", () => {
  const t = roundTripTyped(
    [["x", [new Uint8Array([1, 2, 3, 4])]]],
    { x: f.fixedSizeBinary(4) },
  );
  assertInstanceOf(firstValue(t, "x"), Uint8Array);
});

// =============================================================================
// Decimal — useDecimalInt
// =============================================================================

Deno.test("decimal default → number", () => {
  const t = roundTripTyped(
    [["x", [123.45]]],
    { x: f.decimal(10, 2) },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("decimal useDecimalInt:true → bigint", () => {
  const t = roundTripTyped(
    [["x", [123.45]]],
    { x: f.decimal(10, 2) },
    { useDecimalInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

Deno.test("decimal useDecimalInt:false → number", () => {
  const t = roundTripTyped(
    [["x", [123.45]]],
    { x: f.decimal(10, 2) },
    { useDecimalInt: false },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// Date — useDate
// =============================================================================

Deno.test("dateDay default → number", () => {
  const t = roundTripTyped(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("dateDay useDate:true → Date", () => {
  const t = roundTripTyped(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
    { useDate: true },
  );
  assertInstanceOf(firstValue(t, "x"), Date);
});

Deno.test("dateDay useDate:false → number", () => {
  const t = roundTripTyped(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
    { useDate: false },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("dateMillisecond default → number", () => {
  const t = roundTripTyped(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateMillisecond() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("dateMillisecond useDate:true → Date", () => {
  const t = roundTripTyped(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateMillisecond() },
    { useDate: true },
  );
  assertInstanceOf(firstValue(t, "x"), Date);
});

// Date is NOT affected by useBigInt
Deno.test("dateDay useBigInt:true → still number (not bigint)", () => {
  const t = roundTripTyped(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// Time — bitWidth + useBigInt
// =============================================================================

Deno.test("timeSecond (32-bit) default → number", () => {
  const t = roundTripTyped(
    [["x", [3600]]],
    { x: f.timeSecond() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timeSecond (32-bit) useBigInt:true → still number", () => {
  const t = roundTripTyped(
    [["x", [3600]]],
    { x: f.timeSecond() },
    { useBigInt: true },
  );
  // 32-bit time should still be number even with useBigInt
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timeMicrosecond (64-bit) default → number", () => {
  const t = roundTripTyped(
    [["x", [3600000000n]]],
    { x: f.timeMicrosecond() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timeMicrosecond (64-bit) useBigInt:true → bigint", () => {
  const t = roundTripTyped(
    [["x", [3600000000n]]],
    { x: f.timeMicrosecond() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

Deno.test("timeNanosecond (64-bit) useBigInt:true → bigint", () => {
  const t = roundTripTyped(
    [["x", [3600000000000n]]],
    { x: f.timeNanosecond() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

// =============================================================================
// Timestamp — useDate
// =============================================================================

Deno.test("timestamp default → number", () => {
  const t = roundTripTyped(
    [["x", [Date.now()]]],
    { x: f.timestamp() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timestamp useDate:true → Date", () => {
  const t = roundTripTyped(
    [["x", [Date.now()]]],
    { x: f.timestamp() },
    { useDate: true },
  );
  assertInstanceOf(firstValue(t, "x"), Date);
});

Deno.test("timestamp useDate:false → number", () => {
  const t = roundTripTyped(
    [["x", [Date.now()]]],
    { x: f.timestamp() },
    { useDate: false },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timestamp with timezone useDate:true → Date", () => {
  const t = roundTripTyped(
    [["x", [Date.now()]]],
    { x: f.timestamp(undefined, "UTC") },
    { useDate: true },
  );
  assertInstanceOf(firstValue(t, "x"), Date);
});

// =============================================================================
// Duration — useBigInt
// =============================================================================

Deno.test("duration default → number", () => {
  const t = roundTripTyped(
    [["x", [1000n]]],
    { x: f.duration() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("duration useBigInt:true → bigint", () => {
  const t = roundTripTyped(
    [["x", [1000n]]],
    { x: f.duration() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

Deno.test("duration useBigInt:false → number", () => {
  const t = roundTripTyped(
    [["x", [1000n]]],
    { x: f.duration() },
    { useBigInt: false },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// Map — useMap
// =============================================================================

Deno.test("map default → Array of [key, value] pairs", () => {
  const t = roundTripTyped(
    [["x", [new Map([["a", 1], ["b", 2]])]]],
    { x: f.map(f.utf8(), f.int32()) },
  );
  const val = firstValue(t, "x");
  assertEquals(Array.isArray(val), true);
});

Deno.test("map useMap:true → Map", () => {
  const t = roundTripTyped(
    [["x", [new Map([["a", 1], ["b", 2]])]]],
    { x: f.map(f.utf8(), f.int32()) },
    { useMap: true },
  );
  assertInstanceOf(firstValue(t, "x"), Map);
});

Deno.test("map useMap:false → Array of pairs", () => {
  const t = roundTripTyped(
    [["x", [new Map([["a", 1], ["b", 2]])]]],
    { x: f.map(f.utf8(), f.int32()) },
    { useMap: false },
  );
  const val = firstValue(t, "x");
  assertEquals(Array.isArray(val), true);
});

// =============================================================================
// Dictionary — unwraps to inner type
// =============================================================================

Deno.test("dictionary(utf8) → string", () => {
  const t = roundTripTyped(
    [["x", ["hello", "world", "hello"]]],
    { x: f.dictionary(f.utf8()) },
  );
  assertEquals(typeof firstValue(t, "x"), "string");
  assertEquals(firstValue(t, "x"), "hello");
});

Deno.test("dictionary(int32) → number", () => {
  const t = roundTripTyped(
    [["x", [1, 2, 1, 3]]],
    { x: f.dictionary(f.int32()) },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

// =============================================================================
// List
// =============================================================================

Deno.test("list(int32) → Int32Array", () => {
  const t = roundTripTyped(
    [["x", [[1, 2, 3], [4, 5]]]],
    { x: f.list(f.int32()) },
  );
  const val = firstValue(t, "x");
  assertEquals(val instanceof Int32Array, true);
  assertEquals((val as Int32Array)[0], 1);
});

Deno.test("list(utf8) → Array<string>", () => {
  const t = roundTripTyped(
    [["x", [["a", "b"], ["c"]]]],
    { x: f.list(f.utf8()) },
  );
  const val = firstValue(t, "x");
  assertEquals(Array.isArray(val), true);
  assertEquals(typeof (val as string[])[0], "string");
});

Deno.test("list(int64) useBigInt:true → Array<bigint>", () => {
  const t = roundTripTyped(
    [["x", [[1n, 2n]]]],
    { x: f.list(f.int64()) },
    { useBigInt: true },
  );
  const val = firstValue(t, "x") as bigint[];
  assertEquals(typeof val[0], "bigint");
});

// =============================================================================
// Struct
// =============================================================================

Deno.test("struct → object with fields", () => {
  const t = roundTripTyped(
    [["x", [{ a: 1, b: "hello" }]]],
    { x: f.struct({ a: f.int32(), b: f.utf8() }) },
  );
  const val = firstValue(t, "x") as Record<string, unknown>;
  assertEquals(typeof val.a, "number");
  assertEquals(typeof val.b, "string");
});

Deno.test("struct propagates useBigInt", () => {
  const t = roundTripTyped(
    [["x", [{ a: 1n }]]],
    { x: f.struct({ a: f.int64() }) },
    { useBigInt: true },
  );
  const val = firstValue(t, "x") as Record<string, unknown>;
  assertEquals(typeof val.a, "bigint");
});

Deno.test("struct propagates useDate", () => {
  const t = roundTripTyped(
    [["x", [{ a: new Date("2024-01-01") }]]],
    { x: f.struct({ a: f.dateDay() }) },
    { useDate: true },
  );
  const val = firstValue(t, "x") as Record<string, unknown>;
  assertInstanceOf(val.a, Date);
});

Deno.test("nested struct → { inner: { val: number } }", () => {
  const t = roundTripTyped(
    [["x", [{ inner: { val: 42 } }]]],
    { x: f.struct({ inner: f.struct({ val: f.int32() }) }) },
  );
  const val = firstValue(t, "x") as Record<string, Record<string, unknown>>;
  assertEquals(val.inner.val, 42);
});

Deno.test("struct with list child → { vals: Int32Array }", () => {
  const t = roundTripTyped(
    [["x", [{ vals: [1, 2, 3] }]]],
    { x: f.struct({ vals: f.list(f.int32()) }) },
  );
  const val = firstValue(t, "x") as Record<string, unknown>;
  assertInstanceOf(val.vals, Int32Array);
});

Deno.test("list of structs → Array<{ a: number }>", () => {
  const t = roundTripTyped(
    [["x", [[{ a: 1 }, { a: 2 }]]]],
    { x: f.list(f.struct({ a: f.int32() })) },
  );
  const val = firstValue(t, "x") as Array<Record<string, unknown>>;
  assertEquals(Array.isArray(val), true);
  assertEquals(val[0].a, 1);
  assertEquals(val[1].a, 2);
});

Deno.test("list of list → Array<Int32Array>", () => {
  const t = roundTripTyped(
    [["x", [[[1, 2], [3]]]]],
    { x: f.list(f.list(f.int32())) },
  );
  const val = firstValue(t, "x") as Array<unknown>;
  assertEquals(Array.isArray(val), true);
  assertInstanceOf(val[0], Int32Array);
});

Deno.test("map key/value types are preserved", () => {
  const t = roundTripTyped(
    [["x", [new Map([["k", 1]])]]],
    { x: f.map(f.utf8(), f.int32()) },
  );
  const val = firstValue(t, "x") as Array<[string, number]>;
  assertEquals(val[0][0], "k");
  assertEquals(typeof val[0][1], "number");
});

Deno.test("empty table (0 rows)", () => {
  const t = roundTripTyped(
    [["x", []]],
    { x: f.int32() },
  );
  assertEquals(t.numRows, 0);
  assertEquals(t.toArray().length, 0);
});

// =============================================================================
// Null handling
// =============================================================================

Deno.test("nullable int32 → null for null values", () => {
  const t = roundTripTyped(
    [["x", [1, null, 3]]],
    { x: f.int32() },
  );
  assertEquals(t.getChild("x")!.at(1), null);
  assertEquals(typeof t.getChild("x")!.at(0), "number");
});

Deno.test("nullable utf8 → null for null values", () => {
  const t = roundTripTyped(
    [["x", ["hello", null, "world"]]],
    { x: f.utf8() },
  );
  assertEquals(t.getChild("x")!.at(1), null);
  assertEquals(typeof t.getChild("x")!.at(0), "string");
});

// =============================================================================
// toArray() type depends on nullCount, not schema nullable flag
// =============================================================================

Deno.test("int32 toArray: Int32Array when no nulls", () => {
  const t = roundTripTyped([["x", [1, 2, 3]]], { x: f.int32() });
  const arr = t.getChild("x")!.toArray();
  assertEquals(arr instanceof Int32Array, true);
});

Deno.test("int32 toArray: Array when nulls present", () => {
  const t = roundTripTyped([["x", [1, null, 3]]], { x: f.int32() });
  const arr = t.getChild("x")!.toArray();
  assertEquals(Array.isArray(arr), true);
});

Deno.test("float64 toArray: Float64Array when no nulls", () => {
  const t = roundTripTyped([["x", [1.1, 2.2]]], { x: f.float64() });
  const arr = t.getChild("x")!.toArray();
  assertEquals(arr instanceof Float64Array, true);
});

Deno.test("float64 toArray: Array when nulls present", () => {
  const t = roundTripTyped([["x", [1.1, null]]], { x: f.float64() });
  const arr = t.getChild("x")!.toArray();
  assertEquals(Array.isArray(arr), true);
});

Deno.test("int64 toArray: BigInt64Array when no nulls + useBigInt", () => {
  const t = roundTripTyped(
    [["x", [1n, 2n]]],
    { x: f.int64() },
    { useBigInt: true },
  );
  const arr = t.getChild("x")!.toArray();
  assertEquals(arr instanceof BigInt64Array, true);
});

Deno.test("int64 toArray: Array when nulls + useBigInt", () => {
  const t = roundTripTyped(
    [["x", [1n, null]]],
    { x: f.int64() },
    { useBigInt: true },
  );
  const arr = t.getChild("x")!.toArray();
  assertEquals(Array.isArray(arr), true);
});

Deno.test("nullable field with zero nulls still returns typed array", () => {
  // field.nullable=true but nullCount=0 → still get typed array
  const t = roundTripTyped([["x", [1, 2, 3]]], { x: f.int32() });
  assertEquals(t.schema.fields[0].nullable, true); // schema says nullable
  assertEquals(t.getChild("x")!.nullCount, 0); // but no actual nulls
  assertEquals(t.getChild("x")!.toArray() instanceof Int32Array, true);
});

// =============================================================================
// Interval — useDate
// =============================================================================

Deno.test("interval default → Float64Array (month-day-nano)", () => {
  // Default interval unit is MONTH_DAY_NANO, expects [months, days, nanos]
  const t = roundTripTyped(
    [["x", [[1, 15, 0n]]]],
    { x: f.interval() },
  );
  const val = firstValue(t, "x");
  assertEquals(val instanceof Float64Array, true);
});

// =============================================================================
// Float16
// =============================================================================

Deno.test("float16 → number", () => {
  const t = roundTripTyped([["x", [1.5, 2.5]]], { x: f.float16() });
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("float16 toArray: Float64Array", () => {
  const t = roundTripTyped([["x", [1.5, 2.5]]], { x: f.float16() });
  assertEquals(t.getChild("x")!.toArray() instanceof Float64Array, true);
});

Deno.test("float16 toArray: Array when nulls", () => {
  const t = roundTripTyped([["x", [1.5, null]]], { x: f.float16() });
  assertEquals(Array.isArray(t.getChild("x")!.toArray()), true);
});

// =============================================================================
// TimeMillisecond (32-bit, completes time coverage)
// =============================================================================

Deno.test("timeMillisecond (32-bit) default → number", () => {
  const t = roundTripTyped(
    [["x", [3600000]]],
    { x: f.timeMillisecond() },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timeMillisecond (32-bit) useBigInt:true → still number", () => {
  const t = roundTripTyped(
    [["x", [3600000]]],
    { x: f.timeMillisecond() },
    { useBigInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("timeMillisecond toArray: Int32Array", () => {
  const t = roundTripTyped([["x", [3600000]]], { x: f.timeMillisecond() });
  assertEquals(t.getChild("x")!.toArray() instanceof Int32Array, true);
});

// =============================================================================
// Decimal bit width variants
// =============================================================================

Deno.test("decimal32 default → number", () => {
  const t = roundTripTyped([["x", [1.5]]], { x: f.decimal(5, 2, 32) });
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("decimal64 default → number", () => {
  const t = roundTripTyped([["x", [1.5]]], { x: f.decimal(10, 2, 64) });
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("decimal128 default → number", () => {
  const t = roundTripTyped([["x", [1.5]]], { x: f.decimal(10, 2, 128) });
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("decimal256 default → number", () => {
  const t = roundTripTyped([["x", [1.5]]], { x: f.decimal(10, 2, 256) });
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("decimal32 useDecimalInt → number (32-bit stays number)", () => {
  const t = roundTripTyped(
    [["x", [1.5]]],
    { x: f.decimal(5, 2, 32) },
    { useDecimalInt: true },
  );
  // 32-bit decimal with useDecimalInt returns number, not bigint
  assertEquals(typeof firstValue(t, "x"), "number");
});

Deno.test("decimal64 useDecimalInt → bigint", () => {
  const t = roundTripTyped(
    [["x", [1.5]]],
    { x: f.decimal(10, 2, 64) },
    { useDecimalInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

Deno.test("decimal128 useDecimalInt → bigint", () => {
  const t = roundTripTyped(
    [["x", [1.5]]],
    { x: f.decimal(10, 2, 128) },
    { useDecimalInt: true },
  );
  assertEquals(typeof firstValue(t, "x"), "bigint");
});

Deno.test("decimal default toArray: Float64Array", () => {
  const t = roundTripTyped([["x", [1.5]]], { x: f.decimal(10, 2) });
  assertEquals(t.getChild("x")!.toArray() instanceof Float64Array, true);
});

Deno.test("decimal32 useDecimalInt toArray: Int32Array", () => {
  const t = roundTripTyped(
    [["x", [1.5]]],
    { x: f.decimal(5, 2, 32) },
    { useDecimalInt: true },
  );
  assertEquals(t.getChild("x")!.toArray() instanceof Int32Array, true);
});

Deno.test("decimal64 useDecimalInt toArray: Array (bigint)", () => {
  const t = roundTripTyped(
    [["x", [1.5]]],
    { x: f.decimal(10, 2, 64) },
    { useDecimalInt: true },
  );
  assertEquals(Array.isArray(t.getChild("x")!.toArray()), true);
});

// =============================================================================
// FixedSizeList
// =============================================================================

Deno.test("fixedSizeList(int32, 3) at(0) → Int32Array", () => {
  const t = roundTripTyped(
    [["x", [[1, 2, 3], [4, 5, 6]]]],
    { x: f.fixedSizeList(f.int32(), 3) },
  );
  assertInstanceOf(firstValue(t, "x"), Int32Array);
  assertEquals((firstValue(t, "x") as Int32Array).length, 3);
});

Deno.test("fixedSizeList(utf8, 2) at(0) → Array", () => {
  const t = roundTripTyped(
    [["x", [["a", "b"], ["c", "d"]]]],
    { x: f.fixedSizeList(f.utf8(), 2) },
  );
  assertEquals(Array.isArray(firstValue(t, "x")), true);
});

Deno.test("fixedSizeList toArray: always Array", () => {
  const t = roundTripTyped(
    [["x", [[1, 2], [3, 4]]]],
    { x: f.fixedSizeList(f.int32(), 2) },
  );
  assertEquals(Array.isArray(t.getChild("x")!.toArray()), true);
});

// =============================================================================
// LargeList
// =============================================================================

Deno.test("largeList(int32) at(0) → Int32Array", () => {
  const t = roundTripTyped(
    [["x", [[1, 2], [3]]]],
    { x: f.largeList(f.int32()) },
  );
  assertInstanceOf(firstValue(t, "x"), Int32Array);
});

Deno.test("largeList(utf8) at(0) → Array<string>", () => {
  const t = roundTripTyped(
    [["x", [["a", "b"]]]],
    { x: f.largeList(f.utf8()) },
  );
  assertEquals(Array.isArray(firstValue(t, "x")), true);
});

Deno.test("largeList toArray: always Array", () => {
  const t = roundTripTyped(
    [["x", [[1, 2]]]],
    { x: f.largeList(f.int32()) },
  );
  assertEquals(Array.isArray(t.getChild("x")!.toArray()), true);
});

// =============================================================================
// Uint toArray constructors
// =============================================================================

Deno.test("uint8 toArray: Uint8Array", () => {
  const t = roundTripTyped([["x", [1, 2]]], { x: f.uint8() });
  assertInstanceOf(t.getChild("x")!.toArray(), Uint8Array);
});

Deno.test("uint16 toArray: Uint16Array", () => {
  const t = roundTripTyped([["x", [1, 2]]], { x: f.uint16() });
  assertInstanceOf(t.getChild("x")!.toArray(), Uint16Array);
});

Deno.test("uint32 toArray: Uint32Array", () => {
  const t = roundTripTyped([["x", [1, 2]]], { x: f.uint32() });
  assertInstanceOf(t.getChild("x")!.toArray(), Uint32Array);
});

Deno.test("uint64 toArray: Float64Array (default)", () => {
  const t = roundTripTyped([["x", [1n, 2n]]], { x: f.uint64() });
  assertInstanceOf(t.getChild("x")!.toArray(), Float64Array);
});

Deno.test("uint64 toArray: BigUint64Array (useBigInt)", () => {
  const t = roundTripTyped(
    [["x", [1n, 2n]]],
    { x: f.uint64() },
    { useBigInt: true },
  );
  assertInstanceOf(t.getChild("x")!.toArray(), BigUint64Array);
});

Deno.test("uint32 toArray: Array when nulls present", () => {
  const t = roundTripTyped([["x", [1, null, 3]]], { x: f.uint32() });
  assertEquals(Array.isArray(t.getChild("x")!.toArray()), true);
});

// =============================================================================
// Timestamp/Duration toArray defaults
// =============================================================================

Deno.test("timestamp toArray: Float64Array (default)", () => {
  const t = roundTripTyped([["x", [Date.now()]]], { x: f.timestamp() });
  assertInstanceOf(t.getChild("x")!.toArray(), Float64Array);
});

Deno.test("timestamp toArray: Array (useDate)", () => {
  const t = roundTripTyped(
    [["x", [Date.now()]]],
    { x: f.timestamp() },
    { useDate: true },
  );
  assertEquals(Array.isArray(t.getChild("x")!.toArray()), true);
});

Deno.test("duration toArray: Float64Array (default)", () => {
  const t = roundTripTyped([["x", [1000n]]], { x: f.duration() });
  assertInstanceOf(t.getChild("x")!.toArray(), Float64Array);
});

Deno.test("duration toArray: BigInt64Array (useBigInt)", () => {
  const t = roundTripTyped(
    [["x", [1000n]]],
    { x: f.duration() },
    { useBigInt: true },
  );
  assertInstanceOf(t.getChild("x")!.toArray(), BigInt64Array);
});

// =============================================================================
// Time64 toArray defaults
// =============================================================================

Deno.test("timeMicrosecond toArray: Float64Array (default)", () => {
  const t = roundTripTyped(
    [["x", [3600000000n]]],
    { x: f.timeMicrosecond() },
  );
  assertInstanceOf(t.getChild("x")!.toArray(), Float64Array);
});

Deno.test("timeNanosecond toArray: Float64Array (default)", () => {
  const t = roundTripTyped(
    [["x", [3600000000000n]]],
    { x: f.timeNanosecond() },
  );
  assertInstanceOf(t.getChild("x")!.toArray(), Float64Array);
});

Deno.test("timeMicrosecond toArray: BigInt64Array (useBigInt)", () => {
  const t = roundTripTyped(
    [["x", [3600000000n]]],
    { x: f.timeMicrosecond() },
    { useBigInt: true },
  );
  assertInstanceOf(t.getChild("x")!.toArray(), BigInt64Array);
});

// =============================================================================
// Invalid IPC
// =============================================================================

Deno.test("invalid IPC bytes throw", () => {
  assertThrows(() => f.tableFromIPC(new Uint8Array([1, 2, 3, 4])));
});

// =============================================================================
// Table-level: toArray, toColumns, iterator
// =============================================================================

Deno.test("toArray returns array of row objects", () => {
  const t = roundTripTyped(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const rows = t.toArray();
  assertEquals(rows.length, 2);
  assertEquals(rows[0], { a: 1, b: "x" });
  assertEquals(rows[1], { a: 2, b: "y" });
});

Deno.test("toColumns returns name→array map", () => {
  const t = roundTripTyped(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const cols = t.toColumns();
  assertEquals(Array.from(cols.a), [1, 2]);
  assertEquals(Array.from(cols.b), ["x", "y"]);
});

Deno.test("iterator yields row objects", () => {
  const t = roundTripTyped(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const rows = Array.from(t);
  assertEquals(rows.length, 2);
  assertEquals(rows[0], { a: 1, b: "x" });
});

Deno.test("select returns subset table", () => {
  const t = roundTripTyped(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const s = t.select(["b", "c"]);
  assertEquals(s.numCols, 2);
  assertEquals(s.toArray()[0], { b: "x", c: true });
});

Deno.test("selectAt returns subset table by index", () => {
  const t = roundTripTyped(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const s = t.selectAt([0, 2]);
  assertEquals(s.numCols, 2);
  assertEquals(s.toArray()[0], { a: 1, c: true });
});

// =============================================================================
// Cross-cutting: multiple options at once
// =============================================================================

Deno.test("all options: int64 + date + decimal + map", () => {
  const t = roundTripTyped(
    [
      ["big", [42n]],
      ["day", [new Date("2024-01-01")]],
      ["amount", [99.99]],
      ["kv", [new Map([["k", 1]])]],
    ],
    {
      big: f.int64(),
      day: f.dateDay(),
      amount: f.decimal(10, 2),
      kv: f.map(f.utf8(), f.int32()),
    },
    { useBigInt: true, useDate: true, useDecimalInt: true, useMap: true },
  );
  assertEquals(typeof firstValue(t, "big"), "bigint");
  assertInstanceOf(firstValue(t, "day"), Date);
  assertEquals(typeof firstValue(t, "amount"), "bigint");
  assertInstanceOf(firstValue(t, "kv"), Map);
});

Deno.test("useBigInt doesn't affect dates, useDate doesn't affect ints", () => {
  const t = roundTripTyped(
    [
      ["day", [new Date("2024-01-01")]],
      ["big", [42n]],
    ],
    {
      day: f.dateDay(),
      big: f.int64(),
    },
    { useBigInt: true, useDate: false },
  );
  // Date column should still be number (useDate is false)
  assertEquals(typeof firstValue(t, "day"), "number");
  // Int64 should be bigint (useBigInt is true)
  assertEquals(typeof firstValue(t, "big"), "bigint");
});
