/**
 * Exhaustive compile-time type tests for quiver.
 *
 * This file IS the spec. Every builder, every extraction option combination,
 * nullable chaining, unions, recursive/nested types, and table-level
 * operations are tested here. If `deno check` passes, the type system
 * is correct.
 *
 * Organized bottom-up:
 *   1. JsValue mapping (DataType × ExtractionOptions → JS type)
 *   2. Schema builders (q.int32(), q.utf8(), etc.)
 *   3. Nullable chaining (.nullable())
 *   4. Union types (q.union([...]))
 *   5. Nested / recursive types (list, struct, map)
 *   6. Table-level operations (infer, getChild, select, toArray, etc.)
 */

// deno-lint-ignore-file no-unused-vars

import type { Scalar, ValueArray } from "../src/types.ts";
import type * as d from "../src/data-types.ts";
import type { Column, Table } from "../src/table.gen.ts";
import type { Equal, Expect } from "./test-utils.ts";
import * as q from "../src/mod.ts";

// =============================================================================
// 1. JsValue: Primitives
// =============================================================================

// -- None / Null --------------------------------------------------------------

type _NoneDefault = Expect<Equal<Scalar<d.NoneType, {}>, null>>;
type _NullDefault = Expect<Equal<Scalar<d.NullType, {}>, null>>;
type _NoneIgnoresOptions = Expect<
  Equal<Scalar<d.NoneType, { useBigInt: true; useDate: true }>, null>
>;

// -- Bool ---------------------------------------------------------------------

type _Bool = Expect<Equal<Scalar<d.BoolType, {}>, boolean>>;
type _BoolIgnoresOptions = Expect<
  Equal<Scalar<d.BoolType, { useBigInt: true; useDate: true }>, boolean>
>;

// -- Int × useBigInt ----------------------------------------------------------

// Small ints: always number, regardless of useBigInt
type _Int8 = Expect<Equal<Scalar<d.IntType<8>, {}>, number>>;
type _Int16 = Expect<Equal<Scalar<d.IntType<16>, {}>, number>>;
type _Int32 = Expect<Equal<Scalar<d.IntType<32>, {}>, number>>;
type _Int8BigInt = Expect<
  Equal<Scalar<d.IntType<8>, { useBigInt: true }>, number>
>;
type _Int16BigInt = Expect<
  Equal<Scalar<d.IntType<16>, { useBigInt: true }>, number>
>;
type _Int32BigInt = Expect<
  Equal<Scalar<d.IntType<32>, { useBigInt: true }>, number>
>;

// 64-bit: depends on useBigInt
type _Int64Default = Expect<Equal<Scalar<d.IntType<64>, {}>, number>>;
type _Int64False = Expect<
  Equal<Scalar<d.IntType<64>, { useBigInt: false }>, number>
>;
type _Int64True = Expect<
  Equal<Scalar<d.IntType<64>, { useBigInt: true }>, bigint>
>;
type _Int64Undefined = Expect<
  Equal<Scalar<d.IntType<64>, { useBigInt: undefined }>, number>
>;
type _Int64Boolean = Expect<
  Equal<Scalar<d.IntType<64>, { useBigInt: boolean }>, number | bigint>
>;

// Unparameterized IntType (broad — what flechette runtime returns)
type _IntBroad = Expect<Equal<Scalar<d.IntType, {}>, number>>;
type _IntBroadBigInt = Expect<
  Equal<Scalar<d.IntType, { useBigInt: true }>, number | bigint>
>;

// Mixed bitwidth union
type _IntMixed = Expect<
  Equal<Scalar<d.IntType<8 | 32 | 64>, { useBigInt: true }>, number | bigint>
>;
type _IntMixedFalse = Expect<
  Equal<Scalar<d.IntType<8 | 32 | 64>, { useBigInt: false }>, number>
>;

// -- Float --------------------------------------------------------------------

type _Float = Expect<Equal<Scalar<d.FloatType, {}>, number>>;
type _FloatIgnoresBigInt = Expect<
  Equal<Scalar<d.FloatType, { useBigInt: true }>, number>
>;

// -- Utf8 / String types ------------------------------------------------------

