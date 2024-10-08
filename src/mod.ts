export * from "@uwdata/flechette";
import * as f from "@uwdata/flechette";
import type { JsValue } from "./jsvalue.ts";
import type { DataType, Field, Schema } from "./data-types.ts";

type ValueArray<D extends DataType, T> = f.ValueArray<T>;

type Column<D extends DataType, T> = f.Column<T>;

type ResolveNullable<T, Nullable extends boolean> = Nullable extends true
	? T | null
	: T;

interface Table<
	Fields extends Array<Field>,
	ExtractionOptions extends f.ExtractionOptions,
> {
	readonly schema: Schema<Fields>;

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
			JsValue<
				Extract<Fields[number], Field<K>>["type"],
				ExtractionOptions
			>
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
	const ExtractionOptions extends f.ExtractionOptions = {},
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
	const ExtractionOptions extends f.ExtractionOptions = {},
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
