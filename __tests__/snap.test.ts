// deno-lint-ignore-file no-unused-vars
import * as q from "../src/mod.ts";

// =============================================================================
// Record form — row types
// =============================================================================

const basic = q.table({
  id: q.int32(),
  name: q.utf8().nullable(),
  score: q.float64(),
  active: q.bool(),
});

type BasicTable = q.infer<typeof basic>;
declare const bt: BasicTable;

const basicRow = bt.at(0);
//    ^? { id: number; name: string | null; score: number; active: boolean; }

// =============================================================================
// Record form — getChild by name
// =============================================================================

const idCol = bt.getChild("id");
//    ^? q.Column<IntType<32, true>, {}, false>

const nameCol = bt.getChild("name");
//    ^? q.Column<Utf8Type, {}, true>

// =============================================================================
// Tuple form — ordered fields
// =============================================================================

const ordered = q.table([
  ["x", q.int32()],
  ["y", q.utf8().nullable()],
  ["z", q.float64()],
]);

type OrderedTable = q.infer<typeof ordered>;
declare const ot: OrderedTable;

const orderedRow = ot.at(0);
//    ^? { x: number; y: string | null; z: number; }

const col0 = ot.getChildAt(0);
//    ^? q.Column<IntType<32, true>, {}, false>

const col1 = ot.getChildAt(1);
//    ^? q.Column<Utf8Type, {}, true>

const col2 = ot.getChildAt(2);
//    ^? q.Column<FloatType<2>, {}, false>

// =============================================================================
// Options — useBigInt
// =============================================================================

const bigintSchema = q.table({
  big: q.int64(),
  small: q.int32(),
  ubig: q.uint64(),
}, { useBigInt: true });

type BigIntTable = q.infer<typeof bigintSchema>;
declare const bit: BigIntTable;

const bigRow = bit.at(0);
//    ^? { big: bigint; small: number; ubig: bigint; }

// =============================================================================
// Options — useDate
// =============================================================================

const dateSchema = q.table({
  day: q.dateDay(),
  ms: q.dateMillisecond(),
  ts: q.timestamp(),
  num: q.int32(),
}, { useDate: true });

type DateTable = q.infer<typeof dateSchema>;
declare const dt: DateTable;

const dateRow = dt.at(0);
//    ^? { day: Date; ms: Date; ts: Date; num: number; }

// =============================================================================
// Options — useDecimalInt
// =============================================================================

const decSchema = q.table({
  d128: q.decimal128(10, 2),
  d32: q.decimal32(5, 2),
  f: q.float64(),
}, { useDecimalInt: true });

type DecTable = q.infer<typeof decSchema>;
declare const dect: DecTable;

const decRow = dect.at(0);
//    ^? { d128: bigint; d32: bigint; f: number; }

// =============================================================================
// Broad builders
// =============================================================================

const broad = q.table({
  num: q.int(),
  text: q.string(),
  day: q.date(),
  t: q.time(),
  n: q.float(),
});

type BroadTable = q.infer<typeof broad>;
declare const brt: BroadTable;

const broadRow = brt.at(0);
//    ^? { day: number; num: number; text: string; t: number; n: number; }

// =============================================================================
// Select preserves types
// =============================================================================

const selected = bt.select(["id", "score"]);
//    ^? q.Table<[{ name: "id"; type: IntType<32, true>; nullable: false; }, { name: "score"; type: FloatType<2>; nullable: false; }], {}>

// =============================================================================
// Nullable — all nullable fields
// =============================================================================

const nullableSchema = q.table({
  a: q.int32().nullable(),
  b: q.utf8().nullable(),
  c: q.bool().nullable(),
});

type NullableTable = q.infer<typeof nullableSchema>;
declare const nt: NullableTable;

const nullableRow = nt.at(0);
//    ^? { a: number | null; b: string | null; c: boolean | null; }

// =============================================================================
// Mixed nullable + non-nullable
// =============================================================================

const mixedSchema = q.table({
  required: q.int32(),
  optional: q.utf8().nullable(),
});

type MixedTable = q.infer<typeof mixedSchema>;
declare const mt: MixedTable;

const mixedRow = mt.at(0);
//    ^? { required: number; optional: string | null; }

// =============================================================================
// All the specific int types
// =============================================================================

const intSchema = q.table({
  i8: q.int8(),
  i16: q.int16(),
  i32: q.int32(),
  i64: q.int64(),
  u8: q.uint8(),
  u16: q.uint16(),
  u32: q.uint32(),
  u64: q.uint64(),
});

type IntTable = q.infer<typeof intSchema>;
declare const it: IntTable;

const intRow = it.at(0);
//    ^? { i8: number; i16: number; i32: number; i64: number; u8: number; u16: number; u32: number; u64: number; }

// =============================================================================
// Binary types
// =============================================================================

const binSchema = q.table({
  b: q.binary(),
  lb: q.largeBinary(),
  bv: q.binaryView(),
  fsb: q.fixedSizeBinary(16),
});

type BinTable = q.infer<typeof binSchema>;
declare const bint: BinTable;

