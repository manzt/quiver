Add option variants and nullable tests to exhaustive suite

Adds missing option invariant tests (int32 + useBigInt still number,
float64 + useBigInt still number), nullable variants (int64 + useBigInt,
dateDay + useDate, bool), map + useMap, broad builder type snapshots,
interval + useDate, and q.time(). Every test now has proper //^?
snapshots for Column, toArray, and at types.

129 type snapshots + 75 runtime tests.
