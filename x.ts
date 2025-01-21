// deno-lint-ignore-file no-unused-vars
import * as a from "./src/mod.ts";

let tableSchema = a.table({
	number: [a.int(), a.float()],
	string: a.int(),
	boolean: a.bool(),
	date: [a.dateDay(), a.dateMillisecond()],
}, {
	useDate: true,
	useBigInt: false,
});

let _tableSchema = a.table([
	["number", [a.int(), a.float()]],
	["string", a.utf8()],
	["boolean", a.bool()],
	["date", [a.dateDay(), a.dateMillisecond()]],
	["dict", a.int()],
], {
	useDate: true,
	useBigInt: true,
});

let table = tableSchema.parseIPC(new Uint8Array());
console.log({ table });

let _names = table.names;
let _values = table.children;
let _col = [table.getChildAt(0), table.getChildAt(1)] as const;
let _col2 = [
	table.getChild("number"),
	table.getChild("boolean"),
	table.getChild("date"),
] as const;

let _cols = table.toColumns();
let cols = table.toColumns();
let arr = table.toArray();
let s2 = table.select(["string", "number"]);
let t5 = s2.selectAt([0, 1]);
let f = s2.schema.fields[1];
