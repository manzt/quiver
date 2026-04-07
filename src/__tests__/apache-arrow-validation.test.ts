/**
 * Runtime tests for the apache-arrow entry point.
 *
 * Uses flechette to create IPC bytes (known-good Arrow IPC), then parses
 * with apache-arrow and validates with quiver.
 */

import { expect, test } from "vitest";
import * as f from "@uwdata/flechette";
import * as arrow from "apache-arrow";
import * as q from "../apache-arrow/mod.ts";

/** Build a table via flechette, encode to IPC, parse with apache-arrow. */
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
// 1. Builder tests — same as flechette (shared DSL)
// =============================================================================

test("int8() produces IntType with bitWidth=8, signed=true", () => {
  const s = q.int8();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(8);
  expect(s.match.signed).toBe(true);
});

test("int32() produces IntType with bitWidth=32, signed=true", () => {
  const s = q.int32();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(32);
  expect(s.match.signed).toBe(true);
});

test("uint64() produces IntType with bitWidth=64, signed=false", () => {
  const s = q.uint64();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(64);
  expect(s.match.signed).toBe(false);
});

test("float64() produces FloatType with precision=2", () => {
  const s = q.float64();
  expect(s.match.typeId).toBe(3);
  expect(s.match.precision).toBe(2);
});

test("utf8() produces Utf8Type", () => {
  expect(q.utf8().match.typeId).toBe(5);
});

test("bool() produces BoolType", () => {
  expect(q.bool().match.typeId).toBe(6);
});

// =============================================================================
// 2. Schema validation — happy path
// =============================================================================

test("parse succeeds when schema matches exactly", () => {
  const table = makeTable([["x", [1, 2, 3]]], { x: f.int32() });
  const s = q.table({ x: q.int32() });
  const result = s.parse(table);
  expect(result.numRows).toBe(3);
});

