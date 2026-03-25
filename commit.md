Fix map() to propagate key and value DataTypes

map() returned unparameterized MapType so key/value types resolved to
`unknown`. Now constructs the correct Arrow Map structure with typed
key/value Fields, so `q.map(q.utf8(), q.int32())` resolves to
`[string, number][]` in rows (or `Map<string, number>` with useMap).
