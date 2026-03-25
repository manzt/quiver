/**
 * Runtime tests for the quiver builder API and schema validation.
 *
 * These tests define the runtime contract. They should all FAIL initially
 * because the builders and assertSchema don't exist yet.
 */

import { assertEquals, assertInstanceOf, assertThrows } from "@std/assert";
import * as f from "@uwdata/flechette";
import * as q from "../src/mod.ts";

/** Build a table, encode to IPC, return bytes. */
function toIPC(
  data: [string, unknown[]][],
  types: Record<string, f.DataType>,
): Uint8Array {
  const table = f.tableFromArrays(data, { types });
  const ipc = f.tableToIPC(table, { format: "stream" });
  if (!ipc) throw new Error("tableToIPC returned null");
  return ipc;
}

// =============================================================================
// 1. Builder tests — verify builders produce correct flechette DataTypes
// =============================================================================

Deno.test("int8() produces IntType with bitWidth=8, signed=true", () => {
  const s = q.int8();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 8);
  assertEquals(s.match.signed, true);
});

Deno.test("int16() produces IntType with bitWidth=16, signed=true", () => {
  const s = q.int16();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 16);
  assertEquals(s.match.signed, true);
});

Deno.test("int32() produces IntType with bitWidth=32, signed=true", () => {
  const s = q.int32();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 32);
  assertEquals(s.match.signed, true);
});

Deno.test("int64() produces IntType with bitWidth=64, signed=true", () => {
  const s = q.int64();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 64);
  assertEquals(s.match.signed, true);
});

Deno.test("uint8() produces IntType with bitWidth=8, signed=false", () => {
  const s = q.uint8();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 8);
  assertEquals(s.match.signed, false);
});

Deno.test("uint16() produces IntType with bitWidth=16, signed=false", () => {
  const s = q.uint16();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 16);
  assertEquals(s.match.signed, false);
});

Deno.test("uint32() produces IntType with bitWidth=32, signed=false", () => {
  const s = q.uint32();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 32);
  assertEquals(s.match.signed, false);
});

Deno.test("uint64() produces IntType with bitWidth=64, signed=false", () => {
  const s = q.uint64();
  assertEquals(s.match.typeId, 2);
  assertEquals(s.match.bitWidth, 64);
  assertEquals(s.match.signed, false);
});

Deno.test("float16() produces FloatType with precision=0", () => {
  const s = q.float16();
  assertEquals(s.match.typeId, 3);
  assertEquals(s.match.precision, 0);
});

Deno.test("float32() produces FloatType with precision=1", () => {
  const s = q.float32();
  assertEquals(s.match.typeId, 3);
  assertEquals(s.match.precision, 1);
});

Deno.test("float64() produces FloatType with precision=2", () => {
  const s = q.float64();
  assertEquals(s.match.typeId, 3);
  assertEquals(s.match.precision, 2);
});

Deno.test("utf8() produces Utf8Type", () => {
  const s = q.utf8();
  assertEquals(s.match.typeId, 5);
});

Deno.test("bool() produces BoolType", () => {
  const s = q.bool();
  assertEquals(s.match.typeId, 6);
});

Deno.test("dateDay() produces DateType with unit=0", () => {
  const s = q.dateDay();
  assertEquals(s.match.typeId, 8);
  assertEquals(s.match.unit, 0);
});

Deno.test("dateMillisecond() produces DateType with unit=1", () => {
  const s = q.dateMillisecond();
  assertEquals(s.match.typeId, 8);
  assertEquals(s.match.unit, 1);
});

Deno.test("timestamp() produces TimestampType", () => {
  const s = q.timestamp();
  assertEquals(s.match.typeId, 10);
});

Deno.test("duration() produces DurationType", () => {
  const s = q.duration();
  assertEquals(s.match.typeId, 18);
});

Deno.test("largeUtf8() produces LargeUtf8Type", () => {
  const s = q.largeUtf8();
  assertEquals(s.match.typeId, 20);
});

Deno.test("binary() produces BinaryType", () => {
  const s = q.binary();
  assertEquals(s.match.typeId, 4);
});

Deno.test("largeBinary() produces LargeBinaryType", () => {
  const s = q.largeBinary();
  assertEquals(s.match.typeId, 19);
});