test("parse succeeds with multiple columns", () => {
  const table = makeTable(
    [["a", [1, 2]], ["b", ["x", "y"]], ["c", [true, false]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const s = q.table({ a: q.int32(), b: q.utf8(), c: q.bool() });
  const result = s.parse(table);
  expect(result.numCols).toBe(3);
});

test("parse succeeds with nullable field containing nulls", () => {
  const table = makeTable([["x", [1, null, 3]]], { x: f.int32() });
  const s = q.table({ x: q.int32().nullable() });
  const result = s.parse(table);
  expect(result.numRows).toBe(3);
});

test("parse succeeds with nested list type", () => {
  const table = makeTable([["x", [[1, 2], [3]]]], { x: f.list(f.int32()) });
  const s = q.table({ x: q.list(q.int32()) });
  const result = s.parse(table);
  expect(result.numRows).toBe(2);
});

test("parse succeeds with dictionary-encoded column", () => {
  const table = makeTable(
    [["x", ["a", "b", "a", "c"]]],
    { x: f.dictionary(f.utf8()) },
  );
  const s = q.table({ x: q.dictionary(q.utf8()) });
  const result = s.parse(table);
  expect(result.numRows).toBe(4);
});

test("parse succeeds with struct type", () => {
  const table = makeTable(
    [["x", [{ a: 1, b: "hello" }]]],
    { x: f.struct({ a: f.int32(), b: f.utf8() }) },
  );
  const s = q.table({ x: q.struct({ a: q.int32(), b: q.utf8() }) });
  const result = s.parse(table);
  expect(result.numRows).toBe(1);
});

// =============================================================================
// 3. Schema validation — type mismatches (should throw)
// =============================================================================

test("parse throws when column is int32 but schema says utf8", () => {
  const table = makeTable([["x", [1, 2]]], { x: f.int32() });
  const s = q.table({ x: q.utf8() });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when column is int32 but schema says int64", () => {
  const table = makeTable([["x", [1, 2]]], { x: f.int32() });
  const s = q.table({ x: q.int64() });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when column is float32 but schema says float64", () => {
  const table = makeTable([["x", [1.0]]], { x: f.float32() });
  const s = q.table({ x: q.float64() });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when column is signed but schema says unsigned", () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  const s = q.table({ x: q.uint32() });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when column is dateDay but schema says dateMillisecond", () => {
  const table = makeTable(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  const s = q.table({ x: q.dateMillisecond() });
  expect(() => s.parse(table)).toThrow();
});

// =============================================================================
// 4. Schema validation — name mismatches
// =============================================================================

test("parse throws when column name doesn't match", () => {
  const table = makeTable([["x", [1, 2]]], { x: f.int32() });
  const s = q.table({ y: q.int32() });
  expect(() => s.parse(table)).toThrow();
});

test("record form: allows extra columns (partial schema)", () => {
  const table = makeTable(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  const s = q.table({ a: q.int32() });
  const result = s.parse(table);
  expect(result.numRows).toBe(1);
});

test("record form: still throws when declared column is missing", () => {
  const table = makeTable([["a", [1]]], { a: f.int32() });
  const s = q.table({ a: q.int32(), b: q.utf8() });
  expect(() => s.parse(table)).toThrow();
});

// =============================================================================
// 5. Broad types — should accept any matching variant
// =============================================================================

test("q.int() accepts int8 column", () => {
  const table = makeTable([["x", [1]]], { x: f.int8() });
  expect(q.table({ x: q.int() }).parse(table).numRows).toBe(1);
});

test("q.int() accepts int64 column", () => {
  const table = makeTable([["x", [1n]]], { x: f.int64() });
  expect(q.table({ x: q.int() }).parse(table).numRows).toBe(1);
});

test("q.int() accepts uint32 column", () => {
  const table = makeTable([["x", [1]]], { x: f.uint32() });
  expect(q.table({ x: q.int() }).parse(table).numRows).toBe(1);
});

test("q.int() rejects float64 column", () => {
  const table = makeTable([["x", [1.0]]], { x: f.float64() });
  expect(() => q.table({ x: q.int() }).parse(table)).toThrow();
});

test("q.string() accepts utf8 column", () => {
  const table = makeTable([["x", ["hi"]]], { x: f.utf8() });
  expect(q.table({ x: q.string() }).parse(table).numRows).toBe(1);
});

test("q.string() accepts largeUtf8 column", () => {
  const table = makeTable([["x", ["hi"]]], { x: f.largeUtf8() });
  expect(q.table({ x: q.string() }).parse(table).numRows).toBe(1);
});

test("q.string() rejects int32 column", () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.string() }).parse(table)).toThrow();
});

test("q.float() accepts float32 column", () => {
  const table = makeTable([["x", [1.0]]], { x: f.float32() });
  expect(q.table({ x: q.float() }).parse(table).numRows).toBe(1);
});

test("q.float() accepts float64 column", () => {
  const table = makeTable([["x", [1.0]]], { x: f.float64() });
  expect(q.table({ x: q.float() }).parse(table).numRows).toBe(1);
});

test("q.date() accepts dateDay column", () => {
  const table = makeTable(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  expect(q.table({ x: q.date() }).parse(table).numRows).toBe(1);
});

test("q.date() accepts dateMillisecond column", () => {
  const table = makeTable(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateMillisecond() },
  );
  expect(q.table({ x: q.date() }).parse(table).numRows).toBe(1);
});

test("q.time() accepts timeSecond column", () => {
  const table = makeTable([["x", [3600]]], { x: f.timeSecond() });
  expect(q.table({ x: q.time() }).parse(table).numRows).toBe(1);
});

test("q.time() accepts timeNanosecond column", () => {
  const table = makeTable(
    [["x", [3600000000000n]]],
    { x: f.timeNanosecond() },
  );
  expect(q.table({ x: q.time() }).parse(table).numRows).toBe(1);
});

test("q.time() rejects int32 column", () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.time() }).parse(table)).toThrow();
});

// =============================================================================
// 5b. JS-type builders — q.like("type")
// =============================================================================

test('q.like("number") accepts int32 column', () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(q.table({ x: q.like("number") }).parse(table).numRows).toBe(1);
});

test('q.like("number") accepts float64 column', () => {
  const table = makeTable([["x", [1.0]]], { x: f.float64() });
  expect(q.table({ x: q.like("number") }).parse(table).numRows).toBe(1);
});

test('q.like("number") rejects utf8 column', () => {
  const table = makeTable([["x", ["hi"]]], { x: f.utf8() });
  expect(() => q.table({ x: q.like("number") }).parse(table)).toThrow();
});

test('q.like("bigint") accepts int64 column', () => {
  const table = makeTable([["x", [1n]]], { x: f.int64() });
  expect(q.table({ x: q.like("bigint") }).parse(table).numRows).toBe(1);
});