type _Utf8 = Expect<Equal<Scalar<d.Utf8Type, {}>, string>>;
type _LargeUtf8 = Expect<Equal<Scalar<d.LargeUtf8Type, {}>, string>>;
type _Utf8View = Expect<Equal<Scalar<d.Utf8ViewType, {}>, string>>;

// -- Binary types -------------------------------------------------------------

type _Binary = Expect<Equal<Scalar<d.BinaryType, {}>, Uint8Array>>;
type _LargeBinary = Expect<Equal<Scalar<d.LargeBinaryType, {}>, Uint8Array>>;
type _FixedSizeBinary = Expect<
  Equal<Scalar<d.FixedSizeBinaryType, {}>, Uint8Array>
>;
type _BinaryView = Expect<Equal<Scalar<d.BinaryViewType, {}>, Uint8Array>>;

// =============================================================================
// 1b. JsValue: Option-dependent types
// =============================================================================

// -- Decimal × useDecimalInt -----------------------------------------------

type _DecimalDefault = Expect<Equal<Scalar<d.DecimalType, {}>, number>>;
type _DecimalFalse = Expect<
  Equal<Scalar<d.DecimalType, { useDecimalInt: false }>, number>
>;
type _DecimalTrue = Expect<
  Equal<Scalar<d.DecimalType, { useDecimalInt: true }>, bigint>
>;
type _DecimalUndef = Expect<
  Equal<Scalar<d.DecimalType, { useDecimalInt: undefined }>, number>
>;
type _DecimalBool = Expect<
  Equal<
    Scalar<d.DecimalType, { useDecimalInt: boolean }>,
    number | bigint
  >
>;
type _Decimal128 = Expect<
  Equal<Scalar<d.DecimalType<128>, { useDecimalInt: true }>, bigint>
>;
type _Decimal256 = Expect<
  Equal<Scalar<d.DecimalType<256>, {}>, number>
>;

// -- Date × useDate -----------------------------------------------------------

type _DateDefault = Expect<Equal<Scalar<d.DateType, {}>, number>>;
type _DateFalse = Expect<
  Equal<Scalar<d.DateType, { useDate: false }>, number>
>;
type _DateTrue = Expect<Equal<Scalar<d.DateType, { useDate: true }>, Date>>;
type _DateUndef = Expect<
  Equal<Scalar<d.DateType, { useDate: undefined }>, number>
>;
type _DateBool = Expect<
  Equal<Scalar<d.DateType, { useDate: boolean }>, Date | number>
>;
// useBigInt doesn't affect Date
type _DateIgnoresBigInt = Expect<
  Equal<Scalar<d.DateType, { useBigInt: true }>, number>
>;
type _DateBothTrue = Expect<
  Equal<Scalar<d.DateType, { useDate: true; useBigInt: true }>, Date>
>;

// -- Time × useBigInt (via bitWidth) ------------------------------------------

type _Time32 = Expect<Equal<Scalar<d.TimeType<32>, {}>, number>>;
type _Time32BigInt = Expect<
  Equal<Scalar<d.TimeType<32>, { useBigInt: true }>, number>
>;
type _Time64Default = Expect<Equal<Scalar<d.TimeType<64>, {}>, number>>;
type _Time64True = Expect<
  Equal<Scalar<d.TimeType<64>, { useBigInt: true }>, bigint>
>;
type _Time64False = Expect<
  Equal<Scalar<d.TimeType<64>, { useBigInt: false }>, number>
>;
type _Time64Bool = Expect<
  Equal<Scalar<d.TimeType<64>, { useBigInt: boolean }>, number | bigint>
>;
// Broad TimeType
type _TimeBroad = Expect<Equal<Scalar<d.TimeType, {}>, number>>;
type _TimeBroadBigInt = Expect<
  Equal<Scalar<d.TimeType, { useBigInt: true }>, number | bigint>
>;

// -- Timestamp × useDate ------------------------------------------------------

type _TsDefault = Expect<Equal<Scalar<d.TimestampType, {}>, number>>;
type _TsTrue = Expect<
  Equal<Scalar<d.TimestampType, { useDate: true }>, Date>
>;
type _TsFalse = Expect<
  Equal<Scalar<d.TimestampType, { useDate: false }>, number>
