Add exhaustive vitest + type snapshot tests

A unified test file checks both the inferred TypeScript type (via
//^? snapshots) and the runtime value (via vitest toMatchInlineSnapshot)
for every builder × option combination. Each test creates a single-value
single-column table and verifies three type snapshots (Column, toArray,
at) plus two runtime snapshots.

Covers all integer widths (signed + unsigned ± useBigInt), all float
widths, utf8/largeUtf8, bool, binary/fixedSizeBinary, dateDay
(± useDate), dateMillisecond, timestamp (± useDate), duration
(± useBigInt), decimal (128 + 32 ± useDecimalInt), time
(second + microsecond), dictionary (utf8 + int32), list (int32 + utf8
+ int64 useBigInt), struct (± useBigInt), map, nullable (int32 + utf8),
either, nested list-of-struct, struct-with-list, and broad builders.

Also fixes assertSchema to skip map's {key, value} child structure
during recursive matching.

103 type snapshots + 64 runtime tests.
