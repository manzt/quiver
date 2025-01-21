import type * as f from "@uwdata/flechette";
import type * as d from "./data-types.ts";

type ResolveBitWidth<
	BitWith extends f.IntBitWidth,
	UseBigInt extends boolean | undefined,
> = BitWith extends 64 ? UseBigInt extends undefined | false ? number : bigint
	: number;

type Switch<True, False, Flag extends boolean | undefined> = Flag extends true
	? True
	: Flag extends false ? False
	: Flag extends undefined ? False
	: Flag extends boolean ? True | False
	: False;

export type JsValue<
	T extends d.DataType,
	Options extends f.ExtractionOptions,
> = T extends d.DictionaryType<infer Inner> ? JsValue<Inner, Options>
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
	: T extends d.DecimalType ? Switch<
			bigint,
			number,
			Options extends { useDecimalBigInt: infer UseDecimalBigInt }
				? UseDecimalBigInt
				: false
		>
	: T extends d.DateType ? Switch<
			Date,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.TimeType<infer BitWidth> ? ResolveBitWidth<
			BitWidth,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.TimestampType ? Switch<
			Date,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.IntervalType ? Switch<
			Date,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.ListType<infer Child> ? Array<JsValue<Child["type"], Options>>
	: T extends d.FixedSizeListType<infer Child> ? {
			[K in keyof Child]: JsValue<Child[K]["type"], Options>;
		}
	: T extends d.LargeListType<infer Child>
		? Array<JsValue<Child["type"], Options>>
	: T extends d.ListViewType<infer Child>
		? Array<JsValue<Child["type"], Options>>
	: T extends d.StructType ? unknown
	: T extends d.UnionType ? unknown
	: T extends d.MapType ? Switch<
			Map<string, unknown>,
			Array<[string, unknown]>,
			Options extends { useMap: infer UseMap } ? UseMap : false
		>
	: T extends d.DurationType ? Switch<
			bigint,
			number,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.RunEndEncodedType ? unknown
	: never;

// TODO: I need to find a way to test the _inferred_ types from TypeScript. Maybe vitest?
//
// type TestInt = JsValue<d.IntType<8 | 32 | 64>, { useBigInt: boolean }>;
// type TestInt2 = JsValue<d.IntType<64>, { useBigInt: true }>;
// type TestInt3 = JsValue<d.IntType<64>, { useBigInt: false }>;
// type TestInt4 = JsValue<d.IntType<64>, { useBigInt: undefined }>;
// type TestInt5 = JsValue<d.IntType<64>, { useBigInt: boolean }>;
// type TestInt6 = JsValue<d.IntType<64>, { useDate: true }>;
//
// type TestFloat = JsValue<d.FloatType, { useBigInt: true }>;
//
// type TestDecimalType = JsValue<d.DecimalType, { useDecimalBigInt: false }>; // should be number
// type TestDecimalType2 = JsValue<d.DecimalType, { useDecimalBigInt: true }>; // should be bigint
// type TestDecimalType3 = JsValue<d.DecimalType, { useDecimalBigInt: undefined }>; // should be number
// type TestDecimalType4 = JsValue<d.DecimalType, { useDecimalBigInt: boolean }>; // should be number | bigint
//
// type TestTimeType = JsValue<d.TimeType<32 | 64>, { useBigInt: true }>; // should be number | bigint
// type TestTimeType2 = JsValue<d.TimeType<32 | 64>, { useBigInt: false }>; // should be number
// type TestTimeType3 = JsValue<d.TimeType<32 | 64>, { useBigInt: undefined }>; // should be number
// type TestTimeType4 = JsValue<d.TimeType<32 | 64>, { useBigInt: boolean }>; // should be number | bigint
// type TestTimeType5 = JsValue<d.TimeType<64>, { useBigInt: true }>; // should be bigint
//
// type TestDateType = JsValue<d.DateType, { useDate: true }>; // should be Date
// type TestDateType2 = JsValue<d.DateType, { useDate: false }>; // should be number
// type TestDateType3 = JsValue<d.DateType, { useDate: undefined }>; // should be number
// type TestDateType4 = JsValue<d.DateType, { useDate: boolean }>; // should be Date | number
// type TestDateType5 = JsValue<d.DateType, { useBigInt: true }>; // should be a number
//
// type TestMap = JsValue<d.MapType, { useMap: true }>; // should be Map<string, unknown>
// type TestMap2 = JsValue<d.MapType, { useMap: false }>; // should be Array<[string, unknown]>
// type TestMap3 = JsValue<d.MapType, { useMap: undefined }>; // should be Array<[string, unknown]>
// type TestMap4 = JsValue<d.MapType, { useMap: boolean }>; // should be Map<string, unknown> | Array<[string, unknown]>
//
// // TODO: lists can be either typed arrays or lists (prefers typed arrays for numeric types)
// type ListType = JsValue<
// 	d.ListType<d.Field<string, d.IntType<32 | 64>>>,
// 	{ useBigInt: true }
// >; // should be Array<number | bigint>
//
// type FixedSizeListTypeTest = JsValue<
// 	d.FixedSizeListType<
// 		[d.Field<string, d.IntType<32>>, d.Field<string, d.IntType<64>>]
// 	>,
// 	{ useBigInt: true }
// >;

