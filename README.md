# quiver

a safe place for your arrows

## install

```
npx jsr add @manzt/quiver
```

## usage

```ts
import * as q from "@manzt/quiver";

type MyTable = q.infer<typeof myTableSchema>;

let myTableSchema = q.table({
  num: q.union([q.int(), q.float()]),
  str: q.string(),
  bool: q.bool().nonNullable(),
  date: q.union([q.dateDay(), q.dateMillisecond()]),
}, {
  useDate: true,
  useBigInt: false,
});

function processTable(table: MyTable) {
  // strongly typed!

  let arr = table.toArray();
  // Array<{num: number|null, str: string|null, bool: boolean, date: Date|null}>

  for (let row of table) {
    row // {num: number|null, str: string|null, bool: boolean, date: Date|null}
  }

  let cols = table.toColumns();
  // {
  //   num: Column<IntType | FloatType, number>,
  //   str: Column<StringType, string>,
  //   bool: Column<BoolType, boolean>,
  //   date: Column<DateType, Date>
  // }

  let subTable = table.select(["num", "str"]);
  // Table<[
  //  { name: "num", type: IntType | FloatType },
  //  { name: "str", type: StringType }
  // ], {
  //   useDate: true,
  //   useBigInt: false
  // }>
}

// fetch Arrow data
let response = await fetch("https://example.com/data.arrow");
let bytes = new Uint8Array(await response.arrayBuffer());

// parse with table schema
let table = tableSchema.parseIPC(bytes); // throws if parsing fails!
processTable(table); // All good!
processTable(table.select(["num", "str"])); // Error! Missing "bool" and "date"
```

## what & why

**quiver** is a TypeScript library providing high-level type definitions for
Apache Arrow tables, built on
[`@uwdata/flechette`](https://github.com/uwdata/flechette).

It allows you to define table schemas with rich types (similar to Zod for
JavaScript objects), enhancing type information for parsed tables. This enables
type-safe operations on tables, catching errors early in your application.
**quiver** accurately types Arrow data representations in JavaScript,
propagating `@uwdata/flechette` parser options to the Table type.
