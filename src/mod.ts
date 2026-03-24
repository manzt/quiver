import * as f from "@uwdata/flechette";
export * from "@uwdata/flechette";

export type { DataType, Field, Schema } from "./data-types.ts";
export type { Scalar, ValueArray } from "./jsvalue.ts";
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
	T extends f.DataType = f.DataType,
	Nullable extends boolean = boolean,
> {
	readonly match: TypeMatcher;
	readonly isNullable: Nullable;
	nullable(): SchemaEntry<T, true>;
}

function schema<T extends f.DataType>(
	match: TypeMatcher,
): SchemaEntry<T, false> {
	return {
		match,
		isNullable: false as const,
		nullable() {
			return { ...this, isNullable: true as const };
		},
	};
}

// =============================================================================
// Specific builders — narrow match criteria
// =============================================================================

export function int8() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 8, signed: true });
}
export function int16() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 16, signed: true });
}
export function int32() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 32, signed: true });
}
export function int64() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 64, signed: true });
}
export function uint8() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 8, signed: false });
}
export function uint16() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 16, signed: false });
}
export function uint32() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 32, signed: false });
}
export function uint64() {
	return schema<f.IntType>({ typeId: 2, bitWidth: 64, signed: false });
}

export function float16() {
	return schema<f.FloatType>({ typeId: 3, precision: 0 });
}
export function float32() {
	return schema<f.FloatType>({ typeId: 3, precision: 1 });
}
export function float64() {
	return schema<f.FloatType>({ typeId: 3, precision: 2 });
}

export function utf8() {
	return schema<f.Utf8Type>({ typeId: 5 });
}
export function largeUtf8() {
	return schema<f.LargeUtf8Type>({ typeId: 20 });
}
export function utf8View() {
	return schema<f.Utf8ViewType>({ typeId: 24 });
}
export function bool() {
	return schema<f.BoolType>({ typeId: 6 });
}
export function binary() {
	return schema<f.BinaryType>({ typeId: 4 });
}
export function largeBinary() {
	return schema<f.LargeBinaryType>({ typeId: 19 });
}
export function binaryView() {
	return schema<f.BinaryViewType>({ typeId: 23 });
}

export function dateDay() {
	return schema<f.DateType>({ typeId: 8, unit: 0 });
}
export function dateMillisecond() {
	return schema<f.DateType>({ typeId: 8, unit: 1 });
}
export function timestamp(unit?: f.TimeUnit_, timezone?: string | null) {
	const match: TypeMatcher = { typeId: 10 };
	if (unit !== undefined) match.unit = unit;
	if (timezone !== undefined) match.timezone = timezone;
	return schema<f.TimestampType>(match);
}
export function duration(unit?: f.TimeUnit_) {
	const match: TypeMatcher = { typeId: 18 };
	if (unit !== undefined) match.unit = unit;
	return schema<f.DurationType>(match);
}

// =============================================================================
// Broad builders — match any variant of a type family
// =============================================================================

export function int() {
	return schema<f.IntType>({ typeId: 2 });
}
export function float() {
	return schema<f.FloatType>({ typeId: 3 });
}
export function date() {
	return schema<f.DateType>({ typeId: 8 });
}
export function string() {
	return schema<f.Utf8Type | f.LargeUtf8Type | f.Utf8ViewType>({
		typeId: [5, 20, 24],
	});
}

// =============================================================================
// Nested type builders
// =============================================================================

export function list(child: SchemaEntry) {
	return schema<f.ListType>({ typeId: 12, children: [child] });
}
export function struct(children: Record<string, SchemaEntry>) {
	return schema<f.StructType>({ typeId: 13, children });
}
export function dictionary(valueType: SchemaEntry) {
	return schema<f.DictionaryType>({ typeId: -1, dictionary: valueType });
}

// =============================================================================
// either — schema-level "accept any of these"
// =============================================================================

export function either(entries: SchemaEntry[]) {
	const entry = {
		match: { typeId: -999, options: entries },
		isNullable: entries.some((e) => e.isNullable),
		nullable() {
			return { ...this, isNullable: true as const };
		},
	};
	return entry as SchemaEntry;
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
	const typeIds = Array.isArray(match.typeId)
		? match.typeId
		: [match.typeId];
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
				const actualChild = actualChildren.find((c) =>
					c.name === name
				);
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
			`Schema mismatch: expected ${declaredNames.length} columns (${declaredNames.join(", ")}), got ${actualNames.length} (${actualNames.join(", ")})`,
		);
	}

	for (const name of declaredNames) {
		const actualField = actual.fields.find((f) => f.name === name);
		if (!actualField) {
			throw new Error(
				`Schema mismatch: column "${name}" not found. Got: ${actualNames.join(", ")}`,
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
// table() — accepts SchemaEntry wrappers, validates on parse
// =============================================================================

export function table<
	const Entries extends Record<string, SchemaEntry>,
	const Options extends f.ExtractionOptions = {},
>(entries: Entries, options?: Options) {
	return {
		parseIPC(ipc: ArrayBuffer | Uint8Array | Array<Uint8Array>) {
			const table = f.tableFromIPC(ipc, options);
			assertSchema(entries, table.schema);
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
