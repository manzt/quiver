#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
/**
 * Codegen script: reads flechette's .d.ts files and generates
 * quiver's generic Table, Column, and DataType wrappers.
 *
 * Usage: deno run -A scripts/codegen.ts
 *
 * Re-run when flechette is updated to pick up new members or
 * signature changes. The script will flag anything it can't
 * auto-transform.
 */

import * as path from "jsr:@std/path";

// ---------------------------------------------------------------------------
// 1. Locate flechette's .d.ts files
// ---------------------------------------------------------------------------

async function findFlechetteTypes(): Promise<string> {
	const cmd = new Deno.Command("deno", {
		args: ["info", "--json", "npm:@uwdata/flechette"],
		stdout: "piped",
	});
	const output = await cmd.output();
	const text = new TextDecoder().decode(output.stdout);
	const info = JSON.parse(text);

	// Find the npm cache path
	for (const [, mod] of Object.entries(info.npmPackages ?? {})) {
		const m = mod as { name: string; version: string };
		if (m.name === "@uwdata/flechette") {
			// Build the cache path
			const roots = info.roots ?? [];
			for (const root of roots) {
				if (root.startsWith("npm:")) {
					// Find in modules
					for (const module of info.modules ?? []) {
						if (module.local && module.local.includes("flechette")) {
							return path.dirname(
								module.local.replace(/\/dist\/.*/, "/dist/types"),
							);
						}
					}
				}
			}
		}
	}

	// Fallback: search common paths
	const home = Deno.env.get("HOME") ?? "";
	const candidates = [
		`${home}/Library/Caches/deno/npm/registry.npmjs.org/@uwdata/flechette`,
		`${home}/.cache/deno/npm/registry.npmjs.org/@uwdata/flechette`,
	];

	for (const base of candidates) {
		try {
			for await (const entry of Deno.readDir(base)) {
				if (entry.isDirectory) {
					const typesDir = path.join(
						base,
						entry.name,
						"dist/types",
					);
					try {
						await Deno.stat(path.join(typesDir, "table.d.ts"));
						return typesDir;
					} catch { /* continue */ }
				}
			}
		} catch { /* continue */ }
	}

	throw new Error("Could not find flechette .d.ts files");
}

// ---------------------------------------------------------------------------
// 2. Parse flechette's Table and Column .d.ts
// ---------------------------------------------------------------------------

interface MemberInfo {
	name: string;
	kind: "property" | "method" | "getter" | "symbol-getter" | "symbol-method";
	signature: string;
	readonly: boolean;
	private: boolean;
	returnType?: string;
	params?: string;
	comments: string;
}

