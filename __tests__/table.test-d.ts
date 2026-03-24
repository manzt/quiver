/**
 * Compile-time type tests for the quiver public API.
 *
 * Tests the builder functions (q.int32(), q.utf8(), etc.), the Schema
 * wrapper (.nullable()), union types, and all Table operations.
 *
 * This file defines the API we want. The builders don't exist yet —
 * this is the spec they must satisfy.
 */

// deno-lint-ignore-file no-unused-vars

import type { Equal, Expect } from "./test-utils.ts";

// ---------------------------------------------------------------------------
// These imports define the PUBLIC API surface. The builders below are what
// users will call. They don't exist yet — this file is the contract.
// ---------------------------------------------------------------------------
import type * as q from "../src/mod.ts";

// =============================================================================
// 2. Schema builders — specific (narrow) variants
// =============================================================================

// Each specific builder returns a Schema<NarrowDataType, false>.
// .nullable() flips the second param to true.

declare const int8: q.Schema<q.IntType<8, true>, false>;
declare const int16: q.Schema<q.IntType<16, true>, false>;
declare const int32: q.Schema<q.IntType<32, true>, false>;
declare const int64: q.Schema<q.IntType<64, true>, false>;
declare const uint8: q.Schema<q.IntType<8, false>, false>;
declare const uint16: q.Schema<q.IntType<16, false>, false>;
declare const uint32: q.Schema<q.IntType<32, false>, false>;
declare const uint64: q.Schema<q.IntType<64, false>, false>;

declare const float16: q.Schema<q.FloatType<0>, false>;
declare const float32: q.Schema<q.FloatType<1>, false>;
declare const float64: q.Schema<q.FloatType<2>, false>;

declare const utf8Schema: q.Schema<q.Utf8Type, false>;
declare const largeUtf8Schema: q.Schema<q.LargeUtf8Type, false>;
declare const utf8ViewSchema: q.Schema<q.Utf8ViewType, false>;

declare const binarySchema: q.Schema<q.BinaryType, false>;
declare const largeBinarySchema: q.Schema<q.LargeBinaryType, false>;
declare const binaryViewSchema: q.Schema<q.BinaryViewType, false>;

declare const boolSchema: q.Schema<q.BoolType, false>;

declare const dateDaySchema: q.Schema<q.DateType<0>, false>;
declare const dateMillisecondSchema: q.Schema<q.DateType<1>, false>;

// =============================================================================
// 2b. Schema builders — broad (flexible) variants
// =============================================================================

// Broad builders produce unparameterized types (unions of all variants).

declare const intBroad: q.Schema<q.IntType, false>;
declare const floatBroad: q.Schema<q.FloatType, false>;
declare const stringBroad: q.Schema<
	q.Utf8Type | q.LargeUtf8Type | q.Utf8ViewType,
	false
>;
declare const dateBroad: q.Schema<q.DateType, false>;

// =============================================================================
// 3. Nullable chaining
// =============================================================================

// .nullable() returns a new Schema with Nullable = true
type _NullableInt32 = Expect<
	Equal<
		ReturnType<q.Schema<q.IntType<32, true>, false>["nullable"]>,
		q.Schema<q.IntType<32, true>, true>
	>
>;

// .nullable() on already-nullable is still nullable (idempotent)
type _NullableNullable = Expect<
	Equal<
		ReturnType<q.Schema<q.Utf8Type, true>["nullable"]>,
		q.Schema<q.Utf8Type, true>
	>
>;

// =============================================================================
// 4. Union types
// =============================================================================

// q.union([...]) combines multiple schemas into a single schema whose
// DataType is the union of the inner DataTypes.
// Nullable is true if ANY member is nullable.

declare const unionIntFloat: q.Schema<
	q.IntType<32, true> | q.FloatType<2>,
	false
>;

declare const unionWithNullable: q.Schema<
	q.IntType<32, true> | q.FloatType<2>,
	true
>;

// =============================================================================
// 5. Table — definition and infer
// =============================================================================

// q.table() accepts an object of name → Schema entries + optional options.
// q.infer<typeof schema> gives the Table type.

// -- Basic table (no options) -------------------------------------------------

declare const basicSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{ name: "id"; type: q.IntType<32, true>; nullable: false },
			{ name: "name"; type: q.Utf8Type; nullable: true },
			{ name: "active"; type: q.BoolType; nullable: false },
		],
		{}
	>;
};

type BasicTable = q.infer<typeof basicSchema>;

// toArray produces correct row type
type _BasicRow = Expect<
	Equal<
		BasicTable extends { toArray(): Array<infer R> } ? R : never,
		{ id: number; name: string | null; active: boolean }
	>