test('q.like("bigint") accepts uint64 column', () => {
  const table = makeTable([["x", [1n]]], { x: f.uint64() });
  expect(q.table({ x: q.like("bigint") }).parse(table).numRows).toBe(1);
});

test('q.like("bigint") rejects int32 column', () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.like("bigint") }).parse(table)).toThrow();
});

test('q.like("string") accepts utf8 column', () => {
  const table = makeTable([["x", ["hi"]]], { x: f.utf8() });
  expect(q.table({ x: q.like("string") }).parse(table).numRows).toBe(1);
});

test('q.like("string") accepts largeUtf8 column', () => {
  const table = makeTable([["x", ["hi"]]], { x: f.largeUtf8() });
  expect(q.table({ x: q.like("string") }).parse(table).numRows).toBe(1);
});

test('q.like("string") rejects int32 column', () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.like("string") }).parse(table)).toThrow();
});

test('q.like("boolean") accepts bool column', () => {
  const table = makeTable([["x", [true]]], { x: f.bool() });
  expect(q.table({ x: q.like("boolean") }).parse(table).numRows).toBe(1);
});

test('q.like("boolean") rejects int32 column', () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.like("boolean") }).parse(table)).toThrow();
});

test('q.like("bytes") accepts binary column', () => {
  const table = makeTable([["x", [new Uint8Array([1])]]], { x: f.binary() });
  expect(q.table({ x: q.like("bytes") }).parse(table).numRows).toBe(1);
});

test('q.like("bytes") accepts fixedSizeBinary column', () => {
  const table = makeTable([["x", [new Uint8Array([1, 2])]]], {
    x: f.fixedSizeBinary(2),
  });
  expect(q.table({ x: q.like("bytes") }).parse(table).numRows).toBe(1);
});

test('q.like("bytes") rejects utf8 column', () => {
  const table = makeTable([["x", ["hi"]]], { x: f.utf8() });
  expect(() => q.table({ x: q.like("bytes") }).parse(table)).toThrow();
});

test('q.like("date") accepts dateDay column', () => {
  const table = makeTable([["x", [new Date("2024-01-01")]]], {
    x: f.dateDay(),
  });
  expect(q.table({ x: q.like("date") }).parse(table).numRows).toBe(1);
});

test('q.like("date") accepts timestamp column', () => {
  const table = makeTable([["x", [1000000]]], { x: f.timestamp() });
  expect(q.table({ x: q.like("date") }).parse(table).numRows).toBe(1);
});

test('q.like("date") rejects int32 column', () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.like("date") }).parse(table)).toThrow();
});

// =============================================================================
// 6. either — accept any of these
// =============================================================================

test("oneOf([int32(), float64()]) accepts int32 column", () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  const s = q.table({ x: q.oneOf([q.int32(), q.float64()]) });
  expect(s.parse(table).numRows).toBe(1);
});

test("oneOf([int32(), float64()]) accepts float64 column", () => {
  const table = makeTable([["x", [1.0]]], { x: f.float64() });
  const s = q.table({ x: q.oneOf([q.int32(), q.float64()]) });
  expect(s.parse(table).numRows).toBe(1);
});

test("oneOf([int32(), float64()]) rejects utf8 column", () => {
  const table = makeTable([["x", ["hi"]]], { x: f.utf8() });
  const s = q.table({ x: q.oneOf([q.int32(), q.float64()]) });
  expect(() => s.parse(table)).toThrow();
});

test("oneOf([int(), string()]) with broad types accepts int8", () => {
  const table = makeTable([["x", [1]]], { x: f.int8() });
  const s = q.table({ x: q.oneOf([q.int(), q.string()]) });
  expect(s.parse(table).numRows).toBe(1);
});

test("oneOf([int(), string()]) with broad types accepts largeUtf8", () => {
  const table = makeTable([["x", ["hi"]]], { x: f.largeUtf8() });
  const s = q.table({ x: q.oneOf([q.int(), q.string()]) });
  expect(s.parse(table).numRows).toBe(1);
});

test("oneOf([int(), string()]) rejects float64", () => {
  const table = makeTable([["x", [1.0]]], { x: f.float64() });
  const s = q.table({ x: q.oneOf([q.int(), q.string()]) });
  expect(() => s.parse(table)).toThrow();
});

// =============================================================================
// 7. Schema validation edge cases
// =============================================================================

