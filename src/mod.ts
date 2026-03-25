import * as f from "@uwdata/flechette";
import type * as d from "./data-types.ts";
import type { Table } from "./table.gen.ts";

export * from "@uwdata/flechette";
export type { DataType, Field, Schema } from "./data-types.ts";
export type { Scalar, ValueArray } from "./types.ts";
export type { Column, Table } from "./table.gen.ts";

// =============================================================================
// SchemaEntry — a descriptor for what a column's type should look like.
// No runtime flechette data — just match criteria.
// =============================================================================

interface TypeMatcher {
	typeId: number | number[];
	[key: string]: unknown;
}

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
		nullable() {
			return { ...this } as any;
		},
	};
}

// =============================================================================
// Specific builders — narrow match criteria
// =============================================================================

export function int8() {
	return schema<d.IntType<8, true>>({ typeId: 2, bitWidth: 8, signed: true });
}
export function int16() {
	return schema<d.IntType<16, true>>({
		typeId: 2,
		bitWidth: 16,
		signed: true,
	});
}
export function int32() {
	return schema<d.IntType<32, true>>({
		typeId: 2,
		bitWidth: 32,
		signed: true,
	});
}
export function int64() {
	return schema<d.IntType<64, true>>({
		typeId: 2,
		bitWidth: 64,
		signed: true,
	});
}
export function uint8() {
	return schema<d.IntType<8, false>>({
		typeId: 2,
		bitWidth: 8,
		signed: false,
	});
}
export function uint16() {
	return schema<d.IntType<16, false>>({
		typeId: 2,
		bitWidth: 16,
		signed: false,
	});
}
export function uint32() {
	return schema<d.IntType<32, false>>({
		typeId: 2,
		bitWidth: 32,
		signed: false,
	});
}
export function uint64() {
	return schema<d.IntType<64, false>>({
		typeId: 2,
		bitWidth: 64,
		signed: false,
	});
}

export function float16() {
	return schema<d.FloatType<0>>({ typeId: 3, precision: 0 });
}
export function float32() {
	return schema<d.FloatType<1>>({ typeId: 3, precision: 1 });
}
export function float64() {
	return schema<d.FloatType<2>>({ typeId: 3, precision: 2 });
}

export function utf8() {
	return schema<d.Utf8Type>({ typeId: 5 });
}
export function largeUtf8() {
	return schema<d.LargeUtf8Type>({ typeId: 20 });
}
export function utf8View() {
	return schema<d.Utf8ViewType>({ typeId: 24 });
}
export function bool() {
	return schema<d.BoolType>({ typeId: 6 });
}
export function binary() {
	return schema<d.BinaryType>({ typeId: 4 });
}
export function largeBinary() {
	return schema<d.LargeBinaryType>({ typeId: 19 });
}
export function binaryView() {
	return schema<d.BinaryViewType>({ typeId: 23 });
}

export function dateDay() {
	return schema<d.DateType<0>>({ typeId: 8, unit: 0 });
}
export function dateMillisecond() {
	return schema<d.DateType<1>>({ typeId: 8, unit: 1 });
}
export function timestamp(unit?: f.TimeUnit_, timezone?: string | null) {
	const match: TypeMatcher = { typeId: 10 };
	if (unit !== undefined) match.unit = unit;
	if (timezone !== undefined) match.timezone = timezone;
	return schema<d.TimestampType>(match);
}
export function duration(unit?: f.TimeUnit_) {
	const match: TypeMatcher = { typeId: 18 };
	if (unit !== undefined) match.unit = unit;
	return schema<d.DurationType>(match);
}

// =============================================================================
// Broad builders — match any variant of a type family
// =============================================================================

export function int() {
	return schema<d.IntType>({ typeId: 2 });
}
export function float() {
	return schema<d.FloatType>({ typeId: 3 });
}
export function date() {
	return schema<d.DateType>({ typeId: 8 });
}
export function string() {
	return schema<d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType>({
		typeId: [5, 20, 24],
	});
}

// =============================================================================
// Nested type builders
// =============================================================================

export function list(child: SchemaEntry) {
	return schema<d.ListType>({ typeId: 12, children: [child] });
}
export function struct(children: Record<string, SchemaEntry>) {
	return schema<d.StructType>({ typeId: 13, children });
}
export function dictionary(valueType: SchemaEntry) {
	return schema<d.DictionaryType>({ typeId: -1, dictionary: valueType });
}

// =============================================================================
// of — schema-level "accept any of these"
// =============================================================================

export function of(entries: SchemaEntry[]) {
	return {
		match: { typeId: -999, options: entries },
		nullable() {
			return { ...this } as any;
		},
	} as SchemaEntry;
}

// =============================================================================
// assertSchema — runtime validation
// =============================================================================

function matchesType(
	match: TypeMatcher,
	actual: f.DataType,
): boolean {
	// either() — try each option
	if ((match as any).options) {
		const options = (match as any).options as SchemaEntry[];
		return options.some((e) => matchesType(e.match, actual));
	}

	// typeId can be a number or array of numbers
	const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
	if (!typeIds.includes(actual.typeId)) return false;

	// Check additional properties
	for (const [key, expected] of Object.entries(match)) {
		if (key === "typeId") continue;

		// Nested children for list types
		if (key === "children" && Array.isArray(expected)) {
			const actualChildren = (actual as any).children;
			if (!actualChildren) return false;
			for (let i = 0; i < expected.length; i++) {
				const childEntry = expected[i] as SchemaEntry;
				if (!matchesType(childEntry.match, actualChildren[i]?.type)) {
					return false;
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
			if (!actualChildren) return false;
			const entries = Object.entries(
				expected as Record<string, SchemaEntry>,
			);
			if (entries.length !== actualChildren.length) return false;
			for (const [name, childEntry] of entries) {
				const actualChild = actualChildren.find((c) => c.name === name);
				if (!actualChild) return false;
				if (!matchesType(childEntry.match, actualChild.type)) {
					return false;
				}
			}
			continue;
		}

		// Dictionary value type
		if (key === "dictionary" && typeof expected === "object") {
			const dictEntry = expected as SchemaEntry;
			const actualDict = (actual as any).dictionary;
			if (!actualDict) return false;
			if (!matchesType(dictEntry.match, actualDict)) return false;
			continue;
		}

		// Simple property comparison
		if ((actual as any)[key] !== expected) return false;
	}

	return true;
}

function assertSchema(
	declared: Record<string, SchemaEntry>,
	actual: f.Schema,
) {
	const declaredNames = Object.keys(declared);
	const actualNames = actual.fields.map((f) => f.name);

	if (declaredNames.length !== actualNames.length) {
		throw new Error(
			`Schema mismatch: expected ${declaredNames.length} columns (${
				declaredNames.join(", ")
			}), got ${actualNames.length} (${actualNames.join(", ")})`,
		);
	}

	for (const name of declaredNames) {
		const actualField = actual.fields.find((f) => f.name === name);
		if (!actualField) {
			throw new Error(
				`Schema mismatch: column "${name}" not found. Got: ${
					actualNames.join(", ")
				}`,
			);
		}

		if (!matchesType(declared[name].match, actualField.type)) {
			throw new Error(
				`Schema mismatch: column "${name}" type mismatch`,
			);
		}
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

// Tuple form: ordered fields
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

// Record form: unordered fields
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
	// Normalize tuple form to record for assertSchema
	let record: Record<string, SchemaEntry>;
	if (Array.isArray(entries)) {
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
			assertSchema(record, table.schema);
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