function parseClassMembers(source: string, className: string): MemberInfo[] {
	const members: MemberInfo[] = [];

	// Extract the class body
	const classRegex = new RegExp(
		`export class ${className}[^{]*\\{([\\s\\S]*?)\\n\\}`,
	);
	const match = source.match(classRegex);
	if (!match) throw new Error(`Could not find class ${className}`);
	const body = match[1];

	// Split into member blocks (each preceded by comments or whitespace)
	const lines = body.split("\n");
	let currentComment = "";
	let i = 0;

	while (i < lines.length) {
		const line = lines[i].trim();

		// Accumulate comments
		if (
			line.startsWith("/**") || line.startsWith("*") ||
			line.startsWith("*/")
		) {
			currentComment += lines[i] + "\n";
			i++;
			continue;
		}

		if (line === "" || line === "{" || line === "}") {
			if (line === "") currentComment = "";
			i++;
			continue;
		}

		// Skip constructor
		if (line.startsWith("constructor(")) {
			currentComment = "";
			i++;
			continue;
		}

		const isPrivate = line.includes("private ");
		const isReadonly = line.includes("readonly ");

		// Getter: get name(): type
		const getterMatch = line.match(
			/get (\w+)\(\):\s*(.+);/,
		);
		if (getterMatch) {
			members.push({
				name: getterMatch[1],
				kind: "getter",
				signature: line,
				readonly: true,
				private: isPrivate,
				returnType: getterMatch[2],
				comments: currentComment,
			});
			currentComment = "";
			i++;
			continue;
		}

		// Symbol getter: get [Symbol.xxx](): type
		const symbolGetterMatch = line.match(
			/get \[Symbol\.(\w+)\]\(\):\s*(.+);/,
		);
		if (symbolGetterMatch) {
			members.push({
				name: `[Symbol.${symbolGetterMatch[1]}]`,
				kind: "symbol-getter",
				signature: line,
				readonly: true,
				private: isPrivate,
				returnType: symbolGetterMatch[2],
				comments: currentComment,
			});
			currentComment = "";
			i++;
			continue;
		}

		// Symbol method: [Symbol.iterator](): type
		const symbolMethodMatch = line.match(
			/\[Symbol\.(\w+)\]\(\):\s*(.+);/,
		);
		if (symbolMethodMatch) {
			members.push({
				name: `[Symbol.${symbolMethodMatch[1]}]`,
				kind: "symbol-method",
				signature: line,
				readonly: false,
				private: isPrivate,
				returnType: symbolMethodMatch[2],
				comments: currentComment,
			});
			currentComment = "";
			i++;
			continue;
		}

		// Method: name(params): returnType
		const methodMatch = line.match(
			/(\w+)\(([^)]*)\):\s*(.+);/,
		);
		if (methodMatch) {
			members.push({
				name: methodMatch[1],
				kind: "method",
				signature: line,
				readonly: false,
				private: isPrivate,
				returnType: methodMatch[3],
				params: methodMatch[2],
				comments: currentComment,
			});
			currentComment = "";
			i++;
			continue;
		}

		// Property: readonly name: type;  or  name: type;
		const propMatch = line.match(
			/(?:readonly\s+)?(\w+):\s*(.+);/,
		);
		if (propMatch) {
			members.push({
				name: propMatch[1],
				kind: "property",
				signature: line,
				readonly: isReadonly,
				private: isPrivate,
				returnType: propMatch[2],
				comments: currentComment,
			});
			currentComment = "";
			i++;
			continue;
		}

		// Unrecognized line
		console.error(`  [WARN] Unrecognized member: ${line}`);
		currentComment = "";
		i++;
	}

	return members;
}

// ---------------------------------------------------------------------------
// 3. Get flechette version
// ---------------------------------------------------------------------------

async function getFlechetteVersion(typesDir: string): Promise<string> {
	// Go up from dist/types to package root and read package.json
	const pkgPath = path.join(typesDir, "../../package.json");
	try {
		const pkg = JSON.parse(await Deno.readTextFile(pkgPath));
		return pkg.version;
	} catch {
		return "unknown";
	}
}

// ---------------------------------------------------------------------------
// 4. Generate quiver's generic Table interface
// ---------------------------------------------------------------------------

