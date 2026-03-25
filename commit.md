Fix either() to propagate child DataType union

either() returned unparameterized SchemaEntry, losing the DataType
information from its children. Now infers the union of all child
DataTypes so `q.either([q.int32(), q.float64()])` carries
`IntType<32, true> | FloatType<2>` at the type level, resolving to
`number` in row types.
