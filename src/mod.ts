import * as f from "@uwdata/flechette";
import type * as d from "./data-types.ts";
import type { Table } from "./table.gen.ts";
import { assertSchema, type TypeMatcher } from "./assert.ts";

export type { DataType, Field, Schema } from "./data-types.ts";
export type { Scalar, ValueArray } from "./types.ts";
export type { Column, Table } from "./table.gen.ts";
export {
  QuiverError,
  type QuiverIssue,
  type QuiverIssueCode,
} from "./assert.ts";

/**
 * A phantom schema descriptor for a column type. Carries no runtime data —
 * just match criteria for validation and a type-level generic for inference.
 * Call `.nullable()` to mark the column as allowing null values.
 */
export interface SchemaEntry<
  T extends d.DataType = d.DataType,
  Nullable extends boolean = false,
> {
  readonly match: TypeMatcher;
  nullable(): SchemaEntry<T, true>;
}

function schema<T extends d.DataType>(
  match: TypeMatcher,
): SchemaEntry<T, false> {
  return {
    match,
    nullable(): SchemaEntry<T, true> {
      // Spread to create a new object; cast is safe because nullable()
      // only changes the Nullable type parameter (phantom, no runtime data)
      return { ...this } as unknown as SchemaEntry<T, true>;
    },
  };
}

// =============================================================================
// Specific builders
// =============================================================================

/** 8-bit signed integer. Scalar: `number`. */
export function int8(): SchemaEntry<d.IntType<8, true>> {
  return schema({ typeId: 2, bitWidth: 8, signed: true });
}
/** 16-bit signed integer. Scalar: `number`. */
export function int16(): SchemaEntry<d.IntType<16, true>> {
  return schema({ typeId: 2, bitWidth: 16, signed: true });
}
/** 32-bit signed integer. Scalar: `number`. */
export function int32(): SchemaEntry<d.IntType<32, true>> {
  return schema({ typeId: 2, bitWidth: 32, signed: true });
}
/** 64-bit signed integer. Scalar: `number` or `bigint` with `useBigInt`. */
export function int64(): SchemaEntry<d.IntType<64, true>> {
  return schema({ typeId: 2, bitWidth: 64, signed: true });
}
/** 8-bit unsigned integer. Scalar: `number`. */
export function uint8(): SchemaEntry<d.IntType<8, false>> {
  return schema({ typeId: 2, bitWidth: 8, signed: false });
}
/** 16-bit unsigned integer. Scalar: `number`. */
export function uint16(): SchemaEntry<d.IntType<16, false>> {
  return schema({ typeId: 2, bitWidth: 16, signed: false });
}
/** 32-bit unsigned integer. Scalar: `number`. */
export function uint32(): SchemaEntry<d.IntType<32, false>> {
  return schema({ typeId: 2, bitWidth: 32, signed: false });
}
/** 64-bit unsigned integer. Scalar: `number` or `bigint` with `useBigInt`. */
export function uint64(): SchemaEntry<d.IntType<64, false>> {
  return schema({ typeId: 2, bitWidth: 64, signed: false });
}

/** 16-bit (half precision) float. Scalar: `number`. */
export function float16(): SchemaEntry<d.FloatType<0>> {
  return schema({ typeId: 3, precision: 0 });
}
/** 32-bit (single precision) float. Scalar: `number`. */
export function float32(): SchemaEntry<d.FloatType<1>> {
  return schema({ typeId: 3, precision: 1 });
}
/** 64-bit (double precision) float. Scalar: `number`. */
export function float64(): SchemaEntry<d.FloatType<2>> {
  return schema({ typeId: 3, precision: 2 });
}

/** UTF-8 encoded string. Scalar: `string`. */
export function utf8(): SchemaEntry<d.Utf8Type> {
  return schema({ typeId: 5 });
}
/** UTF-8 string with 64-bit offsets. Scalar: `string`. */
export function largeUtf8(): SchemaEntry<d.LargeUtf8Type> {
  return schema({ typeId: 20 });
}
/** UTF-8 string with multi-buffer view layout. Scalar: `string`. */
export function utf8View(): SchemaEntry<d.Utf8ViewType> {
  return schema({ typeId: 24 });
}
/** Boolean. Scalar: `boolean`. */
export function bool(): SchemaEntry<d.BoolType> {
  return schema({ typeId: 6 });
}
/** Opaque binary data. Scalar: `Uint8Array`. */
export function binary(): SchemaEntry<d.BinaryType> {
  return schema({ typeId: 4 });
}
/** Binary data with 64-bit offsets. Scalar: `Uint8Array`. */
export function largeBinary(): SchemaEntry<d.LargeBinaryType> {
  return schema({ typeId: 19 });
}
/** Binary data with multi-buffer view layout. Scalar: `Uint8Array`. */
export function binaryView(): SchemaEntry<d.BinaryViewType> {
  return schema({ typeId: 23 });
}

