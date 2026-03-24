/**
 * Playground for exploring quiver's type system.
 *
 * Hover over variables in your editor to see inferred types.
 * Run: deno check example.ts
 */

import type { ExtractionOptions } from "@uwdata/flechette";
import type * as d from "./src/data-types.ts";
import type { Scalar, ValueArray } from "./src/jsvalue.ts";
import type { Column, Table } from "./src/table.gen.ts";

// =============================================================================
// 1. Scalar — hover to see what JS type a DataType resolves to
// =============================================================================

// Basics
type S1 = Scalar<d.IntType<32, true>, {}>; // number
type S2 = Scalar<d.IntType<64, true>, {}>; // number (default)
type S3 = Scalar<d.IntType<64, true>, { useBigInt: true }>; // bigint
type S4 = Scalar<d.Utf8Type, {}>; // string
type S5 = Scalar<d.BoolType, {}>; // boolean
type S6 = Scalar<d.DateType, { useDate: true }>; // Date
type S7 = Scalar<d.DateType, {}>; // number

// Dictionary unwraps
type S8 = Scalar<d.DictionaryType<d.Utf8Type>, {}>; // string

// Lists return typed arrays for numeric children
type S9 = Scalar<d.ListType<d.Field<"item", d.IntType<32, true>>>, {}>; // Int32Array
type S10 = Scalar<d.ListType<d.Field<"item", d.Utf8Type>>, {}>; // Array<string>
type S11 = Scalar<
	d.ListType<d.Field<"item", d.IntType<64, true>>>,
	{ useBigInt: true }
>; // BigInt64Array

// =============================================================================
// 2. ValueArray — hover to see what column.toArray() returns
// =============================================================================

type V1 = ValueArray<d.IntType<32, true>, {}, false>; // Int32Array (non-nullable)
type V2 = ValueArray<d.IntType<32, true>, {}, true>; // Array<number | null> (nullable!)
type V3 = ValueArray<d.FloatType<2>, {}, false>; // Float64Array
type V4 = ValueArray<d.Utf8Type, {}, false>; // Array<string>
type V5 = ValueArray<d.IntType<64, true>, { useBigInt: true }, false>; // BigInt64Array
type V6 = ValueArray<d.DateType, { useDate: true }, false>; // Array<Date> (Date breaks typed array)

// =============================================================================
// 3. Column — typed access to a single column
// =============================================================================

declare const intCol: Column<d.IntType<32, true>, {}, false>;
type C1 = ReturnType<typeof intCol.at>; // number
type C2 = ReturnType<typeof intCol.toArray>; // Int32Array

declare const nullableUtf8Col: Column<d.Utf8Type, {}, true>;
type C3 = ReturnType<typeof nullableUtf8Col.at>; // string | null
type C4 = ReturnType<typeof nullableUtf8Col.toArray>; // Array<string | null>

declare const bigintCol: Column<
	d.IntType<64, true>,
	{ useBigInt: true },
	false
>;
type C5 = ReturnType<typeof bigintCol.at>; // bigint
type C6 = ReturnType<typeof bigintCol.toArray>; // BigInt64Array

// =============================================================================
// 4. Table — the whole thing
// =============================================================================

type MyFields = [
	{ name: "id"; type: d.IntType<32, true>; nullable: false },
	{ name: "name"; type: d.Utf8Type; nullable: true },
	{ name: "score"; type: d.FloatType<2>; nullable: false },
	{ name: "created"; type: d.TimestampType; nullable: false },
	{
		name: "tags";
		type: d.ListType<d.Field<"item", d.Utf8Type>>;
		nullable: true;
	},
];

type MyOptions = { useDate: true };

declare const table: Table<MyFields, MyOptions>;

// Hover over these!
const names = table.names; // ["id", "name", "score", "created", "tags"]
const row = table.at(0); // { id: number; name: string | null; score: number; created: Date; tags: Array<string> | null }
const rows = table.toArray(); // Array<{ id: number; name: string | null; ... }>
const cols = table.toColumns(); // { id: Int32Array; name: Array<string | null>; score: Float64Array; ... }

// Type-safe column access
const idCol = table.getChild("id"); // Column<IntType<32, true>, { useDate: true }, false>
const nameCol = table.getChild("name"); // Column<Utf8Type, { useDate: true }, true>
const scoreCol = table.getChildAt(2); // Column<FloatType<2>, { useDate: true }, false>

// Select preserves types
const sub = table.select(["id", "created"]);
const subRow = sub.at(0); // { id: number; created: Date }

const sub2 = table.selectAt([0, 2]);
const sub2Row = sub2.at(0); // { id: number; score: number }
