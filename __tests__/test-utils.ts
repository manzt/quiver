/**
 * Compile-time type assertion utilities.
 *
 * These types allow us to write type-level tests that fail at compile time
 * if the type system doesn't behave as expected. No runtime cost.
 */

/** True if A and B are exactly the same type. */
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
	(<T>() => T extends B ? 1 : 2) ? true
	: false;

/** Compile-time assertion: use `Expect<Equal<Actual, Expected>>`. */
export type Expect<T extends true> = T;

/** Compile-time assertion that types are NOT equal. */
export type ExpectNot<T extends false> = T;

/** Helper: assert a value's type without runtime cost. */
export function assertType<_T>(): void {}
