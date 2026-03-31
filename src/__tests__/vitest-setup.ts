import { expect } from "vitest";

expect.addSnapshotSerializer({
  test: (val) => val != null && typeof val === "object" && "__type__" in val,
  serialize: (val) => (val as { __type__: string }).__type__,
});
