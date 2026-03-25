import * as f from "@uwdata/flechette";
import type * as d from "./data-types.ts";
import type { Table } from "./table.gen.ts";

export type { DataType, Field, Schema } from "./data-types.ts";
export type { Scalar, ValueArray } from "./types.ts";
export type { Column, Table } from "./table.gen.ts";

interface TypeMatcher {
  typeId: number | number[];
  [key: string]: unknown;
}

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

export const js: {
  number(): SchemaEntry<d.IntType | d.FloatType>;
  bigint(): SchemaEntry<d.IntType<64>>;
  string(): SchemaEntry<d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType>;
  boolean(): SchemaEntry<d.BoolType>;
  bytes(): SchemaEntry<
    d.BinaryType | d.LargeBinaryType | d.BinaryViewType | d.FixedSizeBinaryType
  >;
  date(): SchemaEntry<d.DateType | d.TimestampType>;
} = {
  /** Matches any Int or Float column. Scalar: `number`. */
  number: () => schema({ typeId: [2, 3] }),
  /**
   * Matches any 64-bit Int column (int64, uint64). Scalar: `bigint`.
   *
   * Requires `{ useBigInt: true }` in table options — without it values
   * are returned as `number` and may lose precision beyond 2^53.
   */
  bigint: () => schema({ typeId: 2, bitWidth: 64 }),
  /** Matches any string column (Utf8, LargeUtf8, Utf8View). Scalar: `string`. */
  string: () => schema({ typeId: [5, 20, 24] }),
  /** Matches a Bool column. Scalar: `boolean`. */
  boolean: () => schema({ typeId: 6 }),
  /** Matches any binary column (Binary, LargeBinary, BinaryView, FixedSizeBinary). Scalar: `Uint8Array`. */
  bytes: () => schema({ typeId: [4, 19, 23, 15] }),
  /**
   * Matches any date-like column (Date, Timestamp). Scalar: `Date`.
   *
   * Requires `{ useDate: true }` in table options — without it values
   * are returned as `number` (epoch milliseconds).
   */
  date: () => schema({ typeId: [8, 10] }),
};

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
// QuiverError — structured schema validation errors (zod-compatible shape)
// =============================================================================

export type QuiverIssueCode =
  | "column-count"
  | "column-missing"
  | "type-mismatch";

export interface QuiverIssue {
  code: QuiverIssueCode;
  path: string[];
  message: string;
  expected?: string;
  received?: string;
}

export class QuiverError extends Error {
  issues: QuiverIssue[];

  constructor(issues: QuiverIssue[]) {
    super();
    this.issues = issues;
    this.message = this.issues.map((i) => {
      const loc = i.path.length > 0 ? i.path.join(".") + ": " : "";
      return loc + i.message;
    }).join("\n");
    this.name = "QuiverError";
  }

  /** Flat error summary matching zod's flatten() shape. */
  flatten(): {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  } {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of this.issues) {
      if (issue.path.length > 0) {
        const key = issue.path[0];
        fieldErrors[key] = fieldErrors[key] || [];
        fieldErrors[key].push(issue.message);
      } else {
        formErrors.push(issue.message);
      }
    }
    return { formErrors, fieldErrors };
  }
}

// =============================================================================
// assertSchema — runtime validation, collects all issues
// =============================================================================

function describeType(type: f.DataType): string {
  const t = type as Record<string, unknown>;
  switch (type.typeId) {
    case 2:
      return `Int(${t.bitWidth}, ${t.signed ? "signed" : "unsigned"})`;
    case 3:
      return `Float(precision=${t.precision})`;
    case 7:
      return `Decimal(${t.precision}, ${t.scale}, bitWidth=${t.bitWidth})`;
    case 8:
      return `Date(unit=${t.unit})`;
    case 9:
      return `Time(bitWidth=${t.bitWidth}, unit=${t.unit})`;
    case 10:
      return `Timestamp(unit=${t.unit}, tz=${t.timezone})`;
    case 11:
      return `Interval(unit=${t.unit})`;
    case 12:
      return "List";
    case 13:
      return "Struct";
    case 14:
      return "Union";
    case 17:
      return "Map";
    case 18:
      return `Duration(unit=${t.unit})`;
    case -1:
      return "Dictionary";
    default: {
      const names: Record<number, string> = {
        0: "None",
        1: "Null",
        4: "Binary",
        5: "Utf8",
        6: "Bool",
        15: "FixedSizeBinary",
        16: "FixedSizeList",
        19: "LargeBinary",
        20: "LargeUtf8",
        21: "LargeList",
        22: "RunEndEncoded",
        23: "BinaryView",
        24: "Utf8View",
        25: "ListView",
        26: "LargeListView",
      };
      return names[type.typeId] ?? `Unknown(typeId=${type.typeId})`;
    }
  }
}

function describeMatcher(match: TypeMatcher): string {
  if ((match as any).options) {
    const options = (match as any).options as SchemaEntry[];
    return options.map((e) => describeMatcher(e.match)).join(" | ");
  }
  const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
  const parts: string[] = [];
  for (const [key, val] of Object.entries(match)) {
    if (key === "typeId" || key === "children" || key === "dictionary") {
      continue;
    }
    parts.push(`${key}=${val}`);
  }
  const names: Record<number, string> = {
    0: "None",
    1: "Null",
    2: "Int",
    3: "Float",
    4: "Binary",
    5: "Utf8",
    6: "Bool",
    7: "Decimal",
    8: "Date",
    9: "Time",
    10: "Timestamp",
    11: "Interval",
    12: "List",
    13: "Struct",
    14: "Union",
    15: "FixedSizeBinary",
    16: "FixedSizeList",
    17: "Map",
    18: "Duration",
    19: "LargeBinary",
    20: "LargeUtf8",
    21: "LargeList",
    22: "RunEndEncoded",
    23: "BinaryView",
    24: "Utf8View",
    25: "ListView",
    26: "LargeListView",
    [-1]: "Dictionary",
  };
  const typeNames = typeIds.map((id) => names[id] ?? `typeId=${id}`);
  const typePart = typeNames.length === 1
    ? typeNames[0]
    : typeNames.join(" | ");
  return parts.length > 0 ? `${typePart}(${parts.join(", ")})` : typePart;
}

