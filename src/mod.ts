export * from "@uwdata/flechette";
import * as f from "@uwdata/flechette";
import type { JsValue, ValueArray } from "./jsvalue.ts";
import type { DataType, Field, Schema } from "./data-types.ts";

type ResolveNullable<T, Nullable extends boolean> = Nullable extends true
	? T | null
	: T;

/**
 * A data column. A column provides a view over one or more value batches,
 * each drawn from an Arrow record batch. While this class supports random
 * access to column values by integer index; however, extracting arrays using
 * `toArray()` or iterating over values (`for (const value of column) {...}`)
 * provide more efficient ways for bulk access or scanning.
 */
interface Column<T extends DataType, Options extends f.ExtractionOptions> {
	/** The column data type. */
	readonly type: T;
	/** The column length. */
	readonly length: number;
	/** The count of null values in the column. */
	readonly nullCount: number;
	/** An array of column data batches. */
	readonly data: f.Batch<JsValue<T, Options>>[];
	/**
	 * Index offsets for data batches.
	 * Used to map a column row index to a batch-specific index.
	 */
	readonly offsets: Int32Array;
	/**
	 * Return the column value at the given index. If a column has multiple
	 * batches, this method performs binary search over the batch lengths to
	 * determine the batch from which to retrieve the value. The search makes
	 * lookup less efficient than a standard array access. If making a full
	 * scan of a column, consider extracting arrays via `toArray()` or using an
	 * iterator (`for (const value of column) {...}`).
	 */
	at(index: number): JsValue<T, Options>;
	/**
	 * Return the column value at the given index. This method is the same as
	 * `at()` and is provided for better compatibility with Apache Arrow JS.
	 */
	get(index: number): JsValue<T, Options>;
	/**
	 * Extract column values into a single array instance. When possible,
	 * a zero-copy subarray of the input Arrow data is returned.
	 */
	toArray(): ValueArray<T, Options>;
	/**
	 * Return an array of cached column values.
	 * Used internally to accelerate dictionary types.
	 */
	cache(): ValueArray<T, Options>;
	/**
	 * Provide an informative object string tag.
	 */
	get [Symbol.toStringTag](): string;
	/**
	 * Return an iterator over the values in this column.
	 * @returns {Iterator<T?>}
	 */
	[Symbol.iterator](): Iterator<JsValue<T, Options>>;
}

interface Table<
	Fields extends Array<Field>,
	ExtractionOptions extends f.ExtractionOptions,
> {
	readonly schema: Schema<Fields>;

	readonly names: {
		[K in keyof Fields]: Fields[K]["name"];
	};

	readonly children: {
		[K in keyof Fields]: Column<Fields[K]["type"], ExtractionOptions>;
	};

	readonly factory: f.StructFactory;

	get numCols(): number;

	get numRows(): number;

	getChildAt<Index extends number>(
		index: Index,
	): Column<Fields[Index]["type"], ExtractionOptions>;

	getChild<Name extends Fields[number]["name"]>(
		name: Name,
	): Column<Extract<Fields[number], Field<Name>>["type"], ExtractionOptions>;

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
			[K in keyof Names]: Extract<
				Fields[number],
				Field<Names[K]>
			>;
		},
		ExtractionOptions
	>;

	toColumns(): {
		[K in Fields[number]["name"]]: ValueArray<
			Extract<Fields[number], Field<K>>["type"],
			ExtractionOptions
		>;
	};

	toArray(): Array<
		{
			[K in Fields[number]["name"]]: ResolveNullable<
				JsValue<
					Extract<
						Fields[number],
						Field<K>
					>["type"],
					ExtractionOptions
				>,
				Extract<Fields[number], Field<K>>["nullable"]
			>;
		}
	>;

	at(index: number): {
		[K in Fields[number]["name"]]: ResolveNullable<
			JsValue<
				Extract<Fields[number], Field<K>>["type"],
				ExtractionOptions
			>,
			Extract<Fields[number], Field<K>>["nullable"]
		>;
	};

	get(index: number): {
		[K in Fields[number]["name"]]: ResolveNullable<
			JsValue<
				Extract<Fields[number], Field<K>>["type"],
				ExtractionOptions
			>,
			Extract<Fields[number], Field<K>>["nullable"]
		>;
	};

	get [Symbol.toStringTag](): string;

	[Symbol.iterator](): Generator<
		{
			[K in Fields[number]["name"]]: ResolveNullable<
				JsValue<
					Extract<
						Fields[number],
						Field<K>
					>["type"],
					ExtractionOptions
				>,
				Extract<Fields[number], Field<K>>["nullable"]
			>;
		},
		unknown,
		undefined
	>;
}

type UnwrapFieldType<T> = T extends Array<unknown> ? T[number] : T;

export function table<
	const DataTypes extends Array<
		readonly [string, DataType | Array<DataType>]
	>,
	const ExtractionOptions extends f.ExtractionOptions = Record<string, unknown>,
>(types: DataTypes, options?: ExtractionOptions): {
	parseIPC(ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>): Table<
		{
			[K in keyof DataTypes]: {
				name: DataTypes[K][0];
				type: UnwrapFieldType<DataTypes[K][1]>;
				nullable: false;
			};
		},
		ExtractionOptions
	>;
};

export function table<
	const DataTypes extends Record<string, DataType | Array<DataType>>,
	const ExtractionOptions extends f.ExtractionOptions = Record<string, unknown>,
>(types: DataTypes, options?: ExtractionOptions): {
	parseIPC(ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>): Table<
		Array<
			{
				[K in keyof DataTypes]: {
					name: K & string;
					type: UnwrapFieldType<DataTypes[K]>;
					nullable: false;
				};
			}[keyof DataTypes]
		>,
		ExtractionOptions
	>;
};

export function table(
	types:
		| Array<[name: string, type: f.DataType | Array<f.DataType>]>
		| Record<string, f.DataType | Array<f.DataType>>,
	options: f.ExtractionOptions = {},
) {
	return {
		parseIPC(ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>) {
			let table = f.tableFromIPC(ipc, options);
			if (Array.isArray(types)) {
				// assert that the table has the same number of columns as the types
				//
				// If the table isn't in the right order, we can just select the columns in
				// order if it's all correct.
				//
				// e.g., if it passes column assertions
				// table = table.select(types.map(([name]) => name));
			} else {
				// assert that the table has the same columns as the types
			}
			// deno-lint-ignore no-explicit-any
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
