Remove unreachable map-children branch in `collectTypeIssues`

The branch guarding map children with a `.key` property could never be reached.
The earlier `Array.isArray(expected)` branch already handles all array children
cases — map children with a `.key` hit the `continue` on line 246, and
everything else iterates the children array normally. Confirmed by all 265 tests
passing unchanged.