test("parse throws when time bitWidth mismatches", () => {
  const table = makeTable([["x", [3600]]], { x: f.timeSecond() });
  const s = q.table({ x: q.timeMicrosecond() });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when decimal precision mismatches", () => {
  const table = makeTable([["x", [1.5]]], { x: f.decimal(10, 2) });
  const s = q.table({ x: q.decimal(5, 3) });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when list child type mismatches", () => {
  const table = makeTable([["x", [[1, 2]]]], { x: f.list(f.int32()) });
  const s = q.table({ x: q.list(q.utf8()) });
  expect(() => s.parse(table)).toThrow();
});

test("parse throws when list vs struct", () => {
  const table = makeTable([["x", [[1, 2]]]], { x: f.list(f.int32()) });
  const s = q.table({ x: q.struct({ a: q.int32() }) });
  expect(() => s.parse(table)).toThrow();
});

test("dictionary with non-string value type", () => {
  const table = makeTable(
    [["x", [1, 2, 1, 3]]],
    { x: f.dictionary(f.int32()) },
  );
  const s = q.table({ x: q.dictionary(q.int32()) });
  expect(s.parse(table).numRows).toBe(4);
});

test("dictionary value type mismatch throws", () => {
  const table = makeTable(
    [["x", ["a", "b", "a"]]],
    { x: f.dictionary(f.utf8()) },
  );
  const s = q.table({ x: q.dictionary(q.int32()) });
  expect(() => s.parse(table)).toThrow();
});

// =============================================================================
// 8. QuiverError shape
// =============================================================================

test("QuiverError: type mismatch has path and expected/received", () => {
  const table = makeTable([["myCol", [1]]], { myCol: f.int32() });
  try {
    q.table({ myCol: q.utf8() }).parse(table);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as InstanceType<typeof q.QuiverError>;
    expect(err.issues.length).toBe(1);
    expect(err.issues[0].code).toBe("type-mismatch");
    expect(err.issues[0].path).toEqual(["myCol"]);
    expect(err.issues[0].expected).toBe("Utf8");
    expect(err.issues[0].received).toBe("Int(32, signed)");
  }
});

test("QuiverError: missing column", () => {
  const table = makeTable([["x", [1]]], { x: f.int32() });
  try {
    q.table({ y: q.int32() }).parse(table);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as InstanceType<typeof q.QuiverError>;
    const missing = err.issues.find((i) => i.code === "column-missing");
    expect(missing?.path).toEqual(["y"]);
  }
});

test("QuiverError: nested struct field mismatch has deep path", () => {
  const table = makeTable(
    [["meta", [{ key: 1 }]]],
    { meta: f.struct({ key: f.int32() }) },
  );
  try {
    q.table({ meta: q.struct({ key: q.utf8() }) }).parse(table);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as InstanceType<typeof q.QuiverError>;
    expect(err.issues[0].path).toEqual(["meta", "key"]);
    expect(err.issues[0].code).toBe("type-mismatch");
  }
});

test("QuiverError: flatten() matches zod shape", () => {
  const table = makeTable(
    [["a", [1]], ["b", ["x"]]],
    { a: f.int32(), b: f.utf8() },
  );
  try {
    q.table({ a: q.utf8(), b: q.int32() }).parse(table);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const flat = (e as InstanceType<typeof q.QuiverError>).flatten();
    expect(flat.formErrors.length).toBe(0);
    expect("a" in flat.fieldErrors).toBe(true);
    expect("b" in flat.fieldErrors).toBe(true);
  }
});

test("QuiverError: collects multiple issues at once", () => {
  const table = makeTable(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  try {
    q.table({ a: q.utf8(), b: q.int32(), c: q.float64() }).parse(table);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    expect((e as InstanceType<typeof q.QuiverError>).issues.length).toBe(3);
  }
});

// =============================================================================
// 9. End-to-end: verify returned table works correctly
// =============================================================================

test("parsed table row access works", () => {
  const table = makeTable(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const s = q.table({ a: q.int32(), b: q.utf8() });
  const result = s.parse(table);
  const row = result.get(0);
  expect(row?.a).toBe(1);
  expect(row?.b).toBe("x");
});

test("parsed table .getChild() returns correct column", () => {
  const table = makeTable(
    [["a", [10, 20]], ["b", ["hello", "world"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const s = q.table({ a: q.int32(), b: q.utf8() });
  const result = s.parse(table);
  expect(result.getChild("a")?.get(0)).toBe(10);
  expect(result.getChild("b")?.get(1)).toBe("world");
});