>;
type _TsBool = Expect<
  Equal<Scalar<d.TimestampType, { useDate: boolean }>, Date | number>
>;
type _TsWithTz = Expect<
  Equal<Scalar<d.TimestampType<0, "UTC">, { useDate: true }>, Date>
>;

// -- Interval × useDate -------------------------------------------------------

type _IntervalDefault = Expect<Equal<Scalar<d.IntervalType, {}>, number>>;
type _IntervalTrue = Expect<
  Equal<Scalar<d.IntervalType, { useDate: true }>, Date>
>;
type _IntervalFalse = Expect<
  Equal<Scalar<d.IntervalType, { useDate: false }>, number>
>;
type _IntervalBool = Expect<
  Equal<Scalar<d.IntervalType, { useDate: boolean }>, Date | number>
>;

// -- Duration × useBigInt -----------------------------------------------------

type _DurDefault = Expect<Equal<Scalar<d.DurationType, {}>, number>>;
type _DurTrue = Expect<
  Equal<Scalar<d.DurationType, { useBigInt: true }>, bigint>
>;
type _DurFalse = Expect<
  Equal<Scalar<d.DurationType, { useBigInt: false }>, number>
>;
type _DurUndef = Expect<
  Equal<Scalar<d.DurationType, { useBigInt: undefined }>, number>
>;
type _DurBool = Expect<
  Equal<Scalar<d.DurationType, { useBigInt: boolean }>, number | bigint>
>;

// -- Map × useMap -------------------------------------------------------------

// Unparameterized MapType — child type info is lost, falls back to unknown
type _MapDefault = Expect<
  Equal<Scalar<d.MapType, {}>, Array<[unknown, unknown]>>
>;
type _MapTrue = Expect<
  Equal<Scalar<d.MapType, { useMap: true }>, Map<unknown, unknown>>
>;
type _MapFalse = Expect<
  Equal<Scalar<d.MapType, { useMap: false }>, Array<[unknown, unknown]>>
>;
type _MapUndef = Expect<
  Equal<Scalar<d.MapType, { useMap: undefined }>, Array<[unknown, unknown]>>
>;
type _MapBool = Expect<
  Equal<
    Scalar<d.MapType, { useMap: boolean }>,
    Map<unknown, unknown> | Array<[unknown, unknown]>
  >
>;

// Parameterized Map with typed key/value
type TypedMap = d.MapType<
  d.Field<
    "entries",
    d.StructType<
      [d.Field<"key", d.Utf8Type>, d.Field<"value", d.IntType<32, true>>]
    >
  >
>;
type _TypedMapDefault = Expect<
  Equal<Scalar<TypedMap, {}>, Array<[string, number]>>
>;
type _TypedMapUseMap = Expect<
  Equal<Scalar<TypedMap, { useMap: true }>, Map<string, number>>
>;

// =============================================================================
// 1c. JsValue: Dictionary (unwraps to inner type)
// =============================================================================

type _DictUtf8 = Expect<
  Equal<Scalar<d.DictionaryType<d.Utf8Type>, {}>, string>
>;
type _DictInt32 = Expect<
  Equal<Scalar<d.DictionaryType<d.IntType<32>>, {}>, number>
>;
type _DictInt64BigInt = Expect<
  Equal<Scalar<d.DictionaryType<d.IntType<64>>, { useBigInt: true }>, bigint>
>;
type _DictDate = Expect<
  Equal<Scalar<d.DictionaryType<d.DateType>, { useDate: true }>, Date>
>;
// Nested dictionary
type _DictDictUtf8 = Expect<
  Equal<
    Scalar<d.DictionaryType<d.DictionaryType<d.Utf8Type>>, {}>,
    string
  >
>;

// =============================================================================
// 1d. JsValue: Recursive / Nested types
// =============================================================================

// -- List ---------------------------------------------------------------------

type _ListInt32Signed = Expect<
  Equal<
    Scalar<d.ListType<d.Field<"item", d.IntType<32, true>>>, {}>,
    Int32Array
  >
>;
type _ListUint32 = Expect<
  Equal<
    Scalar<d.ListType<d.Field<"item", d.IntType<32, false>>>, {}>,
    Uint32Array
  >
