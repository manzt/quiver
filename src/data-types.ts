/**
 * Quiver's Arrow DataType definitions.
 *
 * These types are structurally compatible with flechette's but add generic
 * parameters (e.g., IntType<BitWidth, Signed>) so the type system can
 * narrow scalar and array types based on the schema.
 *
 * They exist only at the type level — users never construct or inspect
 * them at runtime. The SchemaEntry builders carry these as phantom generics
 * for inference; at runtime, only match criteria are used.
 *
 * Simple types re-export directly from flechette. Parameterized types use
 * intersection narrowing (f.IntType & { bitWidth: 32 }) to inherit any
 * fields flechette adds. Container types (List, Struct, etc.) are interfaces
 * because they reference Field recursively, which type aliases can't do.
 */

import type * as f from "@uwdata/flechette";

type Prettify<T> =
	& {
		[K in keyof T]: T[K];
	}
	& {};

// =============================================================================
// Types that don't need generics — pass through from flechette
// =============================================================================

export type NoneType = f.NoneType;
export type NullType = f.NullType;
export type BoolType = f.BoolType;
export type BinaryType = f.BinaryType;
export type Utf8Type = f.Utf8Type;
export type FixedSizeBinaryType = f.FixedSizeBinaryType;
export type LargeBinaryType = f.LargeBinaryType;
export type LargeUtf8Type = f.LargeUtf8Type;
export type BinaryViewType = f.BinaryViewType;
export type Utf8ViewType = f.Utf8ViewType;

// =============================================================================
// Types with generics — narrow flechette's types via intersection
// =============================================================================

/** Integer data type with narrowed bitWidth and signed. */
export type IntType<
	BitWidth extends f.IntBitWidth = f.IntBitWidth,
	Signed extends boolean = boolean,
> = f.IntType & { bitWidth: BitWidth; signed: Signed };

/** Floating point number data type with narrowed precision. */
export type FloatType<Precision extends f.Precision_ = f.Precision_> =
	& f.FloatType
	& { precision: Precision };

/** Fixed decimal number data type with narrowed bitWidth. */
export type DecimalType<
	BitWidth extends 32 | 64 | 128 | 256 = 32 | 64 | 128 | 256,
> = f.DecimalType & { bitWidth: BitWidth };

/** Date data type with narrowed unit. */
export type DateType<Unit extends f.DateUnit_ = f.DateUnit_> = f.DateType & {
	unit: Unit;
};

/** Time data type with narrowed bitWidth and unit. */
export type TimeType<
	BitWidth extends 32 | 64 = 32 | 64,
	Unit extends f.TimeUnit_ = f.TimeUnit_,
> = f.TimeType & { bitWidth: BitWidth; unit: Unit };

/** Timestamp data type with narrowed unit and timezone. */
export type TimestampType<
	Unit extends f.TimeUnit_ = f.TimeUnit_,
	Timezone extends string | null = string | null,
> = f.TimestampType & { unit: Unit; timezone: Timezone };

/** Date/time interval data type with narrowed unit. */
export type IntervalType<Unit extends f.IntervalUnit_ = f.IntervalUnit_> =
	& f.IntervalType
	& { unit: Unit };

/** Duration data type with narrowed unit. */
export type DurationType<Unit extends f.TimeUnit_ = f.TimeUnit_> =
	& f.DurationType
	& { unit: Unit };

// =============================================================================
// Container types — must be interfaces (not type aliases) because they
// reference Field which references DataType which references them back.
// Type aliases can't be circular; interfaces can.
// =============================================================================

export type DataType =
	| NoneType
	| NullType
	| IntType
	| FloatType
	| BinaryType
	| Utf8Type
	| BoolType
	| DecimalType
	| DateType
	| TimeType
	| TimestampType
	| IntervalType
	| ListType
	| StructType
	| UnionType
	| FixedSizeBinaryType
	| FixedSizeListType
	| MapType
	| DurationType
	| LargeBinaryType
	| LargeUtf8Type
	| LargeListType
	| RunEndEncodedType
	| BinaryViewType
	| Utf8ViewType
	| ListViewType
	| LargeListViewType
	| DictionaryType;

/** Arrow table schema. */
export interface Schema<Fields extends Array<Field> = Array<Field>> {
	version?: f.Version_;
	endianness?: f.Endianness_;
	fields: {
		[K in keyof Fields]: Prettify<Fields[K] & { metadata: f.Metadata }>;
	};
	metadata?: f.Metadata | null;
}

/** Arrow schema field definition. */
export interface Field<
	Name extends string = string,
	Type extends DataType = DataType,
> {
	readonly name: Name;
	readonly type: Type;
	readonly nullable: boolean;
}

/** Dictionary-encoded data type. */
export interface DictionaryType<Dictionary extends DataType = DataType> {
	typeId: -1;
	dictionary: Dictionary;
	id: number;
	indices: IntType;
	ordered: boolean;
}

/** List data type. */
export interface ListType<Child extends Field = Field> {
	typeId: 12;
	children: [Child];
	offsets: Int32ArrayConstructor;
}

/** Struct data type. */
export interface StructType<Children extends Array<Field> = Array<Field>> {
	typeId: 13;
	children: Children;
}

/** Union data type. */
export interface UnionType<Children extends Array<Field> = Array<Field>> {
	typeId: 14;
	mode: f.UnionMode_;
	typeIds: number[];
	typeMap: Record<number, number>;
	children: Children;
	typeIdForValue?: (value: any, index: number) => number;
	offsets: Int32ArrayConstructor;
}

/** Fixed-size list data type. */
export interface FixedSizeListType<
	Children extends Array<Field> = Array<Field>,
> {
	typeId: 16;
	stride: number;
	children: Children;
}

/** Key-value map data type. */
export interface MapType<Child extends Field = Field> {
	typeId: 17;
	keysSorted: boolean;
	children: [Child];
	offsets: Int32ArrayConstructor;
}

/** Large list data type. */
export interface LargeListType<Child extends Field = Field> {
	typeId: 21;
	children: [Child];
	offsets: BigInt64ArrayConstructor;
}

/** RunEndEncoded data type. */
type RunEnds_ = Field<string, IntType<16 | 32 | 64, true>>;
export interface RunEndEncodedType<
	RunEnds extends RunEnds_ = RunEnds_,
	Values extends Field = Field,
> {
	typeId: 22;
	children: [RunEnds, Values];
}

/** ListView data type. */
export interface ListViewType<Child extends Field = Field> {
	typeId: 25;
	children: [Child];
	offsets: Int32ArrayConstructor;
}

/** Large ListView data type. */
export interface LargeListViewType<Child extends Field = Field> {
	typeId: 26;
	children: [Child];
	offsets: BigInt64ArrayConstructor;
}