const binRow = bint.at(0);
//    ^? { b: Uint8Array<ArrayBufferLike>; lb: Uint8Array<ArrayBufferLike>; bv: Uint8Array<ArrayBufferLike>; fsb: Uint8Array<ArrayBufferLike>; }

// =============================================================================
// Time types
// =============================================================================

const timeSchema = q.table({
  sec: q.timeSecond(),
  ms: q.timeMillisecond(),
  us: q.timeMicrosecond(),
  ns: q.timeNanosecond(),
}, { useBigInt: true });

type TimeTable = q.infer<typeof timeSchema>;
declare const tt: TimeTable;

const timeRow = tt.at(0);
//    ^? { ms: number; sec: number; us: bigint; ns: bigint; }

// =============================================================================
// int64 without useBigInt — should still be number
// =============================================================================

const int64Default = q.table({ x: q.int64() });
type Int64Default = q.infer<typeof int64Default>;
declare const i64d: Int64Default;
const i64Row = i64d.at(0);
//    ^? { x: number; }

// =============================================================================
// uint64 with useBigInt
// =============================================================================

const uint64Big = q.table({ x: q.uint64() }, { useBigInt: true });
type Uint64Big = q.infer<typeof uint64Big>;
declare const u64b: Uint64Big;
const u64Row = u64b.at(0);
//    ^? { x: bigint; }

// =============================================================================
// Float types — all three
// =============================================================================

const floats = q.table({
  f16: q.float16(),
  f32: q.float32(),
  f64: q.float64(),
});
type FloatTable = q.infer<typeof floats>;
declare const flt: FloatTable;
const floatRow = flt.at(0);
//    ^? { f16: number; f32: number; f64: number; }

// =============================================================================
// String types — all three
// =============================================================================

const strings = q.table({
  u: q.utf8(),
  lu: q.largeUtf8(),
  uv: q.utf8View(),
});
type StringTable = q.infer<typeof strings>;
declare const strt: StringTable;
const stringRow = strt.at(0);
//    ^? { u: string; lu: string; uv: string; }

// =============================================================================
// Duration with and without useBigInt
// =============================================================================

const durDefault = q.table({ d: q.duration() });
type DurDefault = q.infer<typeof durDefault>;
declare const durd: DurDefault;
const durDefaultRow = durd.at(0);
//    ^? { d: number; }

const durBigInt = q.table({ d: q.duration() }, { useBigInt: true });
type DurBigInt = q.infer<typeof durBigInt>;
declare const durb: DurBigInt;
const durBigIntRow = durb.at(0);
//    ^? { d: bigint; }

// =============================================================================
// Interval
// =============================================================================

const intervalSchema = q.table({ i: q.interval() });
type IntervalTable = q.infer<typeof intervalSchema>;
declare const ivt: IntervalTable;
const intervalRow = ivt.at(0);
//    ^? { i: number; }

const intervalDate = q.table({ i: q.interval() }, { useDate: true });
type IntervalDateTable = q.infer<typeof intervalDate>;
declare const ivdt: IntervalDateTable;
const intervalDateRow = ivdt.at(0);
//    ^? { i: Date; }

// =============================================================================
// Timestamp with and without useDate
// =============================================================================

const tsDefault = q.table({ ts: q.timestamp() });
type TsDefault = q.infer<typeof tsDefault>;
declare const tsd: TsDefault;
const tsDefaultRow = tsd.at(0);
//    ^? { ts: number; }

const tsDate = q.table({ ts: q.timestamp() }, { useDate: true });
type TsDate = q.infer<typeof tsDate>;
declare const tsdt: TsDate;
const tsDateRow = tsdt.at(0);
//    ^? { ts: Date; }

// =============================================================================
// Null type
// =============================================================================

const nullSchema = q.table({ n: q.nullType() });
type NullTable = q.infer<typeof nullSchema>;
declare const nult: NullTable;
const nullRow = nult.at(0);
//    ^? { n: null; }

// =============================================================================
// FixedSizeBinary
// =============================================================================

const fsbSchema = q.table({ h: q.fixedSizeBinary(32) });
type FsbTable = q.infer<typeof fsbSchema>;
declare const fsbt: FsbTable;
const fsbRow = fsbt.at(0);
//    ^? { h: Uint8Array<ArrayBufferLike>; }

// =============================================================================
// Single column table
// =============================================================================

const single = q.table({ only: q.bool() });
type SingleTable = q.infer<typeof single>;
declare const sgl: SingleTable;
const singleRow = sgl.at(0);
//    ^? { only: boolean; }

// =============================================================================
// Tuple form — single column
// =============================================================================

const tupleSingle = q.table([["x", q.int32()]]);
type TupleSingle = q.infer<typeof tupleSingle>;
declare const ts1: TupleSingle;
const tupleSingleRow = ts1.at(0);
//    ^? { x: number; }

const tupleSingleCol = ts1.getChildAt(0);
//    ^? q.Column<IntType<32, true>, {}, false>

// =============================================================================
// Record form getChildAt — returns union (unsafe)
// =============================================================================