Deno.test("timeSecond() produces TimeType with bitWidth=32, unit=0", () => {
  const s = q.timeSecond();
  assertEquals(s.match.typeId, 9);
  assertEquals(s.match.bitWidth, 32);
  assertEquals(s.match.unit, 0);
});

Deno.test("timeMillisecond() produces TimeType with bitWidth=32, unit=1", () => {
  const s = q.timeMillisecond();
  assertEquals(s.match.typeId, 9);
  assertEquals(s.match.bitWidth, 32);
  assertEquals(s.match.unit, 1);
});

Deno.test("timeMicrosecond() produces TimeType with bitWidth=64, unit=2", () => {
  const s = q.timeMicrosecond();
  assertEquals(s.match.typeId, 9);
  assertEquals(s.match.bitWidth, 64);
  assertEquals(s.match.unit, 2);
});

Deno.test("timeNanosecond() produces TimeType with bitWidth=64, unit=3", () => {
  const s = q.timeNanosecond();
  assertEquals(s.match.typeId, 9);
  assertEquals(s.match.bitWidth, 64);
  assertEquals(s.match.unit, 3);
});

Deno.test("decimal128() produces DecimalType with bitWidth=128", () => {
  const s = q.decimal128(10, 2);
  assertEquals(s.match.typeId, 7);
  assertEquals(s.match.precision, 10);
  assertEquals(s.match.scale, 2);
  assertEquals(s.match.bitWidth, 128);
});

Deno.test("decimal() produces DecimalType (broad)", () => {
  const s = q.decimal(10, 2);
  assertEquals(s.match.typeId, 7);
  assertEquals(s.match.precision, 10);
  assertEquals(s.match.scale, 2);
});

Deno.test("interval() produces IntervalType", () => {
  const s = q.interval();
  assertEquals(s.match.typeId, 11);
});

Deno.test("fixedSizeBinary() produces FixedSizeBinaryType", () => {
  const s = q.fixedSizeBinary(16);
  assertEquals(s.match.typeId, 15);
  assertEquals(s.match.stride, 16);
});

Deno.test("fixedSizeList() produces FixedSizeListType", () => {
  const s = q.fixedSizeList(q.int32(), 3);
  assertEquals(s.match.typeId, 16);
  assertEquals(s.match.stride, 3);
});

Deno.test("largeList() produces LargeListType", () => {
  const s = q.largeList(q.int32());
  assertEquals(s.match.typeId, 21);
});

Deno.test("nullType() produces NullType", () => {
  const s = q.nullType();
  assertEquals(s.match.typeId, 1);
});