// type TestInt = ValueArray<d.IntType<8 | 32 | 64>, { useBigInt: true }>;
// type TestInt2 = ValueArray<d.IntType<64, boolean>, { useBigInt: true }>;
// type TestFloat = ValueArray<d.FloatType<1 | 2>, { useBigInt: true }>;
// type TestFloat2 = ValueArray<d.FloatType<0 | 1 | 2>, { useBigInt: true }>;

type ResolveIntValueArray<
	BitWith extends f.IntBitWidth,
	Signed extends boolean,
	UseBigInt extends boolean | undefined,
> = BitWith extends 8 ? Signed extends true ? Int8Array : Uint8Array
	: BitWith extends 16 ? Signed extends true ? Int16Array : Uint16Array
	: BitWith extends 32 ? Signed extends true ? Int32Array : Uint32Array
	: UseBigInt extends undefined | false ? Float64Array
	: Signed extends true ? BigInt64Array
	: BigUint64Array;

type ResolveFloatPrecisionValueArray<
	Precision extends f.Precision_,
> = Precision extends typeof f.Precision.HALF ? Float64Array
	: Precision extends typeof f.Precision.SINGLE ? Float32Array
	: Float64Array;


export type ValueArray<
	T extends d.DataType,
	Options extends f.ExtractionOptions,
> = T extends d.DictionaryType<infer Inner> ? ValueArray<Inner, Options>
	: T extends d.NoneType | d.NullType ? Array<null>
	: T extends d.IntType<infer BitWidth, infer Signed> ? ResolveIntValueArray<
			BitWidth,
			Signed,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.FloatType<infer Precision>
		? ResolveFloatPrecisionValueArray<Precision>
	: T extends
		| d.BinaryType
		| d.FixedSizeBinaryType
		| d.LargeBinaryType
		| d.BinaryViewType ? Array<Uint8Array>
	: T extends d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType ? Array<string>
	: T extends d.BoolType ? Array<boolean>
	: T extends d.DecimalType ? Switch<
			Array<bigint>,
			Float64Array,
			Options extends { useDecimalBigInt: infer UseDecimalBigInt }
				? UseDecimalBigInt
				: false
		>
	: T extends d.DateType ? Switch<
			Array<Date>,
			Float64Array,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.TimeType<infer BitWidth> ? ResolveBitWidth<
			BitWidth,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.TimestampType ? Switch<
			Array<Date>,
			Float64Array,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.IntervalType ? Switch<
			Array<Date>,
			number,
			Options extends { useDate: infer UseDate } ? UseDate : false
		>
	: T extends d.ListType<infer Child>
		? Array<ValueArray<Child["type"], Options>>
	: T extends d.FixedSizeListType<infer Child> ? {
			[K in keyof Child]: ValueArray<Child[K]["type"], Options>;
		}
	: T extends d.LargeListType<infer Child>
		? Array<ValueArray<Child["type"], Options>>
	: T extends d.ListViewType<infer Child>
		? Array<ValueArray<Child["type"], Options>>
	: T extends d.StructType ? unknown
	: T extends d.UnionType ? unknown
	: T extends d.MapType ? Switch<
			Map<string, unknown>,
			Array<[string, unknown]>,
			Options extends { useMap: infer UseMap } ? UseMap : false
		>
	: T extends d.DurationType ? Switch<
			bigint,
			number,
			Options extends { useBigInt: infer UseBigInt } ? UseBigInt : false
		>
	: T extends d.RunEndEncodedType ? unknown
	: never;
