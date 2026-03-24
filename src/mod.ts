export * from "@uwdata/flechette";
import * as f from "@uwdata/flechette";
import type { DataType } from "./data-types.ts";

export type { DataType, Field, Schema } from "./data-types.ts";
export type { Scalar, ValueArray } from "./jsvalue.ts";
export type { Column, Table } from "./table.gen.ts";

type UnwrapFieldType<T> = T extends Array<unknown> ? T[number] : T;

export function table<
	const DataTypes extends Array<
		readonly [string, DataType | Array<DataType>]
	>,
	const ExtractionOptions extends f.ExtractionOptions = {},
>(types: DataTypes, options?: ExtractionOptions): {
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): import("./table.gen.ts").Table<
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
	parseIPC(
		ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>,
	): import("./table.gen.ts").Table<
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
