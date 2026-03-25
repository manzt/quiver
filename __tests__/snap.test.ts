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
//^? { id: number; name: string | null; score: number; active: boolean; }

// =============================================================================
// Record form — getChild by name
// =============================================================================

const idCol = bt.getChild("id");
//^? q.Column<IntType<32, true>, {}, false>

const nameCol = bt.getChild("name");
//^? q.Column<Utf8Type, {}, true>

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
//^? { x: number; y: string | null; z: number; }

const col0 = ot.getChildAt(0);
//^? q.Column<IntType<32, true>, {}, false>

const col1 = ot.getChildAt(1);
//^? q.Column<Utf8Type, {}, true>

const col2 = ot.getChildAt(2);
//^? q.Column<FloatType<2>, {}, false>

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
//^? { big: bigint; small: number; ubig: bigint; }

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
//^? { day: Date; ms: Date; ts: Date; num: number; }

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
//^? { d128: bigint; d32: bigint; f: number; }

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
//^? { day: number; num: number; text: string; t: number; n: number; }

// =============================================================================
// either
// =============================================================================

const eitherSchema = q.table({
  val: q.either([q.int32(), q.float64()]),
  label: q.utf8().nullable(),
});

type EitherTable = q.infer<typeof eitherSchema>;
declare const et: EitherTable;

const eitherRow = et.at(0);
//^? { val: any; label: string | null; }

// =============================================================================
// Nested — list
// =============================================================================

const listSchema = q.table({
  tags: q.list(q.utf8()),
  scores: q.list(q.int32()),
  nested: q.list(q.list(q.float64())),
});

type ListTable = q.infer<typeof listSchema>;
declare const lt: ListTable;

const listRow = lt.at(0);
//^? { tags: Uint8Array<ArrayBufferLike> | Int8Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | Int16Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike> | Int32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | Float64Array<ArrayBufferLike> | ... 6 more ... | Float64Array<...>; scores: Uint8Array<ArrayBufferLike> | ... 14 more ... | Float64Array<...>; nested: Uint8Array<ArrayBufferLike> | ... 14 more ... | Float64Array<...>; }

// =============================================================================
// Nested — struct
// =============================================================================

const structSchema = q.table({
  meta: q.struct({
    key: q.utf8(),
    count: q.int32(),
  }),
});

type StructTable = q.infer<typeof structSchema>;
declare const st: StructTable;

const structRow = st.at(0);
//^? { meta: { [x: string]: any; }; }

// =============================================================================
// Nested — dictionary
// =============================================================================

const dictSchema = q.table({
  category: q.dictionary(q.utf8()),
  code: q.dictionary(q.int32()),
});

type DictTable = q.infer<typeof dictSchema>;
declare const dict: DictTable;

const dictRow = dict.at(0);
//^? { category: any; code: any; }

// =============================================================================
// Select preserves types
// =============================================================================

const selected = bt.select(["id", "score"]);
//^? q.Table<[{ name: "id"; type: IntType<32, true>; nullable: false; }, { name: "score"; type: FloatType<2>; nullable: false; }], {}>

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
//^? { a: number | null; b: string | null; c: boolean | null; }

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
//^? { required: number; optional: string | null; }

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
//^? { i8: number; i16: number; i32: number; i64: number; u8: number; u16: number; u32: number; u64: number; }

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
//^? { b: Uint8Array<ArrayBufferLike>; lb: Uint8Array<ArrayBufferLike>; bv: Uint8Array<ArrayBufferLike>; fsb: Uint8Array<ArrayBufferLike>; }

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
//^? { ms: number; sec: number; us: bigint; ns: bigint; }