/** Date with day resolution. Scalar: `number` or `Date` with `useDate`. */
export function dateDay(): SchemaEntry<d.DateType<0>> {
  return schema({ typeId: 8, unit: 0 });
}
/** Date with millisecond resolution. Scalar: `number` or `Date` with `useDate`. */
export function dateMillisecond(): SchemaEntry<d.DateType<1>> {
  return schema({ typeId: 8, unit: 1 });
}

/** Time with second resolution (32-bit). Scalar: `number`. */
export function timeSecond(): SchemaEntry<d.TimeType<32>> {
  return schema({ typeId: 9, bitWidth: 32, unit: 0 });
}
/** Time with millisecond resolution (32-bit). Scalar: `number`. */
export function timeMillisecond(): SchemaEntry<d.TimeType<32>> {
  return schema({ typeId: 9, bitWidth: 32, unit: 1 });
}
/** Time with microsecond resolution (64-bit). Scalar: `number` or `bigint` with `useBigInt`. */
export function timeMicrosecond(): SchemaEntry<d.TimeType<64>> {
  return schema({ typeId: 9, bitWidth: 64, unit: 2 });
}
/** Time with nanosecond resolution (64-bit). Scalar: `number` or `bigint` with `useBigInt`. */
export function timeNanosecond(): SchemaEntry<d.TimeType<64>> {
  return schema({ typeId: 9, bitWidth: 64, unit: 3 });
}

/** Timestamp. Scalar: `number` or `Date` with `useDate`. */
export function timestamp(
  unit?: f.TimeUnit_,
  timezone?: string | null,
): SchemaEntry<d.TimestampType> {
  const match: TypeMatcher = { typeId: 10 };
  if (unit !== undefined) match.unit = unit;
  if (timezone !== undefined) match.timezone = timezone;
  return schema(match);
}
/** Date/time interval. */
export function interval(unit?: f.IntervalUnit_): SchemaEntry<d.IntervalType> {
  const match: TypeMatcher = { typeId: 11 };
  if (unit !== undefined) match.unit = unit;
  return schema(match);
}
/** Duration. Scalar: `number` or `bigint` with `useBigInt`. */
export function duration(unit?: f.TimeUnit_): SchemaEntry<d.DurationType> {
  const match: TypeMatcher = { typeId: 18 };
  if (unit !== undefined) match.unit = unit;
  return schema(match);
}

/** Fixed-point decimal. Scalar: `number` or scaled integer with `useDecimalInt`. */
export function decimal(
  precision: number,
  scale: number,
  bitWidth?: number,
): SchemaEntry<d.DecimalType> {
  const match: TypeMatcher = { typeId: 7, precision, scale };
  if (bitWidth !== undefined) match.bitWidth = bitWidth;
  return schema(match);
}
/** 32-bit decimal. Scalar: `number`. */
export function decimal32(
  precision: number,
  scale: number,
): SchemaEntry<d.DecimalType<32>> {
  return schema({ typeId: 7, precision, scale, bitWidth: 32 });
}
/** 64-bit decimal. Scalar: `number` or `bigint` with `useDecimalInt`. */
export function decimal64(
  precision: number,
  scale: number,
): SchemaEntry<d.DecimalType<64>> {
  return schema({ typeId: 7, precision, scale, bitWidth: 64 });
}
/** 128-bit decimal. Scalar: `number` or `bigint` with `useDecimalInt`. */
export function decimal128(
  precision: number,
  scale: number,
): SchemaEntry<d.DecimalType<128>> {
  return schema({ typeId: 7, precision, scale, bitWidth: 128 });
}
/** 256-bit decimal. Scalar: `number` or `bigint` with `useDecimalInt`. */
export function decimal256(
  precision: number,
  scale: number,
): SchemaEntry<d.DecimalType<256>> {
  return schema({ typeId: 7, precision, scale, bitWidth: 256 });
}

/** Null type. Scalar: `null`. */
export function nullType(): SchemaEntry<d.NullType> {
  return schema({ typeId: 1 });
}

