// Auto-generated from @uwdata/flechette@2.3.0
// Run `deno run -A scripts/codegen.ts` to regenerate.
// Do not edit manually.

import type { ExtractionOptions } from "@uwdata/flechette";
import type { DataType, Field, Schema } from "./data-types.ts";
import type { Scalar, ValueArray } from "./types.ts";

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type ResolveNullable<T, Nullable extends boolean> = Nullable extends true
	? T | null
	: T;

// Distributive: produces a union of Columns instead of a Column with unioned generics
type DistributeColumn<F, Options extends ExtractionOptions> = F extends Field
	? Column<F["type"], Options, F["nullable"]>
	: never;

type Row<Fields extends Array<Field>, Options extends ExtractionOptions> = {
	[K in Fields[number]["name"]]: ResolveNullable<
		Scalar<
			Extract<Fields[number], { name: K }>["type"],
			Options
		>,
		Extract<Fields[number], { name: K }>["nullable"]
	>;
};

export interface Table<
	Fields extends Array<Field>,
	Options extends ExtractionOptions = {},
> {
	/**
	 * @type {Schema}
	 * @readonly
	 */
	readonly schema: Schema<Fields>;

	/**
	 * @type {(keyof T)[]}
	 * @readonly
	 */
	readonly names: { [K in keyof Fields]: Fields[K]["name"] };

	/**
	 * @type {Column[]}
	 * @readonly
	 */
	readonly children: {
		[K in keyof Fields]: Column<
			Fields[K]["type"],
			Options,
			Fields[K]["nullable"]
		>;
	};

	/**
	 * @type {StructFactory}
	 * @readonly
	 */
	readonly factory: import("@uwdata/flechette").StructFactory;

	/**
	 * The number of columns in this table.
	 * @return {number} The number of columns.
	 */
	get numCols(): number;

	/**
	 * The number of rows in this table.
	 * @return {number} The number of rows.
	 */
	get numRows(): number;

	/**
	 * Return the child column at the given index position.
	 * @param {number} index The column index.
	 */
	getChildAt<Index extends number>(
		index: Index,
	): DistributeColumn<Fields[Index], Options>;

	/**
	 * Return the first child column with the given name.
	 * @param {string} name The column name.
	 */
	getChild<Name extends Fields[number]["name"]>(
		name: Name,
	): Column<
		Extract<Fields[number], { name: Name }>["type"],
		Options,
		Extract<Fields[number], { name: Name }>["nullable"]
	>;

	/**
	 * Construct a new table containing only columns at the specified indices.
	 * @param {number[]} indices The indices of columns to keep.
	 * @param {string[]} [as] Optional new names for selected columns.
	 */
	selectAt<const Indices extends number[]>(
		indices: Indices,
		as?: string[],
	): Table<
		{ [K in keyof Indices]: Fields[Indices[K]] },
		Options
	>;

	/**
	 * Construct a new table containing only columns with the specified names.
	 * @param {string[]} names Names of columns to keep.
	 * @param {string[]} [as] Optional new names for selected columns.
	 */
	select<const Names extends Array<Fields[number]["name"]>>(
		names: Names,
		as?: string[],
	): Table<
		{ [K in keyof Names]: Extract<Fields[number], { name: Names[K] }> },
		Options
	>;

	/**
	 * Return an object mapping column names to extracted value arrays.
	 * @returns {{ [P in keyof T]: ValueArray<T[P]> }}
	 */
	toColumns(): Prettify<
		{
			[K in Fields[number]["name"]]: ValueArray<
				Extract<Fields[number], { name: K }>["type"],
				Options,
				Extract<Fields[number], { name: K }>["nullable"]
			>;
		}
	>;

	/**
	 * Return an array of objects representing the rows of this table.
	 * @returns {{ [P in keyof T]: T[P] }[]}
	 */
	toArray(): Array<Prettify<Row<Fields, Options>>>;

	/**
	 * Return a row object for the given index.
	 * @param {number} index The row index.
	 * @returns {{ [P in keyof T]: T[P] }} The row object.
	 */
	at(index: number): Prettify<Row<Fields, Options>>;

	/**
	 * Return a row object for the given index. This method is the same as
	 * `at()` and is provided for better compatibility with Apache Arrow JS.
	 * @param {number} index The row index.
	 * @returns {{ [P in keyof T]: T[P] }} The row object.
	 */
	get(index: number): Prettify<Row<Fields, Options>>;

	/**
	 * Provide an informative object string tag.
	 */
	get [Symbol.toStringTag](): string;

	/**
	 * Return an iterator over objects representing the rows of this table.
	 * @returns {Generator<{ [P in keyof T]: T[P] }, any, any>}
	 */
	[Symbol.iterator](): Generator<
		Prettify<Row<Fields, Options>>,
		unknown,
		undefined
	>;
}

export interface Column<
	D extends DataType,
	Options extends ExtractionOptions = {},
	Nullable extends boolean = false,
> {
	/**
	 * The column data type.
	 * @type {DataType}
	 * @readonly
	 */
	readonly type: D;

	/**
	 * The column length.
	 * @type {number}
	 * @readonly
	 */
	readonly length: number;

	/**
	 * The count of null values in the column.
	 * @type {number}
	 * @readonly
	 */
	readonly nullCount: number;

	/**
	 * An array of column data batches.
	 * @type {readonly Batch<T>[]}
	 * @readonly
	 */
	readonly data: readonly import("@uwdata/flechette").Batch<
		Scalar<D, Options>
	>[];

	/**
	 * Return the column value at the given index. If a column has multiple
	 * batches, this method performs binary search over the batch lengths to
	 * determine the batch from which to retrieve the value. The search makes
	 * lookup less efficient than a standard array access. If making a full
	 * scan of a column, consider extracting arrays via `toArray()` or using an
	 * iterator (`for (const value of column) {...}`).
	 * @param {number} index The row index.
	 * @returns {T | null} The value.
	 */
	at(index: number): ResolveNullable<Scalar<D, Options>, Nullable>;

	/**
	 * Index offsets for data batches.
	 * Used to map a column row index to a batch-specific index.
	 * @type {Int32Array}
	 * @readonly
	 */
	readonly offsets: Int32Array;

	/**
	 * Return the column value at the given index. This method is the same as
	 * `at()` and is provided for better compatibility with Apache Arrow JS.
	 * @param {number} index The row index.
	 * @returns {T | null} The value.
	 */
	get(index: number): ResolveNullable<Scalar<D, Options>, Nullable>;

	/**
	 * Extract column values into a single array instance. When possible,
	 * a zero-copy subarray of the input Arrow data is returned.
	 * @returns {ValueArray<T?>}
	 */
	toArray(): ValueArray<D, Options, Nullable>;

	/**
	 * Return an array of cached column values.
	 * Used internally to accelerate dictionary types.
	 */
	cache(): import("@uwdata/flechette").ValueArray<Scalar<D, Options>>;

	_cache: import("@uwdata/flechette").ValueArray<Scalar<D, Options>>;

	/**
	 * Provide an informative object string tag.
	 */
	get [Symbol.toStringTag](): string;

	/**
	 * Return an iterator over the values in this column.
	 * @returns {Iterator<T?>}
	 */
	[Symbol.iterator](): Iterator<ResolveNullable<Scalar<D, Options>, Nullable>>;
}
