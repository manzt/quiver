/**
 * Runtime tests for the quiver builder API and schema validation.
 */

import { expect, test } from "vitest";
import * as f from "@uwdata/flechette";
import * as q from "../mod.ts";

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

test("int8() produces IntType with bitWidth=8, signed=true", () => {
  const s = q.int8();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(8);
  expect(s.match.signed).toBe(true);
});

test("int16() produces IntType with bitWidth=16, signed=true", () => {
  const s = q.int16();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(16);
  expect(s.match.signed).toBe(true);
});

test("int32() produces IntType with bitWidth=32, signed=true", () => {
  const s = q.int32();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(32);
  expect(s.match.signed).toBe(true);
});

test("int64() produces IntType with bitWidth=64, signed=true", () => {
  const s = q.int64();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(64);
  expect(s.match.signed).toBe(true);
});

test("uint8() produces IntType with bitWidth=8, signed=false", () => {
  const s = q.uint8();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(8);
  expect(s.match.signed).toBe(false);
});

test("uint16() produces IntType with bitWidth=16, signed=false", () => {
  const s = q.uint16();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(16);
  expect(s.match.signed).toBe(false);
});

test("uint32() produces IntType with bitWidth=32, signed=false", () => {
  const s = q.uint32();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(32);
  expect(s.match.signed).toBe(false);
});

test("uint64() produces IntType with bitWidth=64, signed=false", () => {
  const s = q.uint64();
  expect(s.match.typeId).toBe(2);
  expect(s.match.bitWidth).toBe(64);
  expect(s.match.signed).toBe(false);
});

test("float16() produces FloatType with precision=0", () => {
  const s = q.float16();
  expect(s.match.typeId).toBe(3);
  expect(s.match.precision).toBe(0);
});

