/**
 * Quiver entry point for apache-arrow.
 *
 * Re-exports all shared builders and types from the base module, plus
 * `table()` which returns a schema with both `parse` (validate an existing
 * table) and `parseIPC` (deserialize + validate).
 *
 * @example
 * ```ts
 * import { tableFromIPC } from "apache-arrow";
 * import * as q from "@manzt/quiver/apache-arrow";
 *
 * const schema = q.table({ name: q.utf8(), age: q.int32() });
 *
 * // Validate an existing table
 * const typed = schema.parse(existingTable);
 *
 * // Or deserialize + validate in one step
 * const table = schema.parseIPC(buffer);
 * ```
 */

import * as arrow from "apache-arrow";
import { Type } from "apache-arrow";
import type * as d from "../data-types.ts";
import { assertSchema } from "../assert.ts";

// =============================================================================
// Re-export shared DSL
// =============================================================================

export type { SchemaEntry } from "../mod.ts";
export {
  binary,
  // TODO: export when apache-arrow JS supports these types
  // binaryView,
  bool,
  date,
  dateDay,
  dateMillisecond,
  decimal,
  decimal128,
  decimal256,
  decimal32,
  decimal64,
  dictionary,
  duration,
  fixedSizeBinary,
  fixedSizeList,
  float,
  float16,
  float32,
  float64,
  // Broad builders
  int,
  int16,
  int32,
  int64,
  // Specific builders
  int8,
  interval,
  // JS-type builders
  largeBinary,
  // largeList,
  // largeListView,
  largeUtf8,
  like,
  // Nested builders
  list,
  // listView,
  map,
  nullType,
  // utf8View,
  oneOf,
  // Error types
  QuiverError,
  runEndEncoded,
  string,
  struct,
  time,
  timeMicrosecond,
  timeMillisecond,
  timeNanosecond,
  timeSecond,
  timestamp,
  uint16,
  uint32,
  uint64,
  uint8,
  utf8,
} from "../mod.ts";
export type { QuiverIssue, QuiverIssueCode } from "../mod.ts";

// =============================================================================
// Import SchemaEntry type for internal use
// =============================================================================

import type { SchemaEntry } from "../mod.ts";

// Re-export everything from the base module
export * from "../mod.ts";

// =============================================================================
// Normalize apache-arrow types to IPC-level representation
// =============================================================================

/**
 * Map apache-arrow's negative concrete typeIds to IPC-level typeIds.
 * Positive typeIds (Utf8=5, Binary=4, etc.) pass through unchanged.
 */
const ipcTypeIdMap: Record<number, number> = {
  [Type.Int8]: 2,
  [Type.Int16]: 2,
  [Type.Int32]: 2,
  [Type.Int64]: 2,
  [Type.Uint8]: 2,
  [Type.Uint16]: 2,
  [Type.Uint32]: 2,
  [Type.Uint64]: 2,
  [Type.Float16]: 3,
  [Type.Float32]: 3,
  [Type.Float64]: 3,
  [Type.DateDay]: 8,
  [Type.DateMillisecond]: 8,
  [Type.TimeSecond]: 9,
  [Type.TimeMillisecond]: 9,
  [Type.TimeMicrosecond]: 9,
  [Type.TimeNanosecond]: 9,
  [Type.TimestampSecond]: 10,
  [Type.TimestampMillisecond]: 10,
  [Type.TimestampMicrosecond]: 10,
  [Type.TimestampNanosecond]: 10,
  [Type.DenseUnion]: 14,
  [Type.SparseUnion]: 14,
  [Type.IntervalDayTime]: 11,
  [Type.IntervalYearMonth]: 11,
  [Type.IntervalMonthDayNano]: 11,
  [Type.DurationSecond]: 18,
  [Type.DurationMillisecond]: 18,
  [Type.DurationMicrosecond]: 18,
  [Type.DurationNanosecond]: 18,
};