/** Fixed-size binary data. Scalar: `Uint8Array`. */
export function fixedSizeBinary(
  stride: number,
): SchemaEntry<d.FixedSizeBinaryType> {
  return schema({ typeId: 15, stride });
}

// =============================================================================
// JS-type builders — match by JS scalar type
// =============================================================================

/** Match columns by their JS scalar type. */
export function js(
  type: "number",
): SchemaEntry<d.IntType | d.FloatType>;
export function js(
  type: "bigint",
): SchemaEntry<d.IntType<64>>;
export function js(
  type: "string",
): SchemaEntry<d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType>;
export function js(
  type: "boolean",
): SchemaEntry<d.BoolType>;
export function js(
  type: "bytes",
): SchemaEntry<
  d.BinaryType | d.LargeBinaryType | d.BinaryViewType | d.FixedSizeBinaryType
>;
export function js(
  type: "date",
): SchemaEntry<d.DateType | d.TimestampType>;
export function js(
  type: "number" | "bigint" | "string" | "boolean" | "bytes" | "date",
): SchemaEntry {
  switch (type) {
    case "number":
      return schema({ typeId: [2, 3] });
    case "bigint":
      return schema({ typeId: 2, bitWidth: 64 });
    case "string":
      return schema({ typeId: [5, 20, 24] });
    case "boolean":
      return schema({ typeId: 6 });
    case "bytes":
      return schema({ typeId: [4, 19, 23, 15] });
    case "date":
      return schema({ typeId: [8, 10] });
  }
}

// =============================================================================
// Broad builders — match any variant of a type family
// =============================================================================

/** Any integer (int8 through uint64). Scalar: `number`, or `bigint` for 64-bit with `useBigInt`. */
export function int(): SchemaEntry<d.IntType> {
  return schema({ typeId: 2 });
}
/** Any float (float16, float32, float64). Scalar: `number`. */
export function float(): SchemaEntry<d.FloatType> {
  return schema({ typeId: 3 });
}
/** Any date (dateDay or dateMillisecond). Scalar: `number`, or `Date` with `useDate`. */
export function date(): SchemaEntry<d.DateType> {
  return schema({ typeId: 8 });
}
/** Any time (timeSecond through timeNanosecond). Scalar: `number`, or `bigint` for 64-bit with `useBigInt`. */
export function time(): SchemaEntry<d.TimeType> {
  return schema({ typeId: 9 });
}
/** Any string encoding (utf8, largeUtf8, utf8View). Scalar: `string`. */
export function string(): SchemaEntry<
  d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType
> {
  return schema({ typeId: [5, 20, 24] });
}

// =============================================================================
// Nested type builders
// =============================================================================

/** Variable-length list. Scalar: typed array for numeric children, `Array` otherwise. */
export function list<T extends d.DataType>(
  child: SchemaEntry<T>,
): SchemaEntry<d.ListType<d.Field<string, T>>> {
  return schema({ typeId: 12, children: [child] });
}
/** Variable-length list with 64-bit offsets. */
export function largeList<T extends d.DataType>(
  child: SchemaEntry<T>,
): SchemaEntry<d.LargeListType<d.Field<string, T>>> {
  return schema({ typeId: 21, children: [child] });
}
/** ListView with 32-bit offsets. */
export function listView<T extends d.DataType>(
  child: SchemaEntry<T>,
): SchemaEntry<d.ListViewType<d.Field<string, T>>> {
  return schema({ typeId: 25, children: [child] });
}
/** ListView with 64-bit offsets. */
export function largeListView<T extends d.DataType>(
  child: SchemaEntry<T>,
): SchemaEntry<d.LargeListViewType<d.Field<string, T>>> {
  return schema({ typeId: 26, children: [child] });
}
/** Fixed-size list. Scalar: typed array for numeric children, `Array` otherwise. */
export function fixedSizeList<T extends d.DataType>(
  child: SchemaEntry<T>,
  stride: number,
): SchemaEntry<d.FixedSizeListType<[d.Field<string, T>]>> {
  return schema({ typeId: 16, stride, children: [child] });
}
/** Struct (object). Scalar: `{ [name]: value }` with option propagation through children. */
export function struct<
  const C extends Record<string, SchemaEntry>,
>(
  children: C,
): SchemaEntry<
  d.StructType<
    Array<
      {
        [K in keyof C & string]: d.Field<
          K,
          C[K] extends SchemaEntry<infer T> ? T : never
        >;
      }[keyof C & string]
    >
  >