>;
// Unparameterized signed: could be either
type _ListIntBroad = Expect<
  Equal<
    Scalar<d.ListType<d.Field<"item", d.IntType<32>>>, {}>,
    Int32Array | Uint32Array
  >
>;
type _ListUtf8 = Expect<
  Equal<
    Scalar<d.ListType<d.Field<"item", d.Utf8Type>>, {}>,
    Array<string>
  >
>;
type _ListInt64BigInt = Expect<
  Equal<
    Scalar<
      d.ListType<d.Field<"item", d.IntType<64, true>>>,
      { useBigInt: true }
    >,
    BigInt64Array
  >
>;
type _ListBool = Expect<
  Equal<
    Scalar<d.ListType<d.Field<"item", d.BoolType>>, {}>,
    Array<boolean>
  >
>;
type _ListDate = Expect<
  Equal<
    Scalar<
      d.ListType<d.Field<"item", d.DateType>>,
      { useDate: true }
    >,
    Array<Date>
  >
>;

// Nested: list of lists
type _ListOfListStr = Expect<
  Equal<
    Scalar<
      d.ListType<
        d.Field<"item", d.ListType<d.Field<"item", d.Utf8Type>>>
      >,
      {}
    >,
    Array<Array<string>>
  >
>;

// Deeply nested: list of list of list
// Inner list(int32) → Int32Array, outer lists → Array of inner
type _ListOfListOfListInt = Expect<
  Equal<
    Scalar<
      d.ListType<
        d.Field<
          "item",
          d.ListType<
            d.Field<
              "item",
              d.ListType<d.Field<"item", d.IntType<32, true>>>
            >
          >
        >
      >,
      {}
    >,
    Array<Array<Int32Array>>
  >
>;

// -- LargeList ----------------------------------------------------------------

type _LargeListInt = Expect<
  Equal<
    Scalar<d.LargeListType<d.Field<"item", d.IntType<32, true>>>, {}>,
    Int32Array
  >
>;
type _LargeListStr = Expect<
  Equal<
    Scalar<d.LargeListType<d.Field<"item", d.Utf8Type>>, {}>,
    Array<string>
  >
>;

// -- ListView -----------------------------------------------------------------

type _ListViewUtf8 = Expect<
  Equal<
    Scalar<d.ListViewType<d.Field<"item", d.Utf8Type>>, {}>,
    Array<string>
  >
>;

// -- FixedSizeList (tuple-like) -----------------------------------------------
// Mapped type over a tuple preserves tuple structure.

type _FixedSizeListSingle = Expect<
  Equal<
    Scalar<
      d.FixedSizeListType<[d.Field<"a", d.IntType<32>>]>,
      {}
    >,
    [number]
  >
>;
type _FixedSizeListPair = Expect<
  Equal<
    Scalar<
      d.FixedSizeListType<
        [d.Field<"x", d.IntType<32>>, d.Field<"y", d.FloatType>]
      >,
      {}
    >,
    [number, number]
  >
>;
type _FixedSizeListMixed = Expect<
  Equal<
    Scalar<
      d.FixedSizeListType<
        [d.Field<"a", d.IntType<64>>, d.Field<"b", d.Utf8Type>]
      >,
      { useBigInt: true }
    >,
    [bigint, string]
  >
>;

// -- Struct — maps children to { [name]: Scalar<childType> } ------------------

type _StructTyped = Expect<
  Equal<
    Scalar<
      d.StructType<
        [d.Field<"a", d.IntType<32, true>>, d.Field<"b", d.Utf8Type>]
      >,
      {}
    >,
    { a: number; b: string }
  >
>;

type _StructWithOptions = Expect<
  Equal<
    Scalar<
      d.StructType<
        [d.Field<"x", d.IntType<64, true>>, d.Field<"y", d.DateType>]
      >,
      { useBigInt: true; useDate: true }
    >,
    { x: bigint; y: Date }
  >
>;

// Nested struct
type _StructNested = Expect<
  Equal<
    Scalar<
      d.StructType<
        [
          d.Field<"name", d.Utf8Type>,
          d.Field<
            "inner",
            d.StructType<[d.Field<"val", d.IntType<32, true>>]>
          >,
        ]
      >,
      {}
    >,
    { name: string; inner: { val: number } }
  >