>;

// -- Table with useBigInt -----------------------------------------------------

declare const bigintSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{ name: "small"; type: q.IntType<32, true>; nullable: false },
			{ name: "big"; type: q.IntType<64, true>; nullable: false },
		],
		{ useBigInt: true }
	>;
};

type BigIntTable = q.infer<typeof bigintSchema>;

type _BigIntRow = Expect<
	Equal<
		BigIntTable extends { toArray(): Array<infer R> } ? R : never,
		{ small: number; big: bigint }
	>
>;

// -- Table with useDate -------------------------------------------------------

declare const dateSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{ name: "created"; type: q.TimestampType; nullable: false },
			{ name: "day"; type: q.DateType; nullable: true },
		],
		{ useDate: true }
	>;
};

type DateTable = q.infer<typeof dateSchema>;

type _DateRow = Expect<
	Equal<
		DateTable extends { toArray(): Array<infer R> } ? R : never,
		{ created: Date; day: Date | null }
	>
>;

// -- Table with all options ---------------------------------------------------

declare const fullOptsSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{ name: "id"; type: q.IntType<64, true>; nullable: false },
			{ name: "amount"; type: q.DecimalType; nullable: false },
			{ name: "created"; type: q.TimestampType; nullable: false },
			{ name: "tags"; type: q.MapType; nullable: true },
		],
		{ useBigInt: true; useDate: true; useDecimalBigInt: true; useMap: true }
	>;
};

type FullOptsTable = q.infer<typeof fullOptsSchema>;

type _FullOptsRow = Expect<
	Equal<
		FullOptsTable extends { toArray(): Array<infer R> } ? R : never,
		{
			id: bigint;
			amount: bigint;
			created: Date;
			tags: Map<string, unknown> | null;
		}
	>
>;

// =============================================================================
// 6. Table operations
// =============================================================================

// -- getChild (by name) -------------------------------------------------------

type _GetChildId = Expect<
	Equal<
		BasicTable extends {
			getChild(name: "id"): infer C;
		} ? C
			: never,
		q.Column<q.IntType<32, true>, number>
	>
>;

type _GetChildName = Expect<
	Equal<
		BasicTable extends {
			getChild(name: "name"): infer C;
		} ? C
			: never,
		q.Column<q.Utf8Type, string>
	>
>;

// -- getChildAt (by index) ----------------------------------------------------

type _GetChildAt0 = Expect<
	Equal<
		BasicTable extends {
			getChildAt(index: 0): infer C;
		} ? C
			: never,
		q.Column<q.IntType<32, true>, number>
	>
>;

type _GetChildAt1 = Expect<
	Equal<
		BasicTable extends {
			getChildAt(index: 1): infer C;
		} ? C
			: never,
		q.Column<q.Utf8Type, string>
	>
>;

// -- select (by names) --------------------------------------------------------

type _SelectSingle = Expect<
	Equal<
		BasicTable extends {
			select(names: ["id"]): infer T;
		} ? T
			: never,
		q.Table<
			[{ name: "id"; type: q.IntType<32, true>; nullable: false }],
			{}
		>
	>
>;

type _SelectMultiple = Expect<
	Equal<
		BasicTable extends {
			select(names: ["name", "active"]): infer T;
		} ? T
			: never,
		q.Table<
			[
				{ name: "name"; type: q.Utf8Type; nullable: true },
				{ name: "active"; type: q.BoolType; nullable: false },
			],
			{}
		>
	>
>;

// -- selectAt (by indices) ----------------------------------------------------

type _SelectAt = Expect<
	Equal<
		BasicTable extends {
			selectAt(indices: [0, 2]): infer T;
		} ? T
			: never,
		q.Table<
			[
				{ name: "id"; type: q.IntType<32, true>; nullable: false },
				{ name: "active"; type: q.BoolType; nullable: false },
			],
			{}
		>
	>
>;

// -- toColumns ----------------------------------------------------------------

type _ToColumns = Expect<
	Equal<
		BasicTable extends { toColumns(): infer C } ? C : never,
		{
			id: q.ValueArray<q.IntType<32, true>, number>;
			name: q.ValueArray<q.Utf8Type, string>;
			active: q.ValueArray<q.BoolType, boolean>;
		}
	>
>;

// -- iterator -----------------------------------------------------------------

type _IteratorRow = Expect<
	Equal<
		BasicTable extends {
			[Symbol.iterator](): Generator<infer R, unknown, undefined>;
		} ? R
			: never,
		{ id: number; name: string | null; active: boolean }
	>
