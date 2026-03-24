import type * as f from "@uwdata/flechette";

type Metadata = Map<string, string>;

type Prettify<T> =
	& {
		[K in keyof T]: T[K];
	}
	& {};

// Base interface for all data types
interface BaseDataType {
	typeId: number;
}

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
		[K in keyof Fields]: Prettify<Fields[K] & { metadata: Metadata }>;
	};
	metadata?: Metadata | null;
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
export interface DictionaryType<Dictionary extends DataType = DataType>
	extends BaseDataType {
	typeId: -1;
	dictionary: Dictionary;
	id: number;
	indices: IntType;
	ordered: boolean;
}

/** None data type. */
export interface NoneType extends BaseDataType {
	typeId: 0;
}

/** Null data type. */
export interface NullType extends BaseDataType {
	typeId: 1;
}

/** Integer data type. */
export interface IntType<
	BitWidth extends f.IntBitWidth = f.IntBitWidth,
	Signed extends boolean = boolean,
> extends BaseDataType {
	typeId: 2;
	bitWidth: BitWidth;
	signed: Signed;
	values: f.IntArrayConstructor;
}

/** Floating point number data type. */
export interface FloatType<Precision extends f.Precision_ = f.Precision_>
	extends BaseDataType {
	typeId: 3;
	precision: Precision;
	values: f.FloatArrayConstructor;
}

/** Opaque binary data type. */
export interface BinaryType extends BaseDataType {
	typeId: 4;
	offsets: Int32ArrayConstructor;
}

/** UTF-8 encoded string data type. */
export interface Utf8Type extends BaseDataType {
	typeId: 5;
	offsets: Int32ArrayConstructor;
}

/** Boolean data type. */
export interface BoolType extends BaseDataType {
	typeId: 6;
}

type DecimalBitWidth = 32 | 64 | 128 | 256;

/** Fixed decimal number data type. */
export interface DecimalType<BitWidth extends DecimalBitWidth = DecimalBitWidth>
	extends BaseDataType {
	typeId: 7;
	precision: number;
	scale: number;
	bitWidth: BitWidth;
	values: f.DecimalArrayConstructor;
}

/** Date data type. */
export interface DateType<Unit extends f.DateUnit_ = f.DateUnit_>
	extends BaseDataType {
	typeId: 8;
	unit: Unit;
	values: f.DateTimeArrayConstructor;
}

/** Time data type. */
export interface TimeType<
	BitWidth extends (32 | 64) = (32 | 64),
	Unit extends f.TimeUnit_ = f.TimeUnit_,
> extends BaseDataType {
	typeId: 9;
	unit: Unit;
	bitWidth: BitWidth;
	values: f.DateTimeArrayConstructor;
}

/** Timestamp data type. */
export interface TimestampType<
	Unit extends f.TimeUnit_ = f.TimeUnit_,
	Timezone extends string | null = string | null,
> extends BaseDataType {
	typeId: 10;
	unit: Unit;
	timezone: Timezone;
	values: BigInt64ArrayConstructor;
}

/** Date/time interval data type. */
export interface IntervalType<Unit extends f.IntervalUnit_ = f.IntervalUnit_>
	extends BaseDataType {
	typeId: 11;
	unit: Unit;
	values?: Int32ArrayConstructor;
}

/** List data type. */
export interface ListType<Child extends Field = Field> extends BaseDataType {
	typeId: 12;
	children: [Child];
	offsets: Int32ArrayConstructor;
}

/** Struct data type. */
export interface StructType<Children extends Array<Field> = Array<Field>>
	extends BaseDataType {
	typeId: 13;
	children: Children;
}

/** Union data type. */
export interface UnionType<
	Children extends Array<Field> = Array<Field>,
> extends BaseDataType {
	typeId: 14;
	mode: f.UnionMode_;
	typeIds: number;
	typeMap: Record<number, number>;
	children: Children;
	typeIdForValue?: (value: any, index: number) => number;
	offsets: Int32ArrayConstructor;
}

/** Fixed-size opaque binary data type. */
export interface FixedSizeBinaryType extends BaseDataType {
	typeId: 15;
	stride: number;
}

/** Fixed-size list data type. */
export interface FixedSizeListType<Children extends Array<Field> = Array<Field>>
	extends BaseDataType {
	typeId: 16;
	stride: number;
	children: Children;
}

/** Key-value map data type. */
export interface MapType<Child extends Field = Field> extends BaseDataType {
	typeId: 17;
	keysSorted: boolean;
	children: [Child];
	offsets: Int32ArrayConstructor;
}

/** Duration data type. */
export interface DurationType<Unit extends f.TimeUnit_ = f.TimeUnit_>
	extends BaseDataType {
	typeId: 18;
	unit: Unit;
	values: BigInt64ArrayConstructor;
}

/** Opaque binary data type with 64-bit integer offsets for larger data. */
export interface LargeBinaryType extends BaseDataType {
	typeId: 19;
	offsets: BigInt64ArrayConstructor;
}

/** UTF-8 encoded string data type with 64-bit integer offsets for larger data. */
export interface LargeUtf8Type extends BaseDataType {
	typeId: 20;
	offsets: BigInt64ArrayConstructor;
}

/** List data type with 64-bit integer offsets for larger data. */
export interface LargeListType<Child extends Field = Field>
	extends BaseDataType {
	typeId: 21;
	children: [Child];
	offsets: BigInt64ArrayConstructor;
}

// https://arrow.apache.org/docs/format/Columnar.html#run-end-encoded-layout
type RunEnds_ = Field<string, IntType<16 | 32 | 64, true>>;

/** RunEndEncoded data type. */
export interface RunEndEncodedType<
	RunEnds extends RunEnds_ = RunEnds_,
	Values extends Field = Field,
> extends BaseDataType {
	typeId: 22;
	children: [RunEnds, Values];
}

/** Opaque binary data type with multi-buffer view layout. */
export interface BinaryViewType extends BaseDataType {
	typeId: 23;
}

/** UTF-8 encoded string data type with multi-buffer view layout. */
export interface Utf8ViewType extends BaseDataType {
	typeId: 24;
}

/** ListView data type. */
export interface ListViewType<Child extends Field = Field>
	extends BaseDataType {
	typeId: 25;
	children: [Child];
	offsets: Int32ArrayConstructor;
}

/** ListView data type with 64-bit integer offsets for larger data. */
export interface LargeListViewType<Child extends Field = Field>
	extends BaseDataType {
	typeId: 26;
	children: [Child];
	offsets: BigInt64ArrayConstructor;
}
