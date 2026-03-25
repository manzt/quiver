Fix dictionary() to propagate value DataType

dictionary() returned unparameterized DictionaryType, so the value
type was lost and resolved to `any`. Now generic over the child's
DataType so `q.dictionary(q.utf8())` resolves to `string` in rows.