> {
  return schema({ typeId: 13, children });
}
/** Key-value map. Scalar: `Array<[K, V]>`, or `Map<K, V>` with `useMap`. */
export function map<K extends d.DataType, V extends d.DataType>(
  key: SchemaEntry<K>,
  value: SchemaEntry<V>,
): SchemaEntry<
  d.MapType<
    d.Field<
      "entries",
      d.StructType<[d.Field<"key", K>, d.Field<"value", V>]>
    >
  >
> {
  return schema({ typeId: 17, children: [{ key, value }] });
}
/** Dictionary-encoded column. Scalar: unwraps to the dictionary value type. */
export function dictionary<T extends d.DataType>(
  valueType: SchemaEntry<T>,
): SchemaEntry<d.DictionaryType<T>> {
  return schema({ typeId: -1, dictionary: valueType });
}
/** Run-end encoded column. Scalar: the values type. */
export function runEndEncoded(
  runs: SchemaEntry,
  values: SchemaEntry,
): SchemaEntry<d.RunEndEncodedType> {
  return schema({ typeId: 22, children: [runs, values] });
}

/** Accept any of the given types. Validation passes if the column matches at least one. */
export function either<const E extends SchemaEntry[]>(
  entries: E,
): SchemaEntry<E[number] extends SchemaEntry<infer T> ? T : never> {
  return {
    match: { typeId: -999, options: entries },
    nullable() {
      return { ...this } as unknown as SchemaEntry<
        E[number] extends SchemaEntry<infer T> ? T : never,
        true
      >;
    },
  } as SchemaEntry<E[number] extends SchemaEntry<infer T> ? T : never>;
}

// =============================================================================
// Type-level mapping: entries → Field array for Table generic
// =============================================================================

// Record form → unordered (Array of union)
type RecordToFields<T extends Record<string, SchemaEntry>> = Array<
  {
    [K in keyof T & string]: {
      name: K;
      type: T[K] extends SchemaEntry<infer D, any> ? D : never;
      nullable: T[K] extends SchemaEntry<any, infer N> ? N : false;
    };
  }[keyof T & string]
>;

// Tuple form → ordered (mapped tuple)
type TupleToFields<
  T extends ReadonlyArray<readonly [string, SchemaEntry]>,
> = {
  [K in keyof T]: {
    name: T[K] extends readonly [infer N, any] ? N : never;
    type: T[K] extends readonly [any, SchemaEntry<infer D, any>] ? D
      : never;
    nullable: T[K] extends readonly [any, SchemaEntry<any, infer N>] ? N
      : false;
  };
};

// =============================================================================
// table() — accepts tuple or record form, validates on parse
// =============================================================================

// Tuple form: strict — exact column count and order required.
// getChildAt(i) returns the exact column type at that index.
export function table<
  const Entries extends ReadonlyArray<readonly [string, SchemaEntry]>,
  const Options extends f.ExtractionOptions = {},
>(entries: Entries, options?: Options): {
  parseIPC(
    ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
  ): Table<
    TupleToFields<Entries> & Array<d.Field>,
    Options
  >;
};

// Record form: partial — only declared columns are validated, extra
// columns in the table are ignored. Use getChild("name") for typed
// column access. getChildAt(i) is UNSAFE here: the index may refer to
// a column that wasn't declared or validated, but the type system will
// still claim it's one of the declared types.
export function table<
  const Entries extends Record<string, SchemaEntry>,
  const Options extends f.ExtractionOptions = {},
>(entries: Entries, options?: Options): {
  parseIPC(
    ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
  ): Table<RecordToFields<Entries>, Options>;
};

export function table(
  entries:
    | ReadonlyArray<readonly [string, SchemaEntry]>
    | Record<string, SchemaEntry>,
  options: f.ExtractionOptions = {},
) {
  // Tuple form is strict (exact columns), record form is partial
  const strict = Array.isArray(entries);
  let record: Record<string, SchemaEntry>;
  if (strict) {
    record = {};
    for (const [name, entry] of entries) {
      record[name] = entry;
    }
  } else {
    record = entries as Record<string, SchemaEntry>;
  }

  return {
    parseIPC(ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>) {
      const table = f.tableFromIPC(ipc, options);
      assertSchema(record, table.schema, strict);
      return table as any;
    },
  };
}

export type infer<T> = T extends {
  parseIPC: (
    ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
  ) => infer U;
} ? U
  : never;
