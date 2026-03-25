import * as f from "@uwdata/flechette";
import type * as d from "./data-types.ts";
import type { Table } from "./table.gen.ts";

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

export function timeSecond() {
	return schema<d.TimeType<32>>({ typeId: 9, bitWidth: 32, unit: 0 });
}
export function timeMillisecond() {
	return schema<d.TimeType<32>>({ typeId: 9, bitWidth: 32, unit: 1 });
}
export function timeMicrosecond() {
	return schema<d.TimeType<64>>({ typeId: 9, bitWidth: 64, unit: 2 });
}
export function timeNanosecond() {
	return schema<d.TimeType<64>>({ typeId: 9, bitWidth: 64, unit: 3 });
}

export function timestamp(unit?: f.TimeUnit_, timezone?: string | null) {
	const match: TypeMatcher = { typeId: 10 };
	if (unit !== undefined) match.unit = unit;
	if (timezone !== undefined) match.timezone = timezone;
	return schema<d.TimestampType>(match);
}
export function interval(unit?: f.IntervalUnit_) {
	const match: TypeMatcher = { typeId: 11 };
	if (unit !== undefined) match.unit = unit;
	return schema<d.IntervalType>(match);
}
export function duration(unit?: f.TimeUnit_) {
	const match: TypeMatcher = { typeId: 18 };
	if (unit !== undefined) match.unit = unit;
	return schema<d.DurationType>(match);
}

export function decimal(precision: number, scale: number, bitWidth?: number) {
	const match: TypeMatcher = { typeId: 7, precision, scale };
	if (bitWidth !== undefined) match.bitWidth = bitWidth;
	return schema<d.DecimalType>(match);
}
export function decimal32(precision: number, scale: number) {
	return schema<d.DecimalType<32>>({
		typeId: 7,
		precision,
		scale,
		bitWidth: 32,
	});
}
export function decimal64(precision: number, scale: number) {
	return schema<d.DecimalType<64>>({
		typeId: 7,
		precision,
		scale,
		bitWidth: 64,
	});
}
export function decimal128(precision: number, scale: number) {
	return schema<d.DecimalType<128>>({
		typeId: 7,
		precision,
		scale,
		bitWidth: 128,
	});
}
export function decimal256(precision: number, scale: number) {
	return schema<d.DecimalType<256>>({
		typeId: 7,
		precision,
		scale,
		bitWidth: 256,
	});
}

export function nullType() {
	return schema<d.NullType>({ typeId: 1 });
}

export function fixedSizeBinary(stride: number) {
	return schema<d.FixedSizeBinaryType>({ typeId: 15, stride });
}

// =============================================================================
// JS-type builders — match by JS scalar type
// =============================================================================

