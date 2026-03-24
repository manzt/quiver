import type * as f from "@uwdata/flechette";
import type * as d from "./data-types.ts";

type ResolveBitWidth<
	BitWith extends f.IntBitWidth,
	UseBigInt extends boolean | undefined,
> = BitWith extends 64 ? UseBigInt extends undefined | false ? number : bigint
	: number;

type ResolveExtractionOption<True, False, Flag extends boolean | undefined> =
	Flag extends true ? True
		: Flag extends false ? False
		: Flag extends undefined ? False
		: Flag extends boolean ? True | False
		: False;

// =============================================================================
// Scalar — what .at(i) returns for a given DataType + ExtractionOptions
// =============================================================================

export type Scalar<
	T extends d.DataType,
	Options extends f.ExtractionOptions,
> = T extends d.DictionaryType<infer Inner> ? Scalar<Inner, Options>
	: T extends d.NoneType | d.NullType ? null
	: T extends d.IntType<infer BitWidth> ? ResolveBitWidth<
			BitWidth,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.FloatType ? number
	: T extends
		| d.BinaryType
		| d.FixedSizeBinaryType
		| d.LargeBinaryType
		| d.BinaryViewType ? Uint8Array
	: T extends d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType ? string
	: T extends d.BoolType ? boolean
	: T extends d.DecimalType ? ResolveExtractionOption<
			bigint,
			number,
			Options extends { useDecimalInt: infer UseDecimalBigInt }
				? UseDecimalBigInt
				: false
		>
	: T extends d.DateType ? ResolveExtractionOption<
			Date,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.TimeType<infer BitWidth> ? ResolveBitWidth<
			BitWidth,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.TimestampType ? ResolveExtractionOption<
			Date,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.IntervalType ? ResolveExtractionOption<
			Date,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.ListType<infer Child> ? ListScalar<Child["type"], Options>
	: T extends d.FixedSizeListType<infer Child> ? {
			[K in keyof Child]: Scalar<Child[K]["type"], Options>;
		}
	: T extends d.LargeListType<infer Child> ? ListScalar<Child["type"], Options>
	: T extends d.ListViewType<infer Child> ? ListScalar<Child["type"], Options>
	: T extends d.LargeListViewType<infer Child>
		? ListScalar<Child["type"], Options>
	: T extends d.StructType ? unknown
	: T extends d.UnionType ? unknown
	: T extends d.MapType ? ResolveExtractionOption<
			Map<string, unknown>,
			Array<[string, unknown]>,
			Options extends { useMap: infer UseMap } ? UseMap : false
		>
	: T extends d.DurationType ? ResolveExtractionOption<
			bigint,
			number,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.RunEndEncodedType ? unknown
	: never;

// =============================================================================
// ListScalar — list element: TypedArray for numeric children, Array otherwise.
//
// Verified empirically against flechette:
//   list(int32)  → Int32Array
//   list(utf8)   → Array<string>
//   list(int64)  → Array<number> (default) / BigInt64Array (useBigInt)
//   list(float64) → Float64Array
// =============================================================================

type ListScalar<
	ChildType extends d.DataType,
	Options extends f.ExtractionOptions,
> = TypedArrayFor<ChildType, Options> extends never
	? Array<Scalar<ChildType, Options>>
	: TypedArrayFor<ChildType, Options>;

// =============================================================================
// TypedArrayFor — the typed array type for a numeric DataType.
// Returns `never` for non-numeric types (which use Array instead).
//
// Derived from flechette's batch-type.js and verified empirically:
//   Int8    → Int8Array        Uint8    → Uint8Array
//   Int16   → Int16Array       Uint16   → Uint16Array
//   Int32   → Int32Array       Uint32   → Uint32Array
//   Int64   → Float64Array (default) / BigInt64Array (useBigInt)
//   Uint64  → Float64Array (default) / BigUint64Array (useBigInt)
//   Float16 → Float64Array (converted from Uint16Array storage)
//   Float32 → Float32Array
//   Float64 → Float64Array
// =============================================================================

type TypedArrayFor<
	T extends d.DataType,
	Options extends f.ExtractionOptions,
> = T extends d.IntType<infer BW, infer Signed>
	? BW extends 8 ? Signed extends true ? Int8Array : Uint8Array
	: BW extends 16 ? Signed extends true ? Int16Array : Uint16Array
	: BW extends 32 ? Signed extends true ? Int32Array : Uint32Array
	: BW extends 64
		? Options extends { useBigInt: true }
			? Signed extends true ? BigInt64Array : BigUint64Array
		: Float64Array
	: never
	: T extends d.FloatType<infer P> ? P extends 0 ? Float64Array // float16 is stored as Uint16, extracted as Float64
		: P extends 1 ? Float32Array
		: P extends 2 ? Float64Array
		: Float32Array | Float64Array
	: T extends d.DateType ? Options extends { useDate: true } ? never // Date[] → Array
		: Float64Array
	: T extends d.TimeType<infer BW> ? BW extends 32 ? Int32Array
		: BW extends 64
			? Options extends { useBigInt: true } ? BigInt64Array : Float64Array
		: Int32Array | BigInt64Array | Float64Array
	: T extends d.TimestampType ? Options extends { useDate: true } ? never // Date[] → Array
		: Float64Array
	: T extends d.DurationType
		? Options extends { useBigInt: true } ? BigInt64Array : Float64Array
	: T extends d.DecimalType ? Options extends { useDecimalInt: true } ? never // bigint[] → Array
		: Float64Array
	: never;

// =============================================================================
// ValueArray — what column.toArray() returns.
//
// Key behavior verified empirically:
//   - Nullable columns ALWAYS return Array (nulls break typed array zero-copy)
//   - Non-nullable numeric columns return their TypedArray
//   - Non-numeric columns always return Array
// =============================================================================

export type ValueArray<
	D extends d.DataType,
	Options extends f.ExtractionOptions,
	Nullable extends boolean = false,
> = Nullable extends true ? Array<Scalar<D, Options> | null>
	: TypedArrayFor<D, Options> extends never ? Array<Scalar<D, Options>>
	: TypedArrayFor<D, Options>;
