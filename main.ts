export * from "@uwdata/flechette";
import * as f from "@uwdata/flechette";

type ValueArray<DataType extends f.DataType, T> = f.ValueArray<T>;

type Column<DataType extends f.DataType, T> = f.Column<T>;

type JsValue<
  T extends f.DataType,
  Options extends f.ExtractionOptions,
> = T extends f.DictionaryType ? JsValue<T["dictionary"], Options>
  : T extends f.NoneType ? null
  : T extends f.NullType ? null
  : T extends f.IntType
    ? Options["useBigInt"] extends true ? (number | bigint) : number
  : T extends f.FloatType ? number
  : T extends
    f.BinaryType | f.FixedSizeBinaryType | f.LargeBinaryType | f.BinaryViewType
    ? Uint8Array
  : T extends f.Utf8Type | f.LargeUtf8Type | f.Utf8ViewType ? string
  : T extends f.BoolType ? boolean
  : T extends f.DecimalType
    ? Options["useDecimalBigInt"] extends true ? bigint : number
  : T extends f.DateType ? Options["useDate"] extends true ? Date : number
  : T extends f.TimeType
    ? Options["useBigInt"] extends true ? (number | bigint) : number
  : T extends f.TimestampType ? Options["useDate"] extends true ? Date : number
  : T extends f.IntervalType ? Options["useDate"] extends true ? Date : number
  : T extends
    | f.ListType
    | f.FixedSizeListType
    | f.LargeListType
    | f.ListViewType
    | f.LargeListViewType ? Array<unknown>
  : T extends f.StructType ? unknown
  : T extends f.UnionType ? unknown
  : T extends f.MapType ? Options["useMap"] extends true ? Map<string, unknown>
    : Array<[string, unknown]>
  : T extends f.DurationType
    ? Options["useBigInt"] extends true ? bigint : number
  : T extends f.RunEndEncodedType ? unknown
  : never;

type Field<Name extends string = string> = {
  readonly name: Name;
  readonly type: f.DataType;
};

interface Table<
  Fields extends Array<Field>,
  ExtractionOptions extends f.ExtractionOptions,
> {
  readonly schema: f.Schema;

  readonly names: {
    [K in keyof Fields]: Fields[K]["name"];
  };

  readonly children: {
    [K in keyof Fields]: Column<
      Fields[K]["type"],
      JsValue<Fields[K]["type"], ExtractionOptions>
    >;
  };

  readonly factory: f.StructFactory;

  get numCols(): number;

  get numRows(): number;

  getChildAt<Index extends number>(
    index: Index,
  ): Column<
    Fields[Index]["type"],
    JsValue<Fields[Index]["type"], ExtractionOptions>
  >;

  getChild<Name extends Fields[number]["name"]>(
    name: Name,
  ): Column<
    Extract<Fields[number], Field<Name>>["type"],
    JsValue<
      Extract<Fields[number], Field<Name>>["type"],
      ExtractionOptions
    >
  >;

  selectAt<const Indices extends number[]>(
    indices: Indices,
    as?: string[],
  ): Table<
    {
      [K in keyof Indices]: Fields[Indices[K]];
    },
    ExtractionOptions
  >;

  select<const Names extends Array<Fields[number]["name"]>>(
    names: Names,
    as?: string[],
  ): Table<
    {
      [K in keyof Names]: Extract<Fields[number], Field<Names[K]>>;
    },
    ExtractionOptions
  >;

  toColumns(): {
    [K in Fields[number]["name"]]: ValueArray<
      Extract<Fields[number], Field<K>>["type"],
      JsValue<
        Extract<Fields[number], Field<K>>["type"],
        ExtractionOptions
      >
    >;
  };

  toArray(): Array<
    {
      [K in Fields[number]["name"]]:
        | JsValue<
          Extract<Fields[number], Field<K>>["type"],
          ExtractionOptions
        >
        | null;
    }
  >;

  at(index: number): {
    [K in Fields[number]["name"]]:
      | JsValue<
        Extract<Fields[number], Field<K>>["type"],
        ExtractionOptions
      >
      | null;
  };

  get(index: number): {
    [K in Fields[number]["name"]]:
      | JsValue<
        Extract<Fields[number], Field<K>>["type"],
        ExtractionOptions
      >
      | null;
  };

  get [Symbol.toStringTag](): string;

  [Symbol.iterator](): Generator<
    {
      [K in Fields[number]["name"]]:
        | JsValue<
          Extract<Fields[number], Field<K>>["type"],
          ExtractionOptions
        >
        | null;
    },
    unknown,
    undefined
  >;
}

type UnwrapFieldType<T> = T extends Array<unknown> ? T[number] : T;

export function table<
  const DataTypes extends Record<string, f.DataType | Array<f.DataType>>,
  const ExtractionOptions extends f.ExtractionOptions,
>(types: DataTypes, options: ExtractionOptions) {
  return {
    parse(ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>): Table<
      Array<
        {
          [K in keyof DataTypes]: {
            name: K & string;
            type: UnwrapFieldType<DataTypes[K]>;
          };
        }[keyof DataTypes]
      >,
      ExtractionOptions
    > {
      return f.tableFromIPC(ipc, options) as any;
    },
  };
}

export type Infer<T> = T extends {
  parse: (ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>) => infer U;
} ? U
  : never;