>;

// -- Union — union of children's scalar types ---------------------------------

type _UnionTyped = Expect<
  Equal<
    Scalar<
      d.UnionType<
        [d.Field<"a", d.IntType<32, true>>, d.Field<"b", d.Utf8Type>]
      >,
      {}
    >,
    number | string
  >
>;

// -- RunEndEncoded — scalar of the values child -------------------------------

type _RunEndEncoded = Expect<
  Equal<
    Scalar<
      d.RunEndEncodedType<
        d.Field<"run_ends", d.IntType<32, true>>,
        d.Field<"values", d.Utf8Type>
      >,
      {}
    >,
    string
  >
>;

// =============================================================================
// 1e. Cross-cutting: options don't leak across types
// =============================================================================

type _CrossDateBigInt = Expect<
  Equal<Scalar<d.DateType, { useDate: true; useBigInt: true }>, Date>
>;
type _CrossIntDate = Expect<
  Equal<Scalar<d.IntType<64>, { useDate: true; useBigInt: false }>, number>
>;
type _CrossAllInt64 = Expect<
  Equal<
    Scalar<
      d.IntType<64>,
      { useDate: true; useBigInt: true; useDecimalInt: true; useMap: true }
    >,
    bigint
  >
>;
type _CrossAllDecimal = Expect<
  Equal<
    Scalar<
      d.DecimalType,
      { useDate: true; useBigInt: true; useDecimalInt: true; useMap: true }
    >,
    bigint
  >
>;
type _CrossAllDate = Expect<
  Equal<
    Scalar<
      d.DateType,
      { useDate: true; useBigInt: true; useDecimalInt: true; useMap: true }
    >,
    Date
  >
>;
type _CrossAllMap = Expect<
  Equal<
    Scalar<
      d.MapType,
      { useDate: true; useBigInt: true; useDecimalInt: true; useMap: true }
    >,
    Map<unknown, unknown>
  >
>;

// List propagates options down
type _ListDateOption = Expect<
  Equal<
    Scalar<
      d.ListType<d.Field<"item", d.DateType>>,
      { useDate: true; useBigInt: true }
    >,
    Array<Date>
  >
>;
type _ListInt64Option = Expect<
  Equal<
    Scalar<
      d.ListType<d.Field<"item", d.IntType<64, true>>>,
      { useDate: true; useBigInt: true }
    >,
    BigInt64Array
  >
>;

// =============================================================================
// 2. ValueArray — what column.toArray() returns
// =============================================================================

// Non-nullable numerics → typed array
type _VA_Int32 = Expect<
  Equal<ValueArray<d.IntType<32, true>, {}, false>, Int32Array>
>;
type _VA_Float64 = Expect<
  Equal<ValueArray<d.FloatType<2>, {}, false>, Float64Array>
>;
type _VA_Int64BigInt = Expect<
  Equal<
    ValueArray<d.IntType<64, true>, { useBigInt: true }, false>,
    BigInt64Array
  >
>;

// Non-nullable non-numerics → Array
type _VA_Utf8 = Expect<
  Equal<ValueArray<d.Utf8Type, {}, false>, Array<string>>
>;
type _VA_Bool = Expect<
  Equal<ValueArray<d.BoolType, {}, false>, Array<boolean>>
>;

// Nullable numerics → typed array | Array<scalar | null>
// (depends on whether nulls are actually present at runtime)
type _VA_NullableInt32 = Expect<
  Equal<
    ValueArray<d.IntType<32, true>, {}, true>,
    Int32Array | Array<number | null>
  >
>;
type _VA_NullableFloat64 = Expect<
  Equal<
    ValueArray<d.FloatType<2>, {}, true>,
    Float64Array | Array<number | null>
  >
>;
type _VA_NullableInt64BigInt = Expect<
  Equal<
    ValueArray<d.IntType<64, true>, { useBigInt: true }, true>,
    BigInt64Array | Array<bigint | null>
  >
>;

// Nullable non-numerics → Array<scalar | null> (no typed array possible)
type _VA_NullableUtf8 = Expect<
  Equal<ValueArray<d.Utf8Type, {}, true>, Array<string | null>>