const multi = q.table({
  a: q.int32(),
  b: q.utf8().nullable(),
});
type MultiTable = q.infer<typeof multi>;
declare const mlt: MultiTable;
const multiChildAt = mlt.getChildAt(0);
//    ^? q.Column<IntType<32, true>, {}, false> | q.Column<Utf8Type, {}, true>

// =============================================================================
// All options at once
// =============================================================================

const allOpts = q.table({
  big: q.int64(),
  day: q.dateDay(),
  dec: q.decimal128(10, 2),
  txt: q.utf8(),
}, { useBigInt: true, useDate: true, useDecimalInt: true });
type AllOptsTable = q.infer<typeof allOpts>;
declare const aot: AllOptsTable;
const allOptsRow = aot.at(0);
//    ^? { big: bigint; day: Date; dec: bigint; txt: string; }

// =============================================================================
// Tuple selectAt
// =============================================================================

const tupleSelect = ot.selectAt([0, 2]);
//    ^? q.Table<[{ name: "x"; type: IntType<32, true>; nullable: false; }, { name: "z"; type: FloatType<2>; nullable: false; }], {}>

// =============================================================================
// ----------------------------- TODO ------------------------------------------
// The snapshots below reveal type inference bugs where builder child
// types don't propagate through SchemaEntry generics. Fix the builders,
// then update the snapshots.
// =============================================================================

// either — should be { val: number; label: string | null; }
const eitherSchema = q.table({
  val: q.either([q.int32(), q.float64()]),
  label: q.utf8().nullable(),
});
type EitherTable = q.infer<typeof eitherSchema>;
declare const et: EitherTable;
const eitherRow = et.at(0);
//    ^? { val: any; label: string | null; }

// list — should be { tags: Array<string>; scores: Int32Array; ... }
const listSchema = q.table({
  tags: q.list(q.utf8()),
  scores: q.list(q.int32()),
  nested: q.list(q.list(q.float64())),
});
type ListTable = q.infer<typeof listSchema>;
declare const lt: ListTable;
const listRow = lt.at(0);
//    ^? { tags: Uint8Array<ArrayBufferLike> | Int8Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | Int16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | Int32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | ... 6 more ... | Float64Array<...>; scores: Uint8Array<ArrayBufferLike> | ... 14 more ... | Float64Array<...>; nested: Uint8Array<ArrayBufferLike> | ... 14 more ... | Float64Array<...>; }

// struct — should be { meta: { key: string; count: number; }; }
const structSchema = q.table({
  meta: q.struct({ key: q.utf8(), count: q.int32() }),
});
type StructTable = q.infer<typeof structSchema>;
declare const st: StructTable;
const structRow = st.at(0);
//    ^? { meta: { [x: string]: any; }; }

// dictionary — should be { category: string; code: number; }
const dictSchema = q.table({
  category: q.dictionary(q.utf8()),
  code: q.dictionary(q.int32()),
});
type DictTable = q.infer<typeof dictSchema>;
declare const dict: DictTable;
const dictRow = dict.at(0);
//    ^? { category: any; code: any; }

// decimal32 with useDecimalInt — should be { d: number; } not bigint
const dec32Schema = q.table({
  d: q.decimal32(5, 2),
}, { useDecimalInt: true });
type Dec32Table = q.infer<typeof dec32Schema>;
declare const d32t: Dec32Table;
const dec32Row = d32t.at(0);
//    ^? { d: bigint; }

// struct with useBigInt — should propagate through children
const structOptsSchema = q.table({
  s: q.struct({ val: q.int64() }),
}, { useBigInt: true });
type StructOptsTable = q.infer<typeof structOptsSchema>;
declare const sot: StructOptsTable;
const structOptsRow = sot.at(0);
//    ^? { s: { [x: string]: any; }; }

// list with useBigInt — should propagate to child
const listOptsSchema = q.table({
  vals: q.list(q.int64()),
}, { useBigInt: true });
type ListOptsTable = q.infer<typeof listOptsSchema>;
declare const lot: ListOptsTable;
const listOptsRow = lot.at(0);
//    ^? { vals: Uint8Array<ArrayBufferLike> | Int8Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | Int16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | Int32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float32Array<ArrayBufferLike> | ... 7 more ... | BigInt64Array<...>; }

// nested struct of struct
const deepStruct = q.table({
  outer: q.struct({ inner: q.struct({ x: q.int32() }) }),
});
type DeepStructTable = q.infer<typeof deepStruct>;
declare const dst: DeepStructTable;
const deepStructRow = dst.at(0);
//    ^? { outer: { [x: string]: any; }; }

// map — should be { kv: Array<[string, number]>; }
const mapSchema = q.table({
  kv: q.map(q.utf8(), q.int32()),
});
type MapTable = q.infer<typeof mapSchema>;
declare const mapt: MapTable;
const mapRow = mapt.at(0);
//    ^? { kv: [unknown, unknown][]; }

// =============================================================================
// ----------------------------- END TODO --------------------------------------
// =============================================================================
