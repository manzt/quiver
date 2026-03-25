/**
 * Exhaustive type + runtime tests for every builder × option combination.
 *
 * Each test:
 *   - Creates a single-value, single-column table
 *   - Checks 3 type snapshots: Column, toArray(), at(0) via //^?
 *   - Checks 2 runtime snapshots: toArray(), at(0) via toMatchInlineSnapshot
 *
 * Type snapshots: scripts/snap.ts
 * Runtime snapshots: vitest toMatchInlineSnapshot
 */

import { describe, expect, test } from "vitest";
import * as f from "@uwdata/flechette";
import * as q from "../src/mod.ts";

function ipc(data: unknown[], type: f.DataType): Uint8Array {
	const t = f.tableFromArrays([["a", data]], { types: { a: type } });
	const bytes = f.tableToIPC(t, { format: "stream" });
	if (!bytes) throw new Error("tableToIPC returned null");
	return bytes;
}

// =============================================================================
// Integers — signed
// =============================================================================

describe("int8", () => {
	const t = q.table({ a: q.int8() }).parseIPC(ipc([1], f.int8()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<8, true>, {}, false>
	const arr = col.toArray();
	//    ^? Int8Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Int8Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("int16", () => {
	const t = q.table({ a: q.int16() }).parseIPC(ipc([1], f.int16()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<16, true>, {}, false>
	const arr = col.toArray();
	//    ^? Int16Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Int16Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("int32", () => {
	const t = q.table({ a: q.int32() }).parseIPC(ipc([1], f.int32()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<32, true>, {}, false>
	const arr = col.toArray();
	//    ^? Int32Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Int32Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("int64", () => {
	const t = q.table({ a: q.int64() }).parseIPC(ipc([1n], f.int64()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<64, true>, {}, false>
	const arr = col.toArray();
	//    ^? Float64Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Float64Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("int64 + useBigInt", () => {
	const t = q.table({ a: q.int64() }, { useBigInt: true }).parseIPC(
		ipc([1n], f.int64()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<IntType<64, true>, { readonly useBigInt: true; }, false>
	const arr = col.toArray();
	//    ^? BigInt64Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? bigint
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		BigInt64Array {
		  "0": 1n,
		}
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1n`));
});

// =============================================================================
// Integers — unsigned
// =============================================================================

describe("uint8", () => {
	const t = q.table({ a: q.uint8() }).parseIPC(ipc([1], f.uint8()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<8, false>, {}, false>
	const arr = col.toArray();
	//    ^? Uint8Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Uint8Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("uint16", () => {
	const t = q.table({ a: q.uint16() }).parseIPC(ipc([1], f.uint16()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<16, false>, {}, false>
	const arr = col.toArray();
	//    ^? Uint16Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Uint16Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("uint32", () => {
	const t = q.table({ a: q.uint32() }).parseIPC(ipc([1], f.uint32()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<32, false>, {}, false>
	const arr = col.toArray();
	//    ^? Uint32Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Uint32Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("uint64", () => {
	const t = q.table({ a: q.uint64() }).parseIPC(ipc([1n], f.uint64()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<64, false>, {}, false>
	const arr = col.toArray();
	//    ^? Float64Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Float64Array [
		  1,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("uint64 + useBigInt", () => {
	const t = q.table({ a: q.uint64() }, { useBigInt: true }).parseIPC(
		ipc([1n], f.uint64()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<IntType<64, false>, { readonly useBigInt: true; }, false>
	const arr = col.toArray();
	//    ^? BigUint64Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? bigint
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		BigUint64Array {
		  "0": 1n,
		}
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1n`));
});

// =============================================================================
// Floats
// =============================================================================

describe("float16", () => {
	const t = q.table({ a: q.float16() }).parseIPC(ipc([1.5], f.float16()));
	const col = t.getChild("a");
	//    ^? q.Column<FloatType<0>, {}, false>
	const arr = col.toArray();
	//    ^? Float64Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Float64Array [
		  1.5,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1.5`));
});

describe("float32", () => {
	const t = q.table({ a: q.float32() }).parseIPC(ipc([1.5], f.float32()));
	const col = t.getChild("a");
	//    ^? q.Column<FloatType<1>, {}, false>
	const arr = col.toArray();
	//    ^? Float32Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Float32Array [
		  1.5,
		]
	`));
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("float64", () => {
	const t = q.table({ a: q.float64() }).parseIPC(ipc([1.5], f.float64()));
	const col = t.getChild("a");
	//    ^? q.Column<FloatType<2>, {}, false>
	const arr = col.toArray();
	//    ^? Float64Array<ArrayBufferLike>
	const val = col.at(0);
	//    ^? number
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		Float64Array [
		  1.5,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1.5`));
});

// =============================================================================
// Strings
// =============================================================================

describe("utf8", () => {
	const t = q.table({ a: q.utf8() }).parseIPC(ipc(["hi"], f.utf8()));
	const col = t.getChild("a");
	//    ^? q.Column<f.Utf8Type, {}, false>
	const arr = col.toArray();
	//    ^? string[]
	const val = col.at(0);
	//    ^? string
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		[
		  "hi",
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`"hi"`));
});

describe("largeUtf8", () => {
	const t = q.table({ a: q.largeUtf8() }).parseIPC(
		ipc(["hi"], f.largeUtf8()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<f.LargeUtf8Type, {}, false>
	const arr = col.toArray();
	//    ^? string[]
	const val = col.at(0);
	//    ^? string
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		[
		  "hi",
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`"hi"`));
});

// =============================================================================
// Bool
// =============================================================================

describe("bool", () => {
	const t = q.table({ a: q.bool() }).parseIPC(ipc([true], f.bool()));
	const col = t.getChild("a");
	//    ^? q.Column<f.BoolType, {}, false>
	const arr = col.toArray();
	//    ^? boolean[]
	const val = col.at(0);
	//    ^? boolean
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		[
		  true,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`true`));
});

// =============================================================================
// Binary
// =============================================================================

describe("binary", () => {
	const t = q.table({ a: q.binary() }).parseIPC(
		ipc([new Uint8Array([1, 2])], f.binary()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<f.BinaryType, {}, false>
	const val = col.at(0);
	//    ^? Uint8Array<ArrayBufferLike>
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`
		Uint8Array [
		  1,
		  2,
		]
	`));
});

describe("fixedSizeBinary", () => {
	const t = q.table({ a: q.fixedSizeBinary(4) }).parseIPC(
		ipc([new Uint8Array([1, 2, 3, 4])], f.fixedSizeBinary(4)),
	);
	const col = t.getChild("a");
	//    ^? q.Column<f.FixedSizeBinaryType, {}, false>
	const val = col.at(0);
	//    ^? Uint8Array<ArrayBufferLike>
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`
		Uint8Array [
		  1,
		  2,
		  3,
		  4,
		]
	`));
});

// =============================================================================
// Date
// =============================================================================

describe("dateDay", () => {
	const t = q.table({ a: q.dateDay() }).parseIPC(
		ipc([new Date("2024-01-01")], f.dateDay()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DateType<0>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("dateDay + useDate", () => {
	const t = q.table({ a: q.dateDay() }, { useDate: true }).parseIPC(
		ipc([new Date("2024-01-01")], f.dateDay()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DateType<0>, { readonly useDate: true; }, false>
	const val = col.at(0);
	//    ^? Date
	test("at(0)", () => expect(val instanceof Date).toMatchInlineSnapshot(`true`));
});

describe("dateMillisecond + useDate", () => {
	const t = q.table({ a: q.dateMillisecond() }, { useDate: true }).parseIPC(
		ipc([new Date("2024-01-01")], f.dateMillisecond()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DateType<1>, { readonly useDate: true; }, false>
	const val = col.at(0);
	//    ^? Date
	test("at(0)", () => expect(val instanceof Date).toMatchInlineSnapshot(`true`));
});

// =============================================================================
// Time
// =============================================================================

describe("timeSecond", () => {
	const t = q.table({ a: q.timeSecond() }).parseIPC(
		ipc([3600], f.timeSecond()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<TimeType<32, f.TimeUnit_>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`3600`));
});

describe("timeMicrosecond + useBigInt", () => {
	const t = q
		.table({ a: q.timeMicrosecond() }, { useBigInt: true })
		.parseIPC(ipc([3600000000n], f.timeMicrosecond()));
	const col = t.getChild("a");
	//    ^? q.Column<TimeType<64, f.TimeUnit_>, { readonly useBigInt: true; }, false>
	const val = col.at(0);
	//    ^? bigint
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`3600000000n`));
});

// =============================================================================
// Timestamp
// =============================================================================

describe("timestamp", () => {
	const t = q.table({ a: q.timestamp() }).parseIPC(
		ipc([1000000], f.timestamp()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<TimestampType<f.TimeUnit_, string | null>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("timestamp + useDate", () => {
	const t = q.table({ a: q.timestamp() }, { useDate: true }).parseIPC(
		ipc([1000000], f.timestamp()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<TimestampType<f.TimeUnit_, string | null>, { readonly useDate: true; }, false>
	const val = col.at(0);
	//    ^? Date
	test("at(0)", () => expect(val instanceof Date).toMatchInlineSnapshot(`true`));
});

// =============================================================================
// Duration
// =============================================================================

describe("duration", () => {
	const t = q.table({ a: q.duration() }).parseIPC(
		ipc([1000n], f.duration()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DurationType<f.TimeUnit_>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("duration + useBigInt", () => {
	const t = q.table({ a: q.duration() }, { useBigInt: true }).parseIPC(
		ipc([1000n], f.duration()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DurationType<f.TimeUnit_>, { readonly useBigInt: true; }, false>
	const val = col.at(0);
	//    ^? bigint
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"bigint"`));
});

// =============================================================================
// Decimal
// =============================================================================

describe("decimal128", () => {
	const t = q.table({ a: q.decimal128(10, 2) }).parseIPC(
		ipc([1.5], f.decimal(10, 2, 128)),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DecimalType<128>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("decimal128 + useDecimalInt", () => {
	const t = q
		.table({ a: q.decimal128(10, 2) }, { useDecimalInt: true })
		.parseIPC(ipc([1.5], f.decimal(10, 2, 128)));
	const col = t.getChild("a");
	//    ^? q.Column<DecimalType<128>, { readonly useDecimalInt: true; }, false>
	const val = col.at(0);
	//    ^? bigint
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"bigint"`));
});

describe("decimal32 + useDecimalInt", () => {
	const t = q
		.table({ a: q.decimal32(5, 2) }, { useDecimalInt: true })
		.parseIPC(ipc([1.5], f.decimal(5, 2, 32)));
	const col = t.getChild("a");
	//    ^? q.Column<DecimalType<32>, { readonly useDecimalInt: true; }, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

// =============================================================================
// Dictionary
// =============================================================================

describe("dictionary(utf8)", () => {
	const t = q.table({ a: q.dictionary(q.utf8()) }).parseIPC(
		ipc(["a", "b", "a"], f.dictionary(f.utf8())),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DictionaryType<f.Utf8Type>, {}, false>
	const val = col.at(0);
	//    ^? string
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`"a"`));
});

describe("dictionary(int32)", () => {
	const t = q.table({ a: q.dictionary(q.int32()) }).parseIPC(
		ipc([1, 2, 1], f.dictionary(f.int32())),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DictionaryType<IntType<32, true>>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

// =============================================================================
// List
// =============================================================================

describe("list(int32)", () => {
	const t = q.table({ a: q.list(q.int32()) }).parseIPC(
		ipc([[1, 2]], f.list(f.int32())),
	);
	const col = t.getChild("a");
	//    ^? q.Column<ListType<q.Field<string, IntType<32, true>>>, {}, false>
	const val = col.at(0);
	//    ^? Int32Array<ArrayBufferLike>
	test("at(0)", () =>
		expect(val?.constructor.name).toMatchInlineSnapshot(`"Int32Array"`));
});

describe("list(utf8)", () => {
	const t = q.table({ a: q.list(q.utf8()) }).parseIPC(
		ipc([["a", "b"]], f.list(f.utf8())),
	);
	const col = t.getChild("a");
	//    ^? q.Column<ListType<q.Field<string, f.Utf8Type>>, {}, false>
	const val = col.at(0);
	//    ^? string[]
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`
		[
		  "a",
		  "b",
		]
	`));
});

describe("list(int64) + useBigInt", () => {
	const t = q
		.table({ a: q.list(q.int64()) }, { useBigInt: true })
		.parseIPC(ipc([[1n, 2n]], f.list(f.int64())));
	const col = t.getChild("a");
	//    ^? q.Column<ListType<q.Field<string, IntType<64, true>>>, { readonly useBigInt: true; }, false>
	const val = col.at(0);
	//    ^? BigInt64Array<ArrayBufferLike>
	test("at(0)", () =>
		expect(val?.constructor.name).toMatchInlineSnapshot(`"BigInt64Array"`));
});

// =============================================================================
// Struct
// =============================================================================

describe("struct", () => {
	const t = q
		.table({ a: q.struct({ x: q.int32(), y: q.utf8() }) })
		.parseIPC(
			ipc([{ x: 1, y: "hi" }], f.struct({ x: f.int32(), y: f.utf8() })),
		);
	const col = t.getChild("a");
	//    ^? q.Column<StructType<(q.Field<"x", IntType<32, true>> | q.Field<"y", f.Utf8Type>)[]>, {}, false>
	const val = col.at(0);
	//    ^? { x: number; y: string; }
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`
		{
		  "x": 1,
		  "y": "hi",
		}
	`));
});

describe("struct + useBigInt", () => {
	const t = q
		.table({ a: q.struct({ v: q.int64() }) }, { useBigInt: true })
		.parseIPC(ipc([{ v: 1n }], f.struct({ v: f.int64() })));
	const col = t.getChild("a");
	//    ^? q.Column<StructType<q.Field<"v", IntType<64, true>>[]>, { readonly useBigInt: true; }, false>
	const val = col.at(0);
	//    ^? { v: bigint; }
	test("at(0)", () => expect(typeof val?.v).toMatchInlineSnapshot(`"bigint"`));
});

// =============================================================================
// Map
// =============================================================================

describe("map(utf8, int32)", () => {
	const t = q.table({ a: q.map(q.utf8(), q.int32()) }).parseIPC(
		ipc([new Map([["k", 1]])], f.map(f.utf8(), f.int32())),
	);
	const col = t.getChild("a");
	//    ^? q.Column<MapType<q.Field<"entries", StructType<[q.Field<"key", f.Utf8Type>, q.Field<"value", IntType<32, true>>]>>>, {}, false>
	const val = col.at(0);
	//    ^? [string, number][]
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`
		[
		  [
		    "k",
		    1,
		  ],
		]
	`));
});

// =============================================================================
// Nullable
// =============================================================================

describe("nullable int32", () => {
	const t = q.table({ a: q.int32().nullable() }).parseIPC(
		ipc([1, null], f.int32()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<IntType<32, true>, {}, true>
	const arr = col.toArray();
	//    ^? Int32Array<ArrayBufferLike> | (number | null)[]
	const val = col.at(1);
	//    ^? number | null
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		[
		  1,
		  null,
		]
	`));
	test("at(1) null", () => expect(val).toMatchInlineSnapshot(`null`));
});

describe("nullable utf8", () => {
	const t = q.table({ a: q.utf8().nullable() }).parseIPC(
		ipc(["hi", null], f.utf8()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<f.Utf8Type, {}, true>
	const val = col.at(1);
	//    ^? string | null
	test("at(1) null", () => expect(val).toMatchInlineSnapshot(`null`));
});

// =============================================================================
// Either
// =============================================================================

describe("either([int32, float64])", () => {
	const t = q.table({ a: q.either([q.int32(), q.float64()]) }).parseIPC(
		ipc([1], f.int32()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<IntType<32, true> | FloatType<2>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

// =============================================================================
// Nested — list of struct
// =============================================================================

describe("list(struct)", () => {
	const t = q
		.table({ a: q.list(q.struct({ x: q.int32() })) })
		.parseIPC(
			ipc([[{ x: 1 }, { x: 2 }]], f.list(f.struct({ x: f.int32() }))),
		);
	const col = t.getChild("a");
	//    ^? q.Column<ListType<q.Field<string, StructType<q.Field<"x", IntType<32, true>>[]>>>, {}, false>
	const val = col.at(0);
	//    ^? { x: number; }[]
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`
		[
		  {
		    "x": 1,
		  },
		  {
		    "x": 2,
		  },
		]
	`));
});

// =============================================================================
// Nested — struct with list
// =============================================================================

describe("struct with list", () => {
	const t = q
		.table({ a: q.struct({ vs: q.list(q.int32()) }) })
		.parseIPC(
			ipc([{ vs: [1, 2] }], f.struct({ vs: f.list(f.int32()) })),
		);
	const col = t.getChild("a");
	//    ^? q.Column<StructType<q.Field<"vs", ListType<q.Field<string, IntType<32, true>>>>[]>, {}, false>
	const val = col.at(0);
	//    ^? { vs: Int32Array<ArrayBufferLike>; }
	test("at(0)", () =>
		expect(val?.vs?.constructor.name).toMatchInlineSnapshot(`"Int32Array"`));
});

// =============================================================================
// Option invariants — useBigInt doesn't affect small ints or floats
// =============================================================================

describe("int32 + useBigInt still number", () => {
	const t = q.table({ a: q.int32() }, { useBigInt: true }).parseIPC(
		ipc([1], f.int32()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<IntType<32, true>, { readonly useBigInt: true; }, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("float64 + useBigInt still number", () => {
	const t = q.table({ a: q.float64() }, { useBigInt: true }).parseIPC(
		ipc([1.5], f.float64()),
	);
	const val = t.getChild("a").at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1.5`));
});

// =============================================================================
// Nullable variants
// =============================================================================

describe("nullable int64 + useBigInt", () => {
	const t = q
		.table({ a: q.int64().nullable() }, { useBigInt: true })
		.parseIPC(ipc([1n, null], f.int64()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<64, true>, { readonly useBigInt: true; }, true>
	const arr = col.toArray();
	//    ^? BigInt64Array<ArrayBufferLike> | (bigint | null)[]
	const val = col.at(0);
	//    ^? bigint | null
	const nul = col.at(1);
	//    ^? bigint | null
	test("toArray", () => expect(arr).toMatchInlineSnapshot(`
		[
		  1n,
		  null,
		]
	`));
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1n`));
	test("at(1) null", () => expect(nul).toMatchInlineSnapshot(`null`));
});

describe("nullable dateDay + useDate", () => {
	const t = q
		.table({ a: q.dateDay().nullable() }, { useDate: true })
		.parseIPC(ipc([new Date("2024-01-01"), null], f.dateDay()));
	const col = t.getChild("a");
	//    ^? q.Column<DateType<0>, { readonly useDate: true; }, true>
	const val = col.at(0);
	//    ^? Date | null
	const nul = col.at(1);
	//    ^? Date | null
	test("at(0)", () => expect(val instanceof Date).toMatchInlineSnapshot(`true`));
	test("at(1) null", () => expect(nul).toMatchInlineSnapshot(`null`));
});

describe("nullable bool", () => {
	const t = q.table({ a: q.bool().nullable() }).parseIPC(
		ipc([true, null], f.bool()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<f.BoolType, {}, true>
	const val = col.at(1);
	//    ^? boolean | null
	test("at(1) null", () => expect(val).toMatchInlineSnapshot(`null`));
});

// =============================================================================
// Map + useMap
// =============================================================================

describe("map(utf8, int32) + useMap", () => {
	const t = q
		.table({ a: q.map(q.utf8(), q.int32()) }, { useMap: true })
		.parseIPC(ipc([new Map([["k", 1]])], f.map(f.utf8(), f.int32())));
	const col = t.getChild("a");
	//    ^? q.Column<MapType<q.Field<"entries", StructType<[q.Field<"key", f.Utf8Type>, q.Field<"value", IntType<32, true>>]>>>, { readonly useMap: true; }, false>
	const val = col.at(0);
	//    ^? Map<string, number>
	test("at(0)", () => expect(val instanceof Map).toMatchInlineSnapshot(`true`));
});

// =============================================================================
// Broad builders — with type snapshots
// =============================================================================

describe("q.int() accepts int8", () => {
	const t = q.table({ a: q.int() }).parseIPC(ipc([1], f.int8()));
	const col = t.getChild("a");
	//    ^? q.Column<IntType<f.IntBitWidth, boolean>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`1`));
});

describe("q.string() accepts largeUtf8", () => {
	const t = q.table({ a: q.string() }).parseIPC(
		ipc(["hi"], f.largeUtf8()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<f.Utf8Type | f.LargeUtf8Type | f.Utf8ViewType, {}, false>
	const val = col.at(0);
	//    ^? string
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`"hi"`));
});

describe("q.float() accepts float32", () => {
	const t = q.table({ a: q.float() }).parseIPC(ipc([1.5], f.float32()));
	const col = t.getChild("a");
	//    ^? q.Column<FloatType<f.Precision_>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("q.date() accepts dateMillisecond", () => {
	const t = q.table({ a: q.date() }).parseIPC(
		ipc([new Date("2024-01-01")], f.dateMillisecond()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<DateType<f.DateUnit_>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(typeof val).toMatchInlineSnapshot(`"number"`));
});

describe("q.time() accepts timeSecond", () => {
	const t = q.table({ a: q.time() }).parseIPC(
		ipc([3600], f.timeSecond()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<TimeType<32 | 64, f.TimeUnit_>, {}, false>
	const val = col.at(0);
	//    ^? number
	test("at(0)", () => expect(val).toMatchInlineSnapshot(`3600`));
});

// =============================================================================
// Interval
// =============================================================================

describe("interval + useDate", () => {
	const t = q.table({ a: q.interval() }, { useDate: true }).parseIPC(
		ipc([[1, 15, 0n]], f.interval()),
	);
	const col = t.getChild("a");
	//    ^? q.Column<IntervalType<f.IntervalUnit_>, { readonly useDate: true; }, false>
	const val = col.at(0);
	//    ^? Date
	test("at(0)", () =>
		expect(val?.constructor.name).toMatchInlineSnapshot(`"Float64Array"`));
});