test("float32() produces FloatType with precision=1", () => {
  const s = q.float32();
  expect(s.match.typeId).toBe(3);
  expect(s.match.precision).toBe(1);
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

test("dateDay() produces DateType with unit=0", () => {
  const s = q.dateDay();
  expect(s.match.typeId).toBe(8);
  expect(s.match.unit).toBe(0);
});

test("dateMillisecond() produces DateType with unit=1", () => {
  const s = q.dateMillisecond();
  expect(s.match.typeId).toBe(8);
  expect(s.match.unit).toBe(1);
});

test("timestamp() produces TimestampType", () => {
  expect(q.timestamp().match.typeId).toBe(10);
});

test("duration() produces DurationType", () => {
  expect(q.duration().match.typeId).toBe(18);
});

test("largeUtf8() produces LargeUtf8Type", () => {
  expect(q.largeUtf8().match.typeId).toBe(20);
});

test("binary() produces BinaryType", () => {
  expect(q.binary().match.typeId).toBe(4);
});

test("largeBinary() produces LargeBinaryType", () => {
  expect(q.largeBinary().match.typeId).toBe(19);
});

test("timeSecond() produces TimeType with bitWidth=32, unit=0", () => {
  const s = q.timeSecond();
  expect(s.match.typeId).toBe(9);
  expect(s.match.bitWidth).toBe(32);
  expect(s.match.unit).toBe(0);
});

test("timeMillisecond() produces TimeType with bitWidth=32, unit=1", () => {
  const s = q.timeMillisecond();
  expect(s.match.typeId).toBe(9);
  expect(s.match.bitWidth).toBe(32);
  expect(s.match.unit).toBe(1);
});

test("timeMicrosecond() produces TimeType with bitWidth=64, unit=2", () => {
  const s = q.timeMicrosecond();
  expect(s.match.typeId).toBe(9);
  expect(s.match.bitWidth).toBe(64);
  expect(s.match.unit).toBe(2);
});

test("timeNanosecond() produces TimeType with bitWidth=64, unit=3", () => {
  const s = q.timeNanosecond();
  expect(s.match.typeId).toBe(9);
  expect(s.match.bitWidth).toBe(64);
  expect(s.match.unit).toBe(3);
});

test("decimal128() produces DecimalType with bitWidth=128", () => {
  const s = q.decimal128(10, 2);
  expect(s.match.typeId).toBe(7);
  expect(s.match.precision).toBe(10);
  expect(s.match.scale).toBe(2);
  expect(s.match.bitWidth).toBe(128);
});

test("decimal() produces DecimalType (broad)", () => {
  const s = q.decimal(10, 2);
  expect(s.match.typeId).toBe(7);
  expect(s.match.precision).toBe(10);
  expect(s.match.scale).toBe(2);
});

test("interval() produces IntervalType", () => {
  expect(q.interval().match.typeId).toBe(11);
});

test("fixedSizeBinary() produces FixedSizeBinaryType", () => {
  const s = q.fixedSizeBinary(16);
  expect(s.match.typeId).toBe(15);
  expect(s.match.stride).toBe(16);
});

test("fixedSizeList() produces FixedSizeListType", () => {
  const s = q.fixedSizeList(q.int32(), 3);
  expect(s.match.typeId).toBe(16);
  expect(s.match.stride).toBe(3);
});

test("largeList() produces LargeListType", () => {
  expect(q.largeList(q.int32()).match.typeId).toBe(21);
});

test("nullType() produces NullType", () => {
  expect(q.nullType().match.typeId).toBe(1);
});

test("q.time() accepts timeSecond column", () => {
  const ipc = toIPC([["x", [3600]]], { x: f.timeSecond() });
  const table = q.table({ x: q.time() }).parseIPC(ipc);
  expect(table.numRows).toBe(1);
});

test("q.time() accepts timeNanosecond column", () => {
  const ipc = toIPC([["x", [3600000000000n]]], { x: f.timeNanosecond() });
  const table = q.table({ x: q.time() }).parseIPC(ipc);
  expect(table.numRows).toBe(1);
});

test("q.time() rejects int32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.time() }).parseIPC(ipc)).toThrow();
});

// =============================================================================
// 2. Nullable chaining
// =============================================================================

test(".nullable() preserves the match criteria", () => {
  const base = q.int32();
  const n = base.nullable();
  expect(n.match.typeId).toBe(base.match.typeId);
  expect(n.match.bitWidth).toBe(base.match.bitWidth);
  expect(n.match.signed).toBe(base.match.signed);
});

test(".nullable() returns a new object", () => {
  const s = q.utf8();
  const n = s.nullable();
  expect(s !== n as unknown).toBe(true);
});

// =============================================================================
// 3. Schema assertion — happy path
// =============================================================================

test("parseIPC succeeds when schema matches exactly", () => {
  const ipc = toIPC([["x", [1, 2, 3]]], { x: f.int32() });
  const table = q.table({ x: q.int32() }).parseIPC(ipc);
  expect(table.numRows).toBe(3);
  expect(table.numCols).toBe(1);
});

test("parseIPC succeeds with multiple columns", () => {
  const ipc = toIPC(
    [["a", [1, 2]], ["b", ["x", "y"]], ["c", [true, false]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const table = q.table({ a: q.int32(), b: q.utf8(), c: q.bool() }).parseIPC(
    ipc,
  );
  expect(table.numCols).toBe(3);
});

test("parseIPC succeeds with nullable field containing nulls", () => {
  const ipc = toIPC([["x", [1, null, 3]]], { x: f.int32() });
  const table = q.table({ x: q.int32().nullable() }).parseIPC(ipc);
  expect(table.numRows).toBe(3);
});

test("parseIPC succeeds with nested list type", () => {
  const ipc = toIPC([["x", [[1, 2], [3]]]], { x: f.list(f.int32()) });
  const table = q.table({ x: q.list(q.int32()) }).parseIPC(ipc);
  expect(table.numRows).toBe(2);
});

test("parseIPC succeeds with dictionary-encoded column", () => {
  const ipc = toIPC(
    [["x", ["a", "b", "a", "c"]]],
    { x: f.dictionary(f.utf8()) },
  );
  const table = q.table({ x: q.dictionary(q.utf8()) }).parseIPC(ipc);
  expect(table.numRows).toBe(4);
});

test("parseIPC succeeds with struct type", () => {
  const ipc = toIPC(
    [["x", [{ a: 1, b: "hello" }]]],
    { x: f.struct({ a: f.int32(), b: f.utf8() }) },
  );
  const table = q
    .table({ x: q.struct({ a: q.int32(), b: q.utf8() }) })
    .parseIPC(ipc);
  expect(table.numRows).toBe(1);
});

// =============================================================================
// 4. Schema assertion — type mismatches (should throw)
// =============================================================================

test("parseIPC throws when column is int32 but schema says utf8", () => {
  const ipc = toIPC([["x", [1, 2]]], { x: f.int32() });
  expect(() => q.table({ x: q.utf8() }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when column is int32 but schema says int64", () => {
  const ipc = toIPC([["x", [1, 2]]], { x: f.int32() });
  expect(() => q.table({ x: q.int64() }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when column is float32 but schema says float64", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float32() });
  expect(() => q.table({ x: q.float64() }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when column is signed but schema says unsigned", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.uint32() }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when column is dateDay but schema says dateMillisecond", () => {
  const ipc = toIPC(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  expect(() => q.table({ x: q.dateMillisecond() }).parseIPC(ipc)).toThrow();
});

// =============================================================================
// 5. Schema assertion — name mismatches
// =============================================================================

test("parseIPC throws when column name doesn't match", () => {
  const ipc = toIPC([["x", [1, 2]]], { x: f.int32() });
  expect(() => q.table({ y: q.int32() }).parseIPC(ipc)).toThrow();
});

test("record form: allows extra columns (partial schema)", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  const table = q.table({ a: q.int32() }).parseIPC(ipc);
  expect(table.numRows).toBe(1);
});

test("record form: still throws when declared column is missing", () => {
  const ipc = toIPC([["a", [1]]], { a: f.int32() });
  expect(() => q.table({ a: q.int32(), b: q.utf8() }).parseIPC(ipc)).toThrow();
});

test("tuple form: throws when table has extra columns", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  expect(() => q.table([["a", q.int32()]]).parseIPC(ipc)).toThrow();
});

test("tuple form: throws when table is missing columns", () => {
  const ipc = toIPC([["a", [1]]], { a: f.int32() });
  expect(() => q.table([["a", q.int32()], ["b", q.utf8()]]).parseIPC(ipc))
    .toThrow();
});

// =============================================================================
// 6. Broad types — should accept any matching variant
// =============================================================================

test("q.int() accepts int8 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int8() });
  expect(q.table({ x: q.int() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.int() accepts int64 column", () => {
  const ipc = toIPC([["x", [1n]]], { x: f.int64() });
  expect(q.table({ x: q.int() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.int() accepts uint32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.uint32() });
  expect(q.table({ x: q.int() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.int() rejects float64 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  expect(() => q.table({ x: q.int() }).parseIPC(ipc)).toThrow();
});

test("q.string() accepts utf8 column", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.utf8() });
  expect(q.table({ x: q.string() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.string() accepts largeUtf8 column", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.largeUtf8() });
  expect(q.table({ x: q.string() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.string() rejects int32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  expect(() => q.table({ x: q.string() }).parseIPC(ipc)).toThrow();
});

test("q.float() accepts float32 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float32() });
  expect(q.table({ x: q.float() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.float() accepts float64 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  expect(q.table({ x: q.float() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.date() accepts dateDay column", () => {
  const ipc = toIPC(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateDay() },
  );
  expect(q.table({ x: q.date() }).parseIPC(ipc).numRows).toBe(1);
});

test("q.date() accepts dateMillisecond column", () => {
  const ipc = toIPC(
    [["x", [new Date("2024-01-01")]]],
    { x: f.dateMillisecond() },
  );
  expect(q.table({ x: q.date() }).parseIPC(ipc).numRows).toBe(1);
});

// =============================================================================
// 7. either — accept any of these
// =============================================================================

test("either([int32(), float64()]) accepts int32 column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  expect(
    q.table({ x: q.either([q.int32(), q.float64()]) }).parseIPC(ipc).numRows,
  ).toBe(1);
});

test("either([int32(), float64()]) accepts float64 column", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  expect(
    q.table({ x: q.either([q.int32(), q.float64()]) }).parseIPC(ipc).numRows,
  ).toBe(1);
});

test("either([int32(), float64()]) rejects utf8 column", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.utf8() });
  expect(() => q.table({ x: q.either([q.int32(), q.float64()]) }).parseIPC(ipc))
    .toThrow();
});

// =============================================================================
// 8. Schema validation edge cases
// =============================================================================

test("parseIPC throws when time bitWidth mismatches", () => {
  const ipc = toIPC([["x", [3600]]], { x: f.timeSecond() });
  expect(() => q.table({ x: q.timeMicrosecond() }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when decimal precision mismatches", () => {
  const ipc = toIPC([["x", [1.5]]], { x: f.decimal(10, 2) });
  expect(() => q.table({ x: q.decimal(5, 3) }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when list child type mismatches", () => {
  const ipc = toIPC([["x", [[1, 2]]]], { x: f.list(f.int32()) });
  expect(() => q.table({ x: q.list(q.utf8()) }).parseIPC(ipc)).toThrow();
});

test("parseIPC throws when list vs struct", () => {
  const ipc = toIPC([["x", [[1, 2]]]], { x: f.list(f.int32()) });
  expect(() => q.table({ x: q.struct({ a: q.int32() }) }).parseIPC(ipc))
    .toThrow();
});

test("either([int(), string()]) with broad types accepts int8", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int8() });
  expect(
    q.table({ x: q.either([q.int(), q.string()]) }).parseIPC(ipc).numRows,
  ).toBe(1);
});

test("either([int(), string()]) with broad types accepts largeUtf8", () => {
  const ipc = toIPC([["x", ["hi"]]], { x: f.largeUtf8() });
  expect(
    q.table({ x: q.either([q.int(), q.string()]) }).parseIPC(ipc).numRows,
  ).toBe(1);
});

test("either([int(), string()]) rejects float64", () => {
  const ipc = toIPC([["x", [1.0]]], { x: f.float64() });
  expect(() => q.table({ x: q.either([q.int(), q.string()]) }).parseIPC(ipc))
    .toThrow();
});

test("dictionary with non-string value type", () => {
  const ipc = toIPC([["x", [1, 2, 1, 3]]], { x: f.dictionary(f.int32()) });
  expect(q.table({ x: q.dictionary(q.int32()) }).parseIPC(ipc).numRows).toBe(
    4,
  );
});

test("dictionary value type mismatch throws", () => {
  const ipc = toIPC(
    [["x", ["a", "b", "a"]]],
    { x: f.dictionary(f.utf8()) },
  );
  expect(() => q.table({ x: q.dictionary(q.int32()) }).parseIPC(ipc)).toThrow();
});

test("QuiverError: type mismatch has path and expected/received", () => {
  const ipc = toIPC([["myCol", [1]]], { myCol: f.int32() });
  try {
    q.table({ myCol: q.utf8() }).parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as q.QuiverError;
    expect(err.issues.length).toBe(1);
    expect(err.issues[0].code).toBe("type-mismatch");
    expect(err.issues[0].path).toEqual(["myCol"]);
    expect(err.issues[0].expected).toBe("Utf8");
    expect(err.issues[0].received).toBe("Int(32, signed)");
  }
});

test("QuiverError: column count mismatch (tuple form)", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", [2]]],
    { a: f.int32(), b: f.int32() },
  );
  try {
    q.table([["a", q.int32()]]).parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as q.QuiverError;
    const countIssue = err.issues.find((i) => i.code === "column-count");
    expect(countIssue?.path).toEqual([]);
    expect(countIssue?.expected).toBe("1");
    expect(countIssue?.received).toBe("2");
  }
});

test("QuiverError: missing column", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  try {
    q.table({ y: q.int32() }).parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as q.QuiverError;
    const missing = err.issues.find((i) => i.code === "column-missing");
    expect(missing?.path).toEqual(["y"]);
  }
});

test("QuiverError: nested struct field mismatch has deep path", () => {
  const ipc = toIPC(
    [["meta", [{ key: 1 }]]],
    { meta: f.struct({ key: f.int32() }) },
  );
  try {
    q.table({ meta: q.struct({ key: q.utf8() }) }).parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const err = e as q.QuiverError;
    expect(err.issues[0].path).toEqual(["meta", "key"]);
    expect(err.issues[0].code).toBe("type-mismatch");
  }
});

test("QuiverError: flatten() matches zod shape", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", ["x"]]],
    { a: f.int32(), b: f.utf8() },
  );
  try {
    q.table({ a: q.utf8(), b: q.int32() }).parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    const flat = (e as q.QuiverError).flatten();
    expect(flat.formErrors.length).toBe(0);
    expect("a" in flat.fieldErrors).toBe(true);
    expect("b" in flat.fieldErrors).toBe(true);
    expect(flat.fieldErrors["a"].length).toBe(1);
    expect(flat.fieldErrors["b"].length).toBe(1);
  }
});

test("QuiverError: collects multiple issues at once", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  try {
    q.table({ a: q.utf8(), b: q.int32(), c: q.float64() }).parseIPC(ipc);
    throw new Error("should have thrown");
  } catch (e) {
    expect(e).toBeInstanceOf(q.QuiverError);
    expect((e as q.QuiverError).issues.length).toBe(3);
  }
});

test("invalid IPC bytes throw", () => {
  expect(() => q.table({ x: q.int32() }).parseIPC(new Uint8Array([1, 2, 3, 4])))
    .toThrow();
});

// =============================================================================
// 9. End-to-end: verify returned table works correctly
// =============================================================================

test("parsed table .toArray() returns correct values", () => {
  const ipc = toIPC(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const table = q.table({ a: q.int32(), b: q.utf8() }).parseIPC(ipc);
  expect(table.toArray()).toEqual([{ a: 1, b: "x" }, { a: 2, b: "y" }]);
});

test("parsed table .getChild() returns correct column", () => {
  const ipc = toIPC(
    [["a", [10, 20]], ["b", ["hello", "world"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const table = q.table({ a: q.int32(), b: q.utf8() }).parseIPC(ipc);
  expect(table.getChild("a").at(0)).toBe(10);
  expect(table.getChild("b").at(1)).toBe("world");
});

test("parsed table .select() returns subset", () => {
  const ipc = toIPC(
    [["a", [1]], ["b", ["x"]], ["c", [true]]],
    { a: f.int32(), b: f.utf8(), c: f.bool() },
  );
  const table = q
    .table({ a: q.int32(), b: q.utf8(), c: q.bool() })
    .parseIPC(ipc);
  const sub = table.select(["b", "c"]);
  expect(sub.numCols).toBe(2);
  expect(sub.toArray()).toEqual([{ b: "x", c: true }]);
});

test("parsed table with options propagates useDate", () => {
  const ipc = toIPC(
    [["d", [new Date("2024-01-01")]]],
    { d: f.dateDay() },
  );
  const table = q.table({ d: q.dateDay() }, { useDate: true }).parseIPC(ipc);
  expect(table.at(0).d).toBeInstanceOf(Date);
});

test("parsed table with options propagates useBigInt", () => {
  const ipc = toIPC([["x", [42n]]], { x: f.int64() });
  const table = q.table({ x: q.int64() }, { useBigInt: true }).parseIPC(ipc);
  expect(typeof table.at(0).x).toBe("bigint");
});

// =============================================================================
// 10. Tuple form — ordered fields
// =============================================================================

test("tuple form: parseIPC succeeds with matching schema", () => {
  const ipc = toIPC(
    [["a", [1, 2]], ["b", ["x", "y"]]],
    { a: f.int32(), b: f.utf8() },
  );
  const table = q.table([["a", q.int32()], ["b", q.utf8()]]).parseIPC(ipc);
  expect(table.numCols).toBe(2);
  expect(table.toArray()).toEqual([{ a: 1, b: "x" }, { a: 2, b: "y" }]);
});

test("tuple form: parseIPC throws on type mismatch", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  expect(() => q.table([["x", q.utf8()]]).parseIPC(ipc)).toThrow();
});

test("tuple form: parseIPC throws on name mismatch", () => {
  const ipc = toIPC([["x", [1]]], { x: f.int32() });
  expect(() => q.table([["y", q.int32()]]).parseIPC(ipc)).toThrow();
});

test("tuple form: supports nullable", () => {
  const ipc = toIPC([["x", [1, null, 3]]], { x: f.int32() });
  const table = q.table([["x", q.int32().nullable()]]).parseIPC(ipc);
  expect(table.numRows).toBe(3);
});