>;

// -- at / get -----------------------------------------------------------------

type _AtRow = Expect<
	Equal<
		BasicTable extends { at(index: number): infer R } ? R : never,
		{ id: number; name: string | null; active: boolean }
	>
>;

// =============================================================================
// 7. Nested types in tables
// =============================================================================

// -- List column --------------------------------------------------------------

declare const listSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{
				name: "tags";
				type: q.ListType<q.Field<"item", q.Utf8Type>>;
				nullable: false;
			},
			{
				name: "scores";
				type: q.ListType<q.Field<"item", q.IntType<32, true>>>;
				nullable: true;
			},
		],
		{}
	>;
};

type ListTable = q.infer<typeof listSchema>;

type _ListRow = Expect<
	Equal<
		ListTable extends { toArray(): Array<infer R> } ? R : never,
		{ tags: Array<string>; scores: Array<number> | null }
	>
>;

// -- List of lists column -----------------------------------------------------

declare const nestedListSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{
				name: "matrix";
				type: q.ListType<
					q.Field<
						"item",
						q.ListType<q.Field<"item", q.FloatType<2>>>
					>
				>;
				nullable: false;
			},
		],
		{}
	>;
};

type NestedListTable = q.infer<typeof nestedListSchema>;

type _NestedListRow = Expect<
	Equal<
		NestedListTable extends { toArray(): Array<infer R> } ? R : never,
		{ matrix: Array<Array<number>> }
	>
>;

// -- Dictionary column --------------------------------------------------------

declare const dictSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{
				name: "category";
				type: q.DictionaryType<q.Utf8Type>;
				nullable: false;
			},
		],
		{}
	>;
};

type DictTable = q.infer<typeof dictSchema>;

type _DictRow = Expect<
	Equal<
		DictTable extends { toArray(): Array<infer R> } ? R : never,
		{ category: string }
	>
>;

// -- Mixed complex table ------------------------------------------------------

declare const complexSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{ name: "id"; type: q.IntType<64, true>; nullable: false },
			{
				name: "label";
				type: q.DictionaryType<q.Utf8Type>;
				nullable: true;
			},
			{
				name: "values";
				type: q.ListType<q.Field<"item", q.FloatType<2>>>;
				nullable: false;
			},
			{ name: "created"; type: q.TimestampType; nullable: false },
		],
		{ useBigInt: true; useDate: true }
	>;
};

type ComplexTable = q.infer<typeof complexSchema>;

type _ComplexRow = Expect<
	Equal<
		ComplexTable extends { toArray(): Array<infer R> } ? R : never,
		{
			id: bigint;
			label: string | null;
			values: Array<number>;
			created: Date;
		}
	>
>;

// -- Select preserves options on complex table --------------------------------

type _ComplexSelectRow = Expect<
	Equal<
		ComplexTable extends {
			select(names: ["id", "created"]): infer T;
		} ? T extends { toArray(): Array<infer R> } ? R : never
			: never,
		{ id: bigint; created: Date }
	>
>;

// =============================================================================
// 8. Union-typed columns in tables
// =============================================================================

declare const unionSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[
			{
				name: "value";
				type: q.IntType<32, true> | q.FloatType<2>;
				nullable: false;
			},
			{
				name: "text";
				type: q.Utf8Type | q.LargeUtf8Type;
				nullable: true;
			},
		],
		{}
	>;
};

type UnionTable = q.infer<typeof unionSchema>;

type _UnionRow = Expect<
	Equal<
		UnionTable extends { toArray(): Array<infer R> } ? R : never,
		{ value: number; text: string | null }
	>
>;

// =============================================================================
// 9. Edge cases
// =============================================================================

// -- Empty options object is same as no options --------------------------------

declare const emptyOptsSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[{ name: "x"; type: q.IntType<64, true>; nullable: false }],
		{}
	>;
};

type _EmptyOptsRow = Expect<
	Equal<
		q.infer<typeof emptyOptsSchema> extends { toArray(): Array<infer R> } ? R
			: never,
		{ x: number }
	>
>;

// -- Single column table ------------------------------------------------------

declare const singleColSchema: {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): q.Table<
		[{ name: "only"; type: q.BoolType; nullable: false }],
		{}
	>;
};

type SingleColTable = q.infer<typeof singleColSchema>;

type _SingleColRow = Expect<
	Equal<
		SingleColTable extends { toArray(): Array<infer R> } ? R : never,
		{ only: boolean }
	>
>;

type _SingleColNames = Expect<
	Equal<
		SingleColTable extends { readonly names: infer N } ? N : never,
		[string]
	>
>;