function generateTable(members: MemberInfo[]): string {
	const publicMembers = members.filter((m) => !m.private);

	const lines: string[] = [];

	for (const m of publicMembers) {
		// Add original signature as doc comment
		if (m.comments.trim()) {
			lines.push(m.comments.trimEnd());
		}

		switch (m.name) {
			case "schema":
				lines.push(`\treadonly schema: Schema<Fields>;`);
				break;

			case "names":
				lines.push(
					`\treadonly names: { [K in keyof Fields]: Fields[K]["name"] };`,
				);
				break;

			case "children":
				lines.push(`\treadonly children: {`);
				lines.push(
					`\t\t[K in keyof Fields]: Column<Fields[K]["type"], Options, Fields[K]["nullable"]>;`,
				);
				lines.push(`\t};`);
				break;

			case "factory":
				lines.push(
					`\treadonly factory: import("@uwdata/flechette").StructFactory;`,
				);
				break;

			case "numCols":
				lines.push(`\tget numCols(): number;`);
				break;

			case "numRows":
				lines.push(`\tget numRows(): number;`);
				break;

			case "getChildAt":
				lines.push(`\tgetChildAt<Index extends number>(`);
				lines.push(`\t\tindex: Index,`);
				lines.push(
					`\t): Column<Fields[Index]["type"], Options, Fields[Index]["nullable"]>;`,
				);
				break;

			case "getChild":
				lines.push(
					`\tgetChild<Name extends Fields[number]["name"]>(`,
				);
				lines.push(`\t\tname: Name,`);
				lines.push(
					`\t): Column<Extract<Fields[number], { name: Name }>["type"], Options, Extract<Fields[number], { name: Name }>["nullable"]>;`,
				);
				break;

			case "selectAt":
				lines.push(
					`\tselectAt<const Indices extends number[]>(`,
				);
				lines.push(`\t\tindices: Indices,`);
				lines.push(`\t\tas?: string[],`);
				lines.push(`\t): Table<`);
				lines.push(`\t\t{ [K in keyof Indices]: Fields[Indices[K]] },`);
				lines.push(`\t\tOptions`);
				lines.push(`\t>;`);
				break;

			case "select":
				lines.push(
					`\tselect<const Names extends Array<Fields[number]["name"]>>(`,
				);
				lines.push(`\t\tnames: Names,`);
				lines.push(`\t\tas?: string[],`);
				lines.push(`\t): Table<`);
				lines.push(
					`\t\t{ [K in keyof Names]: Extract<Fields[number], { name: Names[K] }> },`,
				);
				lines.push(`\t\tOptions`);
				lines.push(`\t>;`);
				break;

			case "toColumns":
				lines.push(`\ttoColumns(): Prettify<{`);
				lines.push(
					`\t\t[K in Fields[number]["name"]]: ValueArray<Extract<Fields[number], { name: K }>["type"], Options, Extract<Fields[number], { name: K }>["nullable"]>;`,
				);
				lines.push(`\t}>;`);
				break;

			case "toArray":
				lines.push(`\ttoArray(): Array<Prettify<Row<Fields, Options>>>;`);
				break;

			case "at":
				lines.push(
					`\tat(index: number): Prettify<Row<Fields, Options>>;`,
				);
				break;

			case "get":
				lines.push(
					`\tget(index: number): Prettify<Row<Fields, Options>>;`,
				);
				break;

			case "[Symbol.toStringTag]":
				lines.push(`\tget [Symbol.toStringTag](): string;`);
				break;

			case "[Symbol.iterator]":
				lines.push(
					`\t[Symbol.iterator](): Generator<Prettify<Row<Fields, Options>>, unknown, undefined>;`,
				);
				break;

			default:
				lines.push(
					`\t// TODO: unknown member '${m.name}' — ${m.signature}`,
				);
				break;
		}

		lines.push("");
	}

	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 5. Generate quiver's generic Column interface
// ---------------------------------------------------------------------------

function generateColumn(members: MemberInfo[]): string {
	const publicMembers = members.filter((m) => !m.private);

	const lines: string[] = [];

	for (const m of publicMembers) {
		if (m.comments.trim()) {
			lines.push(m.comments.trimEnd());
		}

		switch (m.name) {
			case "type":
				lines.push(`\treadonly type: D;`);
				break;

			case "length":
				lines.push(`\treadonly length: number;`);
				break;

			case "nullCount":
				lines.push(`\treadonly nullCount: number;`);
				break;

			case "data":
				lines.push(
					`\treadonly data: readonly import("@uwdata/flechette").Batch<Scalar<D, Options>>[];`,
				);
				break;

			case "at":
				lines.push(
					`\tat(index: number): ResolveNullable<Scalar<D, Options>, Nullable>;`,
				);
				break;

			case "offsets":
				lines.push(`\treadonly offsets: Int32Array;`);
				break;

			case "get":
				lines.push(
					`\tget(index: number): ResolveNullable<Scalar<D, Options>, Nullable>;`,
				);
				break;

			case "toArray":
				lines.push(
					`\ttoArray(): ValueArray<D, Options, Nullable>;`,
				);
				break;

			case "cache":
				lines.push(
					`\tcache(): import("@uwdata/flechette").ValueArray<Scalar<D, Options>>;`,
				);
				break;

			case "_cache":
				lines.push(
					`\t_cache: import("@uwdata/flechette").ValueArray<Scalar<D, Options>>;`,
				);
				break;

			case "[Symbol.toStringTag]":
				lines.push(`\tget [Symbol.toStringTag](): string;`);
				break;

			case "[Symbol.iterator]":
				lines.push(
					`\t[Symbol.iterator](): Iterator<ResolveNullable<Scalar<D, Options>, Nullable>>;`,
				);
				break;

			default:
				lines.push(
					`\t// TODO: unknown member '${m.name}' — ${m.signature}`,
				);
				break;
		}

		lines.push("");
	}

	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------

async function main() {
	const typesDir = await findFlechetteTypes();
	const version = await getFlechetteVersion(typesDir);
	console.log(`Found flechette v${version} types at: ${typesDir}`);

	const tableSource = await Deno.readTextFile(
		path.join(typesDir, "table.d.ts"),
	);
	const columnSource = await Deno.readTextFile(
		path.join(typesDir, "column.d.ts"),
	);

	const tableMembers = parseClassMembers(tableSource, "Table");
	const columnMembers = parseClassMembers(columnSource, "Column");

	console.log(
		`Parsed Table: ${tableMembers.length} members (${
			tableMembers.filter((m) => !m.private).length
		} public)`,
	);
	console.log(
		`Parsed Column: ${columnMembers.length} members (${
			columnMembers.filter((m) => !m.private).length
		} public)`,
	);

	// Check for unknown members
	const knownTableMembers = new Set([
		"schema",
		"names",
		"children",
		"factory",
		"numCols",
		"numRows",
		"getChildAt",
		"getChild",
		"selectAt",
		"select",
		"toColumns",
		"toArray",
		"at",
		"get",
		"[Symbol.toStringTag]",
		"[Symbol.iterator]",
	]);
	const knownColumnMembers = new Set([
		"type",
		"length",
		"nullCount",
		"data",
		"at",
		"offsets",
		"get",
		"toArray",
		"cache",
		"_cache",
		"[Symbol.toStringTag]",
		"[Symbol.iterator]",
	]);

	for (const m of tableMembers) {
		if (!m.private && !knownTableMembers.has(m.name)) {
			console.warn(
				`⚠ NEW Table member: '${m.name}' — needs manual generification`,
			);
		}
	}
	for (const m of columnMembers) {
		if (!m.private && !knownColumnMembers.has(m.name)) {
			console.warn(
				`⚠ NEW Column member: '${m.name}' — needs manual generification`,
			);
		}
	}

	const tableBody = generateTable(tableMembers);
	const columnBody = generateColumn(columnMembers);

	const output = `\
// Auto-generated from @uwdata/flechette@${version}
// Run \`deno run -A scripts/codegen.ts\` to regenerate.
// Do not edit manually.

import type { ExtractionOptions } from "@uwdata/flechette";
import type { DataType, Field, Schema } from "./data-types.ts";
import type { Scalar, ValueArray } from "./jsvalue.ts";

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type ResolveNullable<T, Nullable extends boolean> = Nullable extends true
\t? T | null
\t: T;

type Row<Fields extends Array<Field>, Options extends ExtractionOptions> = {
\t[K in Fields[number]["name"]]: ResolveNullable<
\t\tScalar<
\t\t\tExtract<Fields[number], { name: K }>["type"],
\t\t\tOptions
\t\t>,
\t\tExtract<Fields[number], { name: K }>["nullable"]
\t>;
};

export interface Table<
\tFields extends Array<Field>,
\tOptions extends ExtractionOptions = {},
> {
${tableBody}
}

export interface Column<
\tD extends DataType,
\tOptions extends ExtractionOptions = {},
\tNullable extends boolean = false,
> {
${columnBody}
}
`;

	const outPath = path.join(
		path.dirname(path.fromFileUrl(import.meta.url)),
		"../src/table.gen.ts",
	);
	await Deno.writeTextFile(outPath, output);
	console.log(`\nWritten to: ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	Deno.exit(1);
});
