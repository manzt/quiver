// deno-lint-ignore-file no-unused-vars
import * as a from "./main.ts";

type MyTable = a.Infer<typeof ts>;

let tableSchema = a.table({
  number: [a.int(), a.float()],
  string: a.utf8(),
  boolean: a.bool(),
  date: [a.dateDay(), a.dateMillisecond()],
  dict: a.int(),
}, {
  useDate: true,
});

// IDEA: Add overload for table function to accept a tuple of [name, type] pairs
//
let ts = a.table([
  ["number", [a.int(), a.float()]],
  ["string", a.utf8()],
  ["boolean", a.bool()],
  ["date", [a.dateDay(), a.dateMillisecond()]],
  ["dict", a.int()],
]);

let t2 = ts.parseIPC(new Uint8Array());
let table = tableSchema.parseIPC(new Uint8Array());

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
for (let { number, string } of table) {}
let subset = table.select(["string"]);
let s2 = table.select(["string", "number"]);
let t5 = s2.selectAt([0, 1]);

let f = subset.schema.fields[0];
