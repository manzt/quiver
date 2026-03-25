/**
 * Playground for exploring quiver's type system.
 *
 * Hover over variables in your editor to see inferred types.
 * Run: deno check example.ts
 */

// deno-lint-ignore-file no-unused-vars

import * as q from "./src/mod.ts";

// =============================================================================
// Define a schema using builders
// =============================================================================

const schema = q.table({
	id: q.int32(),
	name: q.utf8().nullable(),
	score: q.float64(),
	created: q.dateDay(),
}, { useDate: true });

type MyTable = q.infer<typeof schema>;
declare const table: MyTable;

// Hover over these!
const row = table.at(0);
// { id: number; name: string | null; score: number; created: Date }

const rows = table.toArray();
const cols = table.toColumns();

// Type-safe column access
const idCol = table.getChild("id");
const nameCol = table.getChild("name");

// Select preserves types
const sub = table.select(["id", "created"]);
const subRow = sub.at(0); // { id: number; created: Date }

// =============================================================================
// Different options change the types
// =============================================================================

const bigintSchema = q.table({
	x: q.int64(),
	y: q.int32(),
}, { useBigInt: true });

type BigIntTable = q.infer<typeof bigintSchema>;
declare const bt: BigIntTable;
const brow = bt.at(0); // { x: bigint; y: number }

// =============================================================================
// Broad types
// =============================================================================

const flexSchema = q.table({
	num: q.int(),
	text: q.string(),
});

type FlexTable = q.infer<typeof flexSchema>;
declare const ft: FlexTable;
const frow = ft.at(0); // { num: number; text: string }
