Fix decimal32 with useDecimalInt to resolve as number

Flechette returns `number` (not `bigint`) for 32-bit decimals with
useDecimalInt, and `Int32Array` for toArray(). The Scalar and
TypedArrayFor mappings now check bitWidth — 32-bit stays number/
Int32Array, 64-bit+ becomes bigint/Array.