Deno.test("q.time() accepts timeSecond column", () => {
  const ipc = toIPC([["x", [3600]]], { x: f.timeSecond() });
  const schema = q.table({ x: q.time() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.time() accepts timeNanosecond column", () => {
  const ipc = toIPC([["x", [3600000000000n]]], { x: f.timeNanosecond() });
  const schema = q.table({ x: q.time() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.time() rejects int32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table({ x: q.time() });
  assertThrows(() => schema.parseIPC(ipc));
});

// =============================================================================
// 2. Nullable chaining
// =============================================================================

Deno.test(".nullable() preserves the match criteria", () => {
  const base = q.int32();
  const n = base.nullable();
  assertEquals(n.match.typeId, base.match.typeId);
  assertEquals(n.match.bitWidth, base.match.bitWidth);
  assertEquals(n.match.signed, base.match.signed);
});

Deno.test(".nullable() returns a new object", () => {
  const s = q.utf8();
  const n = s.nullable();
  assertEquals(s !== n as unknown, true);
});

// =============================================================================
// 3. Schema assertion — happy path
// =============================================================================

Deno.test("parseIPC succeeds when schema matches exactly", () => {
  const ipc = toIPC(
    [["x", [1, 2, 3]]],
    { x: f.int32() },
  );
  const schema = q.table({ x: q.int32() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 3);
  assertEquals(table.numCols, 1);
});

Deno.test("parseIPC succeeds with multiple columns", () => {
  const ipc = toIPC(
    [["a", [1, 2]], ["b", ["x", "y"]], ["c", [true, false]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const schema = q.table({
    a: q.int32(),
    b: q.utf8(),
    c: q.bool(),
  });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numCols, 3);
});

Deno.test("parseIPC succeeds with nullable field containing nulls", () => {
  const ipc = toIPC(
    [["x", [1, null, 3]]],
    { x: f.int32() },
  );
  const schema = q.table({ x: q.int32().nullable() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 3);
});

Deno.test("parseIPC succeeds with nested list type", () => {
  const ipc = toIPC(
    [["x", [[1, 2], [3]]]],
    { x: f.list(f.int32()) },
  );
  const schema = q.table({ x: q.list(q.int32()) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 2);
});

Deno.test("parseIPC succeeds with dictionary-encoded column", () => {
  const ipc = toIPC(
    [["x", ["a", "b", "a", "c"]]],
    { x: f.dictionary(f.utf8()) },
  );
  const schema = q.table({ x: q.dictionary(q.utf8()) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 4);
});

Deno.test("parseIPC succeeds with struct type", () => {
  const ipc = toIPC(
    [["x", [{ a: 1, b: "hello" }]]],
    { x: f.struct({ a: f.int32(), b: f.utf8() }) },
  );
  const schema = q.table({
    x: q.struct({ a: q.int32(), b: q.utf8() }),
  });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

// =============================================================================
// 4. Schema assertion — type mismatches (should throw)
// =============================================================================

Deno.test("parseIPC throws when column is int32 but schema says utf8", () => {
  const ipc = toIPC([["x", [1, 2]]], { x: f.int32() });
  const schema = q.table({ x: q.utf8() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when column is int32 but schema says int64", () => {
  const ipc = toIPC([["x", [1, 2]]], { x: f.int32() });
  const schema = q.table({ x: q.int64() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when column is float32 but schema says float64", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float32() });
  const schema = q.table({ x: q.float64() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when column is signed but schema says unsigned", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table({ x: q.uint32() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when column is dateDay but schema says dateMillisecond", () => {
  const ipc = toIPC(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  const schema = q.table({ x: q.dateMillisecond() });
  assertThrows(() => schema.parseIPC(ipc));
});

// =============================================================================
// 5. Schema assertion — name mismatches
// =============================================================================

Deno.test("parseIPC throws when column name doesn't match", () => {
  const ipc = toIPC([["x", [1, 2]]], { x: f.int32() });
  const schema = q.table({ y: q.int32() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("record form: allows extra columns (partial schema)", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  const schema = q.table({ a: q.int32() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("record form: still throws when declared column is missing", () => {
  const ipc = toIPC([["a", [1]]], { a: f.int32() });
  const schema = q.table({ a: q.int32(), b: q.utf8() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("tuple form: throws when table has extra columns", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  const schema = q.table([["a", q.int32()]]);
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("tuple form: throws when table is missing columns", () => {
  const ipc = toIPC([["a", [1]]], { a: f.int32() });
  const schema = q.table([["a", q.int32()], ["b", q.utf8()]]);
  assertThrows(() => schema.parseIPC(ipc));
});

// =============================================================================
// 6. Broad types — should accept any matching variant
// =============================================================================

Deno.test("q.int() accepts int8 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int8() });
  const schema = q.table({ x: q.int() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.int() accepts int64 column", () => {
  const ipc = toIPC([["x", [1n]]], { x: f.int64() });
  const schema = q.table({ x: q.int() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.int() accepts uint32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.uint32() });
  const schema = q.table({ x: q.int() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.int() rejects float64 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  const schema = q.table({ x: q.int() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("q.string() accepts utf8 column", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.utf8() });
  const schema = q.table({ x: q.string() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.string() accepts largeUtf8 column", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.largeUtf8() });
  const schema = q.table({ x: q.string() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.string() rejects int32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table({ x: q.string() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("q.float() accepts float32 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float32() });
  const schema = q.table({ x: q.float() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.float() accepts float64 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  const schema = q.table({ x: q.float() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.date() accepts dateDay column", () => {
  const ipc = toIPC(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  const schema = q.table({ x: q.date() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("q.date() accepts dateMillisecond column", () => {
  const ipc = toIPC(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateMillisecond() },
  );
  const schema = q.table({ x: q.date() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

// =============================================================================
// 7. of — schema-level "accept any of these"
// =============================================================================

Deno.test("either([int32(), float64()]) accepts int32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table({ x: q.either([q.int32(), q.float64()]) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("either([int32(), float64()]) accepts float64 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  const schema = q.table({ x: q.either([q.int32(), q.float64()]) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("either([int32(), float64()]) rejects utf8 column", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.utf8() });
  const schema = q.table({ x: q.either([q.int32(), q.float64()]) });
  assertThrows(() => schema.parseIPC(ipc));
});

// =============================================================================
// 8. Schema validation edge cases
// =============================================================================

Deno.test("parseIPC throws when time bitWidth mismatches", () => {
  const ipc = toIPC([["x", [3600]]], { x: f.timeSecond() });
  // timeSecond is 32-bit, timeMicrosecond is 64-bit
  const schema = q.table({ x: q.timeMicrosecond() });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when decimal precision mismatches", () => {
  const ipc = toIPC([["x", [1.5]]], { x: f.decimal(10, 2) });
  const schema = q.table({ x: q.decimal(5, 3) });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when list child type mismatches", () => {
  const ipc = toIPC([["x", [[1, 2]]]], { x: f.list(f.int32()) });
  const schema = q.table({ x: q.list(q.utf8()) });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("parseIPC throws when list vs struct", () => {
  const ipc = toIPC([["x", [[1, 2]]]], { x: f.list(f.int32()) });
  const schema = q.table({ x: q.struct({ a: q.int32() }) });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("of([int(), string()]) with broad types accepts int8", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int8() });
  const schema = q.table({ x: q.either([q.int(), q.string()]) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("of([int(), string()]) with broad types accepts largeUtf8", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.largeUtf8() });
  const schema = q.table({ x: q.either([q.int(), q.string()]) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 1);
});

Deno.test("of([int(), string()]) rejects float64", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  const schema = q.table({ x: q.either([q.int(), q.string()]) });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("dictionary with non-string value type", () => {
  const ipc = toIPC([["x", [1, 2, 1, 3]]], { x: f.dictionary(f.int32()) });
  const schema = q.table({ x: q.dictionary(q.int32()) });
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 4);
});

Deno.test("dictionary value type mismatch throws", () => {
  const ipc = toIPC(
    [["x", ["a", "b", "a"]]],
    { x: f.dictionary(f.utf8()) },
  );
  const schema = q.table({ x: q.dictionary(q.int32()) });
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("QuiverError: type mismatch has path and expected/received", () => {
  const ipc = toIPC([["myCol", [1]]], { myCol: f.int32() });
  const schema = q.table({ myCol: q.utf8() });
  try {
    schema.parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    assertInstanceOf(e, q.QuiverError);
    assertEquals(e.issues.length, 1);
    assertEquals(e.issues[0].code, "type-mismatch");
    assertEquals(e.issues[0].path, ["myCol"]);
    assertEquals(e.issues[0].expected, "Utf8");
    assertEquals(e.issues[0].received, "Int(32, signed)");
  }
});

Deno.test("QuiverError: column count mismatch (tuple form)", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  const schema = q.table([["a", q.int32()]]);
  try {
    schema.parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    assertInstanceOf(e, q.QuiverError);
    const countIssue = e.issues.find((i: q.QuiverIssue) =>
      i.code === "column-count"
    );
    assertEquals(countIssue?.path, []);
    assertEquals(countIssue?.expected, "1");
    assertEquals(countIssue?.received, "2");
  }
});

Deno.test("QuiverError: missing column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table({ y: q.int32() });
  try {
    schema.parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    assertInstanceOf(e, q.QuiverError);
    const missing = e.issues.find((i: q.QuiverIssue) =>
      i.code === "column-missing"
    );
    assertEquals(missing?.path, ["y"]);
  }
});

Deno.test("QuiverError: nested struct field mismatch has deep path", () => {
  const ipc = toIPC(
    [["meta", [{ key: 1 }]]],
    { meta: f.struct({ key: f.int32() }) },
  );
  const schema = q.table({ meta: q.struct({ key: q.utf8() }) });
  try {
    schema.parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    assertInstanceOf(e, q.QuiverError);
    assertEquals(e.issues[0].path, ["meta", "key"]);
    assertEquals(e.issues[0].code, "type-mismatch");
  }
});

Deno.test("QuiverError: flatten() matches zod shape", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", ["x"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const schema = q.table({ a: q.utf8(), b: q.int32() });
  try {
    schema.parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    assertInstanceOf(e, q.QuiverError);
    const flat = e.flatten();
    assertEquals(flat.formErrors.length, 0);
    assertEquals("a" in flat.fieldErrors, true);
    assertEquals("b" in flat.fieldErrors, true);
    assertEquals(flat.fieldErrors["a"].length, 1);
    assertEquals(flat.fieldErrors["b"].length, 1);
  }
});

Deno.test("QuiverError: collects multiple issues at once", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const schema = q.table({ a: q.utf8(), b: q.int32(), c: q.float64() });
  try {
    schema.parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    assertInstanceOf(e, q.QuiverError);
    assertEquals(e.issues.length, 3);
  }
});

Deno.test("invalid IPC bytes throw", () => {
  const schema = q.table({ x: q.int32() });
  assertThrows(() => schema.parseIPC(new Uint8Array([1, 2, 3, 4])));
});

// =============================================================================
// 9. End-to-end: verify returned table works correctly
// =============================================================================

Deno.test("parsed table .toArray() returns correct values", () => {
  const ipc = toIPC(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const schema = q.table({ a: q.int32(), b: q.utf8() });
  const table = schema.parseIPC(ipc);
  const rows = table.toArray();
  assertEquals(rows, [{ a: 1, b: "x" }, { a: 2, b: "y" }]);
});

Deno.test("parsed table .getChild() returns correct column", () => {
  const ipc = toIPC(
    [["a", [10, 20]], ["b", ["hello", "world"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const schema = q.table({ a: q.int32(), b: q.utf8() });
  const table = schema.parseIPC(ipc);
  assertEquals(table.getChild("a").at(0), 10);
  assertEquals(table.getChild("b").at(1), "world");
});

Deno.test("parsed table .select() returns subset", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const schema = q.table({ a: q.int32(), b: q.utf8(), c: q.bool() });
  const table = schema.parseIPC(ipc);
  const sub = table.select(["b", "c"]);
  assertEquals(sub.numCols, 2);
  assertEquals(sub.toArray(), [{ b: "x", c: true }]);
});

Deno.test("parsed table with options propagates useDate", () => {
  const ipc = toIPC(
    [["d", [new Date("2024-01-01")]]],
    { d: f.dateDay() },
  );
  const schema = q.table({ d: q.dateDay() }, { useDate: true });
  const table = schema.parseIPC(ipc);
  const row = table.at(0);
  assertEquals(row.d instanceof Date, true);
});

Deno.test("parsed table with options propagates useBigInt", () => {
  const ipc = toIPC(
    [["x", [42n]]],
    { x: f.int64() },
  );
  const schema = q.table({ x: q.int64() }, { useBigInt: true });
  const table = schema.parseIPC(ipc);
  assertEquals(typeof table.at(0).x, "bigint");
});

// =============================================================================
// 9. Tuple form — ordered fields
// =============================================================================

Deno.test("tuple form: parseIPC succeeds with matching schema", () => {
  const ipc = toIPC(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const schema = q.table([
    ["a", q.int32()],
    ["b", q.utf8()],
  ]);
  const table = schema.parseIPC(ipc);
  assertEquals(table.numCols, 2);
  assertEquals(table.toArray(), [{ a: 1, b: "x" }, { a: 2, b: "y" }]);
});

Deno.test("tuple form: parseIPC throws on type mismatch", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table([["x", q.utf8()]]);
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("tuple form: parseIPC throws on name mismatch", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  const schema = q.table([["y", q.int32()]]);
  assertThrows(() => schema.parseIPC(ipc));
});

Deno.test("tuple form: supports nullable", () => {
  const ipc = toIPC([["x", [1, null, 3]]], { x: f.int32() });
  const schema = q.table([["x", q.int32().nullable()]]);
  const table = schema.parseIPC(ipc);
  assertEquals(table.numRows, 3);
});
