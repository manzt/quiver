# TODO

## ~~1. Remaining builders + schema tests~~ done

## 2. Flechette behavior tests for untested types

- [ ] float16 scalar + toArray
- [ ] timeMillisecond (only sec/us/ns tested)
- [ ] Decimal bit width variants (32, 64, 128, 256)
- [ ] fixedSizeList extraction
- [ ] largeList extraction
- [ ] binaryView / utf8View extraction

## 3. ValueArray type test gaps

- [ ] All uint types (uint8 -> Uint8Array, etc.)
- [ ] Int64 default (no useBigInt) -> Float64Array
- [ ] Time32/64 variants
- [ ] Timestamp/Duration/Decimal default -> Float64Array
- [ ] Nullable versions of all the above

## ~~4. Struct type mapping~~ done

## 5. Schema validation edge cases

- [ ] Type mismatches: time variants, decimal params, list vs struct
- [ ] Nested `of()`: `of([int(), string()])` with broad types
- [ ] `list(of([int32(), float64()]))` — of inside nested types
- [ ] Struct with nullable children
- [ ] Dictionary with non-string value types
- [ ] Error message content (assert messages are descriptive)
- [ ] Invalid IPC bytes (not Arrow data at all)

## 6. Table type inference tests

- [x] `q.infer<typeof schema>` produces correct Table type
- [x] `table.getChild("name")` returns correct Column type
- [x] `table.toArray()` row type matches Scalar + nullable
- [ ] `table.toColumns()` has correct ValueArray types
- [x] `table.select()` preserves options and types
- [x] Broad builders produce correct inferred types in rows
- [ ] `of()` produces union type in rows

## 7. Cleanup

- [ ] Resolve `export * from "@uwdata/flechette"` shadowing quiver builder names
- [ ] Fix codegen parser for generic method signatures (flechette 2.x)
- [ ] Consider deriving `data-types.ts` from flechette via intersection
      narrowing
- [ ] Delete `__tests__/table.test-d.ts` (old spec, superseded by
      `types.test-d.ts`)