function collectTypeIssues(
  match: TypeMatcher,
  actual: f.DataType,
  path: string[],
  issues: QuiverIssue[],
): void {
  // of() — try each option
  if ((match as any).options) {
    const options = (match as any).options as SchemaEntry[];
    if (!options.some((e) => matchesType(e.match, actual))) {
      issues.push({
        code: "type-mismatch",
        path,
        message: `Expected ${describeMatcher(match)}, received ${
          describeType(actual)
        }`,
        expected: describeMatcher(match),
        received: describeType(actual),
      });
    }
    return;
  }

  // typeId check
  const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
  if (!typeIds.includes(actual.typeId)) {
    issues.push({
      code: "type-mismatch",
      path,
      message: `Expected ${describeMatcher(match)}, received ${
        describeType(actual)
      }`,
      expected: describeMatcher(match),
      received: describeType(actual),
    });
    return;
  }

  // Check additional properties
  for (const [key, expected] of Object.entries(match)) {
    if (key === "typeId") continue;

    // Nested children for list types (skip map's { key, value } structure)
    if (key === "children" && Array.isArray(expected)) {
      // Map children are { key, value } objects for type inference only
      if (expected.length > 0 && expected[0]?.key) continue;
      const actualChildren = (actual as any).children;
      if (!actualChildren) continue;
      for (let i = 0; i < expected.length; i++) {
        const childEntry = expected[i] as SchemaEntry;
        if (childEntry?.match && actualChildren[i]?.type) {
          collectTypeIssues(
            childEntry.match,
            actualChildren[i].type,
            [...path, actualChildren[i].name ?? String(i)],
            issues,
          );
        }
      }
      continue;
    }

    // Nested children for struct (record of SchemaEntry)
    if (
      key === "children" && typeof expected === "object" &&
      !Array.isArray(expected)
    ) {
      const actualChildren = (actual as any).children as f.Field[];
      if (!actualChildren) continue;
      for (
        const [name, childEntry] of Object.entries(
          expected as Record<string, SchemaEntry>,
        )
      ) {
        const actualChild = actualChildren.find((c) => c.name === name);
        if (!actualChild) {
          issues.push({
            code: "column-missing",
            path: [...path, name],
            message: `Struct field "${name}" not found`,
          });
        } else {
          collectTypeIssues(
            childEntry.match,
            actualChild.type,
            [...path, name],
            issues,
          );
        }
      }
      continue;
    }

    // Dictionary value type
    if (key === "dictionary" && typeof expected === "object") {
      const dictEntry = expected as SchemaEntry;
      const actualDict = (actual as any).dictionary;
      if (actualDict) {
        collectTypeIssues(
          dictEntry.match,
          actualDict,
          [...path, "dictionary"],
          issues,
        );
      }
      continue;
    }

    // Map children — special structure { key, value }
    if (
      key === "children" && Array.isArray(expected) &&
      expected.length === 1 && (expected[0] as any).key
    ) {
      continue; // map children handled by typeId match
    }

    // Simple property comparison
    if ((actual as any)[key] !== expected) {
      issues.push({
        code: "type-mismatch",
        path,
        message: `Expected ${key}=${expected}, received ${key}=${
          (actual as any)[key]
        }`,
        expected: String(expected),
        received: String((actual as any)[key]),
      });
    }
  }
}

/** Simple boolean check (used by of() internally). */
function matchesType(
  match: TypeMatcher,
  actual: f.DataType,
): boolean {
  const issues: QuiverIssue[] = [];
  collectTypeIssues(match, actual, [], issues);
  return issues.length === 0;
}

/**
 * Validate a parsed schema against declared entries.
 * strict=true (tuple form): exact column count required
 * strict=false (record form): partial — only declared columns checked
 */
function assertSchema(
  declared: Record<string, SchemaEntry>,
  actual: f.Schema,
  strict: boolean,
) {
  const issues: QuiverIssue[] = [];
  const declaredNames = Object.keys(declared);
  const actualNames = actual.fields.map((f) => f.name);

  if (strict && declaredNames.length !== actualNames.length) {
    issues.push({
      code: "column-count",
      path: [],
      message: `Expected ${declaredNames.length} columns (${
        declaredNames.join(", ")
      }), got ${actualNames.length} (${actualNames.join(", ")})`,
      expected: String(declaredNames.length),
      received: String(actualNames.length),
    });
  }

  for (const name of declaredNames) {
    const actualField = actual.fields.find((f) => f.name === name);
    if (!actualField) {
      issues.push({
        code: "column-missing",
        path: [name],
        message: `Column "${name}" not found in table. Available: ${
          actualNames.join(", ")
        }`,
      });
      continue;
    }

    collectTypeIssues(declared[name].match, actualField.type, [name], issues);
  }

  if (issues.length > 0) {
    throw new QuiverError(issues);
  }
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