function normalizeType(
  type: arrow.DataType,
): { typeId: number; [key: string]: unknown } {
  const typeId = ipcTypeIdMap[type.typeId] ?? type.typeId;
  const t = type as unknown as Record<string, unknown>;
  const result: { typeId: number; [key: string]: unknown } = { typeId };

  switch (typeId) {
    case 2: // Int
      result.bitWidth = t.bitWidth;
      result.signed = t.isSigned;
      break;
    case 3: // Float
      result.precision = t.precision;
      break;
    case 7: // Decimal
      result.precision = t.precision;
      result.scale = t.scale;
      result.bitWidth = t.bitWidth;
      break;
    case 8: // Date
      result.unit = t.unit;
      break;
    case 9: // Time
      result.bitWidth = t.bitWidth;
      result.unit = t.unit;
      break;
    case 10: // Timestamp
      result.unit = t.unit;
      if (t.timezone != null) result.timezone = t.timezone;
      break;
    case 11: // Interval
      result.unit = t.unit;
      break;
    case 12: // List
      result.children = normalizeChildren(t);
      break;
    case 13: // Struct
      result.children = normalizeChildren(t);
      break;
    case 14: // Union
      result.mode = t.mode;
      result.children = normalizeChildren(t);
      break;
    case 15: // FixedSizeBinary
      result.stride = t.byteWidth;
      break;
    case 16: // FixedSizeList
      result.stride = t.listSize;
      result.children = normalizeChildren(t);
      break;
    case 17: // Map
      result.keysSorted = t.keysSorted;
      result.children = normalizeChildren(t);
      break;
    case 18: // Duration
      result.unit = t.unit;
      break;
    case -1: { // Dictionary — stays at -1 (not in IPC spec; matches the matcher convention)
      const dict = t as unknown as arrow.Dictionary;
      result.dictionary = normalizeType(dict.dictionary);
      result.id = dict.id;
      result.indices = normalizeType(dict.indices);
      break;
    }
  }

  return result;
}

function normalizeChildren(
  t: Record<string, unknown>,
): Array<{ name: string; type: { typeId: number; [key: string]: unknown } }> {
  const children = t.children as arrow.Field[] | undefined;
  return children?.map((f) => ({
    name: f.name,
    type: normalizeType(f.type),
  })) ??
    [];
}

function normalizeSchema(
  schema: arrow.Schema,
): {
  fields: Array<
    { name: string; type: { typeId: number; [key: string]: unknown } }
  >;
} {
  return {
    fields: schema.fields.map((f) => ({
      name: f.name,
      type: normalizeType(f.type),
    })),
  };
}

// =============================================================================
// Type mapping: quiver DataType → apache-arrow DataType
// =============================================================================

