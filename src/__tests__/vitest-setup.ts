import { expect } from "vitest";

expect.addSnapshotSerializer({
  test: (val) => val != null && typeof val === "object" && "__type__" in val,
  serialize: (val) => (val as { __type__: string }).__type__,
});

globalThis.expectType = <T>(_val: T) => expect(_val);

declare global {
  function expectType<T>(_val: T): ReturnType<typeof expect>;
}