export const js = {
	/** Matches any Int or Float column. Scalar: `number`. */
	number: () => schema<d.IntType | d.FloatType>({ typeId: [2, 3] }),
	/**
	 * Matches any 64-bit Int column (int64, uint64). Scalar: `bigint`.
	 *
	 * Requires `{ useBigInt: true }` in table options — without it values
	 * are returned as `number` and may lose precision beyond 2^53.
	 */
	bigint: () => schema<d.IntType<64>>({ typeId: 2, bitWidth: 64 }),
	/** Matches any string column (Utf8, LargeUtf8, Utf8View). Scalar: `string`. */
	string: () =>
		schema<d.Utf8Type | d.LargeUtf8Type | d.Utf8ViewType>({
			typeId: [5, 20, 24],
		}),
	/** Matches a Bool column. Scalar: `boolean`. */
	boolean: () => schema<d.BoolType>({ typeId: 6 }),
	/** Matches any binary column (Binary, LargeBinary, BinaryView, FixedSizeBinary). Scalar: `Uint8Array`. */
	bytes: () =>
		schema<
			| d.BinaryType
			| d.LargeBinaryType
			| d.BinaryViewType
			| d.FixedSizeBinaryType
		>({ typeId: [4, 19, 23, 15] }),
	/**
	 * Matches any date-like column (Date, Timestamp, Interval). Scalar: `Date`.
	 *
	 * Requires `{ useDate: true }` in table options — without it values
	 * are returned as `number` (epoch milliseconds).
	 */
	date: () =>
		schema<d.DateType | d.TimestampType | d.IntervalType>({
			typeId: [8, 10, 11],
		}),
};

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
export function time() {
	return schema<d.TimeType>({ typeId: 9 });
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
export function largeList(child: SchemaEntry) {
	return schema<d.LargeListType>({ typeId: 21, children: [child] });
}
export function listView(child: SchemaEntry) {
	return schema<d.ListViewType>({ typeId: 25, children: [child] });
}
export function largeListView(child: SchemaEntry) {
	return schema<d.LargeListViewType>({ typeId: 26, children: [child] });
}
export function fixedSizeList(child: SchemaEntry, stride: number) {
	return schema<d.FixedSizeListType>({
		typeId: 16,
		stride,
		children: [child],
	});
}
export function struct(children: Record<string, SchemaEntry>) {
	return schema<d.StructType>({ typeId: 13, children });
}
export function map(key: SchemaEntry, value: SchemaEntry) {
	return schema<d.MapType>({
		typeId: 17,
		children: [{ key, value }],
	});
}
export function dictionary(valueType: SchemaEntry) {
	return schema<d.DictionaryType>({ typeId: -1, dictionary: valueType });
}
export function runEndEncoded(runs: SchemaEntry, values: SchemaEntry) {
	return schema<d.RunEndEncodedType>({
		typeId: 22,
		children: [runs, values],
	});
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
// QuiverError — structured schema validation errors (zod-compatible shape)
// =============================================================================

export type QuiverIssueCode =
	| "column-count"
	| "column-missing"
	| "type-mismatch";

export interface QuiverIssue {
	code: QuiverIssueCode;
	path: string[];
	message: string;
	expected?: string;
	received?: string;
}

export class QuiverError extends Error {
	issues: QuiverIssue[];

	constructor(issues: QuiverIssue[]) {
		super();
		this.issues = issues;
		this.message = this.issues.map((i) => {
			const loc = i.path.length > 0 ? i.path.join(".") + ": " : "";
			return loc + i.message;
		}).join("\n");
		this.name = "QuiverError";
	}

	/** Flat error summary matching zod's flatten() shape. */
	flatten(): {
		formErrors: string[];
		fieldErrors: Record<string, string[]>;
	} {
		const formErrors: string[] = [];
		const fieldErrors: Record<string, string[]> = {};
		for (const issue of this.issues) {
			if (issue.path.length > 0) {
				const key = issue.path[0];
				fieldErrors[key] = fieldErrors[key] || [];
				fieldErrors[key].push(issue.message);
			} else {
				formErrors.push(issue.message);
			}
		}
		return { formErrors, fieldErrors };
	}
}

// =============================================================================
// assertSchema — runtime validation, collects all issues
// =============================================================================

function describeType(type: f.DataType): string {
	const t = type as Record<string, unknown>;
	switch (type.typeId) {
		case 2:
			return `Int(${t.bitWidth}, ${t.signed ? "signed" : "unsigned"})`;
		case 3:
			return `Float(precision=${t.precision})`;
		case 7:
			return `Decimal(${t.precision}, ${t.scale}, bitWidth=${t.bitWidth})`;
		case 8:
			return `Date(unit=${t.unit})`;
		case 9:
			return `Time(bitWidth=${t.bitWidth}, unit=${t.unit})`;
		case 10:
			return `Timestamp(unit=${t.unit}, tz=${t.timezone})`;
		case 11:
			return `Interval(unit=${t.unit})`;
		case 12:
			return "List";
		case 13:
			return "Struct";
		case 14:
			return "Union";
		case 17:
			return "Map";
		case 18:
			return `Duration(unit=${t.unit})`;
		case -1:
			return "Dictionary";
		default: {
			const names: Record<number, string> = {
				0: "None",
				1: "Null",
				4: "Binary",
				5: "Utf8",
				6: "Bool",
				15: "FixedSizeBinary",
				16: "FixedSizeList",
				19: "LargeBinary",
				20: "LargeUtf8",
				21: "LargeList",
				22: "RunEndEncoded",
				23: "BinaryView",
				24: "Utf8View",
				25: "ListView",
				26: "LargeListView",
			};
			return names[type.typeId] ?? `Unknown(typeId=${type.typeId})`;
		}
	}
}

function describeMatcher(match: TypeMatcher): string {
	if ((match as any).options) {
		const options = (match as any).options as SchemaEntry[];
		return options.map((e) => describeMatcher(e.match)).join(" | ");
	}
	const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
	const parts: string[] = [];
	for (const [key, val] of Object.entries(match)) {
		if (key === "typeId" || key === "children" || key === "dictionary") {
			continue;
		}
		parts.push(`${key}=${val}`);
	}
	const names: Record<number, string> = {
		0: "None",
		1: "Null",
		2: "Int",
		3: "Float",
		4: "Binary",
		5: "Utf8",
		6: "Bool",
		7: "Decimal",
		8: "Date",
		9: "Time",
		10: "Timestamp",
		11: "Interval",
		12: "List",
		13: "Struct",
		14: "Union",
		15: "FixedSizeBinary",
		16: "FixedSizeList",
		17: "Map",
		18: "Duration",
		19: "LargeBinary",
		20: "LargeUtf8",
		21: "LargeList",
		22: "RunEndEncoded",
		23: "BinaryView",
		24: "Utf8View",
		25: "ListView",
		26: "LargeListView",
		[-1]: "Dictionary",
	};
	const typeNames = typeIds.map((id) => names[id] ?? `typeId=${id}`);
	const typePart = typeNames.length === 1
		? typeNames[0]
		: typeNames.join(" | ");
	return parts.length > 0 ? `${typePart}(${parts.join(", ")})` : typePart;
}

function collectTypeIssues(
	match: TypeMatcher,
	actual: f.DataType,
	path: string[],
	issues: QuiverIssue[],
): void {
	// of() — try each option
	if ((match as any).options) {
		const options = (match as any).options as SchemaEntry[];
		if (!options.some((e) => matchesType(e.match, actual))) {
			issues.push({
				code: "type-mismatch",
				path,
				message: `Expected ${describeMatcher(match)}, received ${
					describeType(actual)
				}`,
				expected: describeMatcher(match),
				received: describeType(actual),
			});
		}
		return;
	}

	// typeId check
	const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
	if (!typeIds.includes(actual.typeId)) {
		issues.push({
			code: "type-mismatch",
			path,
			message: `Expected ${describeMatcher(match)}, received ${
				describeType(actual)
			}`,
			expected: describeMatcher(match),
			received: describeType(actual),
		});
		return;
	}

	// Check additional properties
	for (const [key, expected] of Object.entries(match)) {
		if (key === "typeId") continue;

		// Nested children for list types
		if (key === "children" && Array.isArray(expected)) {
			const actualChildren = (actual as any).children;
			if (!actualChildren) continue;
			for (let i = 0; i < expected.length; i++) {
				const childEntry = expected[i] as SchemaEntry;
				if (actualChildren[i]?.type) {
					collectTypeIssues(
						childEntry.match,
						actualChildren[i].type,
						[...path, actualChildren[i].name ?? String(i)],
						issues,
					);
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
			if (!actualChildren) continue;
			for (
				const [name, childEntry] of Object.entries(
					expected as Record<string, SchemaEntry>,
				)
			) {
				const actualChild = actualChildren.find((c) => c.name === name);
				if (!actualChild) {
					issues.push({
						code: "column-missing",
						path: [...path, name],
						message: `Struct field "${name}" not found`,
					});
				} else {
					collectTypeIssues(
						childEntry.match,
						actualChild.type,
						[...path, name],
						issues,
					);
				}
			}
			continue;
		}

		// Dictionary value type
		if (key === "dictionary" && typeof expected === "object") {
			const dictEntry = expected as SchemaEntry;
			const actualDict = (actual as any).dictionary;
			if (actualDict) {
				collectTypeIssues(
					dictEntry.match,
					actualDict,
					[...path, "dictionary"],
					issues,
				);
			}
			continue;
		}

		// Map children — special structure { key, value }
		if (
			key === "children" && Array.isArray(expected) &&
			expected.length === 1 && (expected[0] as any).key
		) {
			continue; // map children handled by typeId match
		}

		// Simple property comparison
		if ((actual as any)[key] !== expected) {
			issues.push({
				code: "type-mismatch",
				path,
				message: `Expected ${key}=${expected}, received ${key}=${
					(actual as any)[key]
				}`,
				expected: String(expected),
				received: String((actual as any)[key]),
			});
		}
	}
}

/** Simple boolean check (used by of() internally). */
function matchesType(
	match: TypeMatcher,
	actual: f.DataType,
): boolean {
	const issues: QuiverIssue[] = [];
	collectTypeIssues(match, actual, [], issues);
	return issues.length === 0;
}

/**
 * Validate a parsed schema against declared entries.
 * strict=true (tuple form): exact column count required
 * strict=false (record form): partial — only declared columns checked
 */
function assertSchema(
	declared: Record<string, SchemaEntry>,
	actual: f.Schema,
	strict: boolean,
) {
	const issues: QuiverIssue[] = [];
	const declaredNames = Object.keys(declared);
	const actualNames = actual.fields.map((f) => f.name);

	if (strict && declaredNames.length !== actualNames.length) {
		issues.push({
			code: "column-count",
			path: [],
			message: `Expected ${declaredNames.length} columns (${
				declaredNames.join(", ")
			}), got ${actualNames.length} (${actualNames.join(", ")})`,
			expected: String(declaredNames.length),
			received: String(actualNames.length),
		});
	}

	for (const name of declaredNames) {
		const actualField = actual.fields.find((f) => f.name === name);
		if (!actualField) {
			issues.push({
				code: "column-missing",
				path: [name],
				message: `Column "${name}" not found in table. Available: ${
					actualNames.join(", ")
				}`,
			});
			continue;
		}

		collectTypeIssues(declared[name].match, actualField.type, [name], issues);
	}

	if (issues.length > 0) {
		throw new QuiverError(issues);
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

// Tuple form: strict — exact column count and order required.
// getChildAt(i) returns the exact column type at that index.
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

// Record form: partial — only declared columns are validated, extra
// columns in the table are ignored. Use getChild("name") for typed
// column access. getChildAt(i) is UNSAFE here: the index may refer to
// a column that wasn't declared or validated, but the type system will
// still claim it's one of the declared types.
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
	// Tuple form is strict (exact columns), record form is partial
	const strict = Array.isArray(entries);
	let record: Record<string, SchemaEntry>;
	if (strict) {
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
			assertSchema(record, table.schema, strict);
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