>;
type _VA_NullableBool = Expect<
  Equal<ValueArray<d.BoolType, {}, true>, Array<boolean | null>>
>;

// Date with useDate → no typed array (Date can't be in TypedArray)
type _VA_DateUseDate = Expect<
  Equal<ValueArray<d.DateType, { useDate: true }, false>, Array<Date>>
>;
type _VA_DateDefault = Expect<
  Equal<ValueArray<d.DateType, {}, false>, Float64Array>
>;
type _VA_NullableDateUseDate = Expect<
  Equal<
    ValueArray<d.DateType, { useDate: true }, true>,
    Array<Date | null>
  >
>;

// Uint types
type _VA_Uint8 = Expect<
  Equal<ValueArray<d.IntType<8, false>, {}, false>, Uint8Array>
>;
type _VA_Uint16 = Expect<
  Equal<ValueArray<d.IntType<16, false>, {}, false>, Uint16Array>
>;
type _VA_Uint32 = Expect<
  Equal<ValueArray<d.IntType<32, false>, {}, false>, Uint32Array>
>;
type _VA_Uint64 = Expect<
  Equal<ValueArray<d.IntType<64, false>, {}, false>, Float64Array>
>;
type _VA_Uint64BigInt = Expect<
  Equal<
    ValueArray<d.IntType<64, false>, { useBigInt: true }, false>,
    BigUint64Array
  >
>;

// Int64 default (no useBigInt) → Float64Array
type _VA_Int64Default = Expect<
  Equal<ValueArray<d.IntType<64, true>, {}, false>, Float64Array>
>;

// Time32/64
type _VA_Time32 = Expect<
  Equal<ValueArray<d.TimeType<32>, {}, false>, Int32Array>
>;
type _VA_Time64Default = Expect<
  Equal<ValueArray<d.TimeType<64>, {}, false>, Float64Array>
>;
type _VA_Time64BigInt = Expect<
  Equal<ValueArray<d.TimeType<64>, { useBigInt: true }, false>, BigInt64Array>
>;

// Timestamp
type _VA_TsDefault = Expect<
  Equal<ValueArray<d.TimestampType, {}, false>, Float64Array>
>;
type _VA_TsDate = Expect<
  Equal<ValueArray<d.TimestampType, { useDate: true }, false>, Array<Date>>
>;

// Duration
type _VA_DurDefault = Expect<
  Equal<ValueArray<d.DurationType, {}, false>, Float64Array>
>;
type _VA_DurBigInt = Expect<
  Equal<ValueArray<d.DurationType, { useBigInt: true }, false>, BigInt64Array>
>;

// Decimal
type _VA_DecDefault = Expect<
  Equal<ValueArray<d.DecimalType, {}, false>, Float64Array>
>;
type _VA_DecInt = Expect<
  Equal<
    ValueArray<d.DecimalType, { useDecimalInt: true }, false>,
    Array<bigint>
  >
>;

// Float16
type _VA_Float16 = Expect<
  Equal<ValueArray<d.FloatType<0>, {}, false>, Float64Array>
>;

// Nullable versions
type _VA_NullableUint32 = Expect<
  Equal<
    ValueArray<d.IntType<32, false>, {}, true>,
    Uint32Array | Array<number | null>
  >
>;
type _VA_NullableTime32 = Expect<
  Equal<ValueArray<d.TimeType<32>, {}, true>, Int32Array | Array<number | null>>
>;
type _VA_NullableTs = Expect<
  Equal<
    ValueArray<d.TimestampType, {}, true>,
    Float64Array | Array<number | null>
  >
>;
type _VA_NullableDur = Expect<
  Equal<
    ValueArray<d.DurationType, {}, true>,
    Float64Array | Array<number | null>
  >
>;
type _VA_NullableDateNoOpt = Expect<
  Equal<
    ValueArray<d.DateType, {}, true>,
    Float64Array | Array<number | null>
  >
>;

// =============================================================================
// Cross-cutting continued
// =============================================================================

