Fix struct() to propagate child DataTypes

struct() returned unparameterized StructType, losing field names and
types. Now maps the Record of SchemaEntries to an Array of Fields with
correct name and DataType generics, so `q.struct({ key: q.utf8() })`
resolves to `{ key: string }` in rows. Options propagate through
nested structs — `q.struct({ val: q.int64() })` with useBigInt gives
`{ val: bigint }`.