// deno-lint-ignore no-explicit-any
type ToArrow<T extends d.DataType> = T extends d.DictionaryType<infer V>
  ? arrow.Dictionary<ToArrow<V>>
  : T extends d.NullType ? arrow.Null
  : T extends d.IntType<8, true> ? arrow.Int8
  : T extends d.IntType<16, true> ? arrow.Int16
  : T extends d.IntType<32, true> ? arrow.Int32
  : T extends d.IntType<64, true> ? arrow.Int64
  : T extends d.IntType<8, false> ? arrow.Uint8
  : T extends d.IntType<16, false> ? arrow.Uint16
  : T extends d.IntType<32, false> ? arrow.Uint32
  : T extends d.IntType<64, false> ? arrow.Uint64
  : T extends d.IntType ? arrow.Int
  : T extends d.FloatType<0> ? arrow.Float16
  : T extends d.FloatType<1> ? arrow.Float32
  : T extends d.FloatType<2> ? arrow.Float64
  : T extends d.FloatType ? arrow.Float
  : T extends d.Utf8Type ? arrow.Utf8
  : T extends d.LargeUtf8Type ? arrow.LargeUtf8
  // apache-arrow JS has no Utf8View
  : T extends d.Utf8ViewType ? never
  : T extends d.BoolType ? arrow.Bool
  : T extends d.BinaryType ? arrow.Binary
  : T extends d.LargeBinaryType ? arrow.LargeBinary
  // apache-arrow JS has no BinaryView
  : T extends d.BinaryViewType ? never
  : T extends d.FixedSizeBinaryType ? arrow.FixedSizeBinary
  : T extends d.DateType<0> ? arrow.DateDay
  : T extends d.DateType<1> ? arrow.DateMillisecond
  : T extends d.DateType ? arrow.Date_
  : T extends d.TimeType<32, 0> ? arrow.TimeSecond
  : T extends d.TimeType<32, 1> ? arrow.TimeMillisecond
  : T extends d.TimeType<64, 2> ? arrow.TimeMicrosecond
  : T extends d.TimeType<64, 3> ? arrow.TimeNanosecond
  : T extends d.TimeType ? arrow.Time
  : T extends d.TimestampType ? arrow.Timestamp
  : T extends d.IntervalType ? arrow.Interval
  : T extends d.DurationType ? arrow.Duration
  : T extends d.DecimalType ? arrow.Decimal
  : T extends d.ListType<infer Child> ? arrow.List<ToArrow<Child["type"]>>
  // apache-arrow JS has no LargeList/ListView/LargeListView
  : T extends d.LargeListType ? never
  : T extends d.ListViewType ? never
  : T extends d.LargeListViewType ? never
  : T extends d.FixedSizeListType<infer Children>
    ? arrow.FixedSizeList<ToArrow<Children[0]["type"]>>
  : T extends d.StructType<infer Children>
    ? arrow.Struct<StructTypeMap<Children>>
  : T extends d.MapType<infer Child>
    ? Child["type"] extends d.StructType<infer KV> ? arrow.Map_<
        ToArrow<Extract<KV[number], { name: "key" }>["type"]>,
        ToArrow<Extract<KV[number], { name: "value" }>["type"]>
      >
    : arrow.DataType
  : arrow.DataType;

type StructTypeMap<Children extends Array<d.Field>> = {
  [K in Children[number]["name"]]: ToArrow<
    Extract<Children[number], { name: K }>["type"]
  >;
};

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type ParsedTypeMap<E extends Record<string, SchemaEntry>> = Prettify<
  {
    [K in keyof E & string]: E[K] extends
      SchemaEntry<infer T extends d.DataType, boolean> ? ToArrow<T>
      : arrow.DataType;
  }
>;

// =============================================================================
// table() — define a schema, validate with parse() or parseIPC()
// =============================================================================

export function table<const Entries extends Record<string, SchemaEntry>>(
  entries: Entries,
): {
  /** Validate an existing apache-arrow Table. Returns the same table with narrowed types. */
  parse(table: arrow.Table): arrow.Table<ParsedTypeMap<Entries>>;
  /** Deserialize Arrow IPC bytes and validate against the schema. */
  parseIPC(
    ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
  ): arrow.Table<ParsedTypeMap<Entries>>;
} {
  return {
    parse(table: arrow.Table): arrow.Table<ParsedTypeMap<Entries>> {
      const normalized = normalizeSchema(table.schema);
      assertSchema(entries, normalized, false);
      return table as arrow.Table<ParsedTypeMap<Entries>>;
    },
    parseIPC(
      ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
    ): arrow.Table<ParsedTypeMap<Entries>> {
      const buf = ipc instanceof ArrayBuffer
        ? new Uint8Array(ipc)
        : Array.isArray(ipc)
        ? new Uint8Array(
          (function () {
            let len = 0;
            for (const b of ipc) len += b.byteLength;
            const out = new Uint8Array(len);
            let off = 0;
            for (const b of ipc) {
              out.set(b, off);
              off += b.byteLength;
            }
            return out.buffer;
          })(),
        )
        : ipc;
      const table = arrow.tableFromIPC(buf);
      const normalized = normalizeSchema(table.schema);
      assertSchema(entries, normalized, false);
      return table as arrow.Table<ParsedTypeMap<Entries>>;
    },
  };
}

// =============================================================================
// infer utility type
// =============================================================================

export type infer<T> = T extends {
  parse(table: arrow.Table): infer U;
} ? U
  : never;
