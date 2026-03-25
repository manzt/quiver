Fix list builders to propagate child DataType

list(), largeList(), listView(), largeListView(), and fixedSizeList()
returned unparameterized ListType, losing the child type. Now generic
over the child's DataType so `q.list(q.utf8())` carries
`ListType<Field<string, Utf8Type>>` and resolves to `string[]` in rows,
while `q.list(q.int32())` resolves to `Int32Array`.
