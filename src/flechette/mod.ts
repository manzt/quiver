/**
 * Quiver entry point for flechette.
 *
 * Re-exports all shared builders and types from the base module, plus
 * `table()` which returns a schema with `parseIPC` for deserializing
 * and validating Arrow IPC bytes in one step.
 *
 * Only `parseIPC` is provided (not `parse`) because flechette's
 * `ExtractionOptions` (e.g., `useBigInt`, `useDate`) must be applied
 * at deserialization time — you can't retroactively change how an
 * already-parsed table was extracted.
 *
 * @example
 * ```ts
 * import * as q from "@manzt/quiver/flechette";
 *
 * const schema = q.table({ name: q.utf8(), age: q.int32() });
 * const table = schema.parseIPC(buffer);
 * //    ^? q.Table<...>
 * ```
 */

import * as f from "@uwdata/flechette";
import type * as d from "../data-types.ts";
import type { Table } from "../table.gen.ts";
import { assertSchema } from "../assert.ts";
import type { SchemaEntry } from "../mod.ts";

// Re-export everything from the base module
export * from "../mod.ts";

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