// Dictionary propagates options through unwrap
type _DictListStr = Expect<
  Equal<
    Scalar<
      d.DictionaryType<d.ListType<d.Field<"item", d.Utf8Type>>>,
      {}
    >,
    Array<string>
  >
>;

// =============================================================================
// 3. Table inference — q.infer, row types, getChild, getChildAt
// =============================================================================

// -- Record form: row field types ---------------------------------------------

const _recSchema = q.table({
  id: q.int32(),
  name: q.utf8().nullable(),
  score: q.float64(),
}, { useDate: true });

type RecTable = q.infer<typeof _recSchema>;
declare const _rec: RecTable;
declare const _recRow: ReturnType<RecTable["at"]>;

type _RecRowId = Expect<Equal<typeof _recRow.id, number>>;
type _RecRowName = Expect<Equal<typeof _recRow.name, string | null>>;
type _RecRowScore = Expect<Equal<typeof _recRow.score, number>>;

// -- Record form: getChild resolves correct DataType per column ---------------

// Use declare + method call so TS resolves the generic at the call site.
// Then check .type (which is just D, no deep Scalar expansion).

// Column-level type tests need to call generic methods like getChild("id")
// to trigger TypeScript's call-site inference. But top-level `declare const`
// values cause runtime errors when methods are called on them.
//
// Pattern: wrap in a never-called function + use `null! as T` to get a
// typed value. TS checks types inside the function body even though it
// never runs. Access `.type` on Column to read the DataType directly —
// avoid decomposing the full Column generic (e.g. `Column<infer D, ...>`)
// which triggers "excessively deep" errors due to Scalar's recursion.
function _columnTests() {
  // -- Record form: getChild resolves correct DataType per column name ---
  const rec = null! as RecTable;
  const idCol = rec.getChild("id");
  const nameCol = rec.getChild("name");

  type _RecIdType = Expect<Equal<typeof idCol.type, d.IntType<32, true>>>;
  type _RecNameType = Expect<Equal<typeof nameCol.type, d.Utf8Type>>;

  // -- Tuple form: getChildAt is exact per index ------------------------
  const tupleSchema = q.table([
    ["id", q.int32()],
    ["name", q.utf8().nullable()],
    ["score", q.float64()],
  ]);
  type TupleTable = q.infer<typeof tupleSchema>;
  const tuple = null! as TupleTable;

  const col0 = tuple.getChildAt(0);
  const col1 = tuple.getChildAt(1);
  const col2 = tuple.getChildAt(2);

  type _TupleCol0 = Expect<Equal<typeof col0.type, d.IntType<32, true>>>;
  type _TupleCol1 = Expect<Equal<typeof col1.type, d.Utf8Type>>;
  type _TupleCol2 = Expect<Equal<typeof col2.type, d.FloatType<2>>>;

  // Tuple row type
  type TupleRow = ReturnType<TupleTable["at"]>;
  type _TupleRowId = Expect<Equal<TupleRow["id"], number>>;
  type _TupleRowName = Expect<Equal<TupleRow["name"], string | null>>;
  type _TupleRowScore = Expect<Equal<TupleRow["score"], number>>;

  // -- Record form: getChildAt returns union of column types -------------
  const mixedSchema = q.table({
    x: q.int64(),
    y: q.int32().nullable(),
  }, { useBigInt: true });
  type MixedTable = q.infer<typeof mixedSchema>;
  const mixed = null! as MixedTable;

  const mixedCol = mixed.getChildAt(0);
  type MixedColType = typeof mixedCol.type;

  type _MixedHasInt64 = Expect<
    Equal<d.IntType<64, true> extends MixedColType ? true : false, true>
  >;
  type _MixedHasInt32 = Expect<
    Equal<d.IntType<32, true> extends MixedColType ? true : false, true>
  >;
}

// -- Options propagation ------------------------------------------------------

const _bigintSchema2 = q.table({
  x: q.int64(),
  y: q.int32(),
}, { useBigInt: true });

type BigIntTable2 = q.infer<typeof _bigintSchema2>;
type BigIntRow2 = ReturnType<BigIntTable2["at"]>;

type _BigIntRowX = Expect<Equal<BigIntRow2["x"], bigint>>;
type _BigIntRowY = Expect<Equal<BigIntRow2["y"], number>>;
