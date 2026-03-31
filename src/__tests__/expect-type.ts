import { expect } from "vitest";

/**
 * Type snapshot helper — used with `.toMatchInlineSnapshot(...)`.
 *
 * At transform time the vitest-type-snapshots plugin replaces
 * `expectType(expr)` with `expect({ __type__: "ResolvedType" })`.
 * At runtime (without the plugin) this just delegates to `expect`.
 */
export function expectType<T>(_val: T) {
  return expect(_val);
}
