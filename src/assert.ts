/**
 * Shared schema assertion logic.
 *
 * This module is backend-agnostic — it works with any Arrow implementation
 * (flechette, apache-arrow, etc.) as long as the schema and type objects
 * are normalized to the shapes defined here.
 */

// =============================================================================
// TypeMatcher — match criteria carried by SchemaEntry
// =============================================================================

export interface TypeMatcher {
  typeId: number | number[];
  [key: string]: unknown;
}

// =============================================================================
// QuiverError — structured schema validation errors (zod-compatible shape)
// =============================================================================

export type QuiverIssueCode =
  | "column-count"
  | "column-missing"
  | "type-mismatch";

export interface QuiverIssue {
  code: QuiverIssueCode;
  path: string[];
  message: string;
  expected?: string;
  received?: string;
}

export class QuiverError extends Error {
  issues: QuiverIssue[];

  constructor(issues: QuiverIssue[]) {
    super();
    this.issues = issues;
    this.message = this.issues.map((i) => {
      const loc = i.path.length > 0 ? i.path.join(".") + ": " : "";
      return loc + i.message;
    }).join("\n");
    this.name = "QuiverError";
  }

  /** Flat error summary matching zod's flatten() shape. */
  flatten(): {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  } {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of this.issues) {
      if (issue.path.length > 0) {
        const key = issue.path[0];
        fieldErrors[key] = fieldErrors[key] || [];
        fieldErrors[key].push(issue.message);
      } else {
        formErrors.push(issue.message);
      }
    }
    return { formErrors, fieldErrors };
  }
}

// =============================================================================
// Generic interfaces for assertion (no flechette dependency)
// =============================================================================

export interface DataTypeLike {
  typeId: number;
  [key: string]: unknown;
}

export interface FieldLike {
  name: string;
  type: DataTypeLike;
}

export interface SchemaLike {
  fields: FieldLike[];
}

interface MatchEntry {
  match: TypeMatcher;
}

// =============================================================================
// Describe helpers — for error messages
// =============================================================================

function describeType(type: DataTypeLike): string {
  const t = type as Record<string, unknown>;
  switch (type.typeId) {
    case 2:
      return `Int(${t.bitWidth}, ${t.signed ? "signed" : "unsigned"})`;
    case 3:
      return `Float(precision=${t.precision})`;
    case 7:
      return `Decimal(${t.precision}, ${t.scale}, bitWidth=${t.bitWidth})`;
    case 8:
      return `Date(unit=${t.unit})`;
    case 9:
      return `Time(bitWidth=${t.bitWidth}, unit=${t.unit})`;
    case 10:
      return `Timestamp(unit=${t.unit}, tz=${t.timezone})`;
    case 11:
      return `Interval(unit=${t.unit})`;
    case 12:
      return "List";
    case 13:
      return "Struct";
    case 14:
      return "Union";
    case 17:
      return "Map";
    case 18:
      return `Duration(unit=${t.unit})`;
    case -1:
      return "Dictionary";
    default: {
      const names: Record<number, string> = {
        0: "None",
        1: "Null",
        4: "Binary",
        5: "Utf8",
        6: "Bool",
        15: "FixedSizeBinary",
        16: "FixedSizeList",
        19: "LargeBinary",
        20: "LargeUtf8",
        21: "LargeList",
        22: "RunEndEncoded",
        23: "BinaryView",
        24: "Utf8View",
        25: "ListView",
        26: "LargeListView",
      };
      return names[type.typeId] ?? `Unknown(typeId=${type.typeId})`;
    }
  }
}

function describeMatcher(match: TypeMatcher): string {
  if ((match as Record<string, unknown>).options) {
    const options = (match as Record<string, unknown>).options as MatchEntry[];
    return options.map((e) => describeMatcher(e.match)).join(" | ");
  }
  const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
  const parts: string[] = [];
  for (const [key, val] of Object.entries(match)) {
    if (key === "typeId" || key === "children" || key === "dictionary") {
      continue;
    }
    parts.push(`${key}=${val}`);
  }
  const names: Record<number, string> = {
    0: "None",
    1: "Null",
    2: "Int",
    3: "Float",
    4: "Binary",
    5: "Utf8",
    6: "Bool",
    7: "Decimal",
    8: "Date",
    9: "Time",
    10: "Timestamp",
    11: "Interval",
    12: "List",
    13: "Struct",
    14: "Union",
    15: "FixedSizeBinary",
    16: "FixedSizeList",
    17: "Map",
    18: "Duration",
    19: "LargeBinary",
    20: "LargeUtf8",
    21: "LargeList",
    22: "RunEndEncoded",
    23: "BinaryView",
    24: "Utf8View",
    25: "ListView",
    26: "LargeListView",
    [-1]: "Dictionary",
  };
  const typeNames = typeIds.map((id) => names[id] ?? `typeId=${id}`);
  const typePart = typeNames.length === 1
    ? typeNames[0]
    : typeNames.join(" | ");
  return parts.length > 0 ? `${typePart}(${parts.join(", ")})` : typePart;
}

// =============================================================================
// Type issue collection
// =============================================================================

function collectTypeIssues(
  match: TypeMatcher,
  actual: DataTypeLike,
  path: string[],
  issues: QuiverIssue[],
): void {
  // oneOf() — try each option
  if ((match as Record<string, unknown>).options) {
    const options = (match as Record<string, unknown>)
      .options as MatchEntry[];
    if (!options.some((e) => matchesType(e.match, actual))) {
      issues.push({
        code: "type-mismatch",
        path,
        message: `Expected ${describeMatcher(match)}, received ${
          describeType(actual)
        }`,
        expected: describeMatcher(match),
        received: describeType(actual),
      });
    }
    return;
  }

  // typeId check
  const typeIds = Array.isArray(match.typeId) ? match.typeId : [match.typeId];
  if (!typeIds.includes(actual.typeId)) {
    issues.push({
      code: "type-mismatch",
      path,
      message: `Expected ${describeMatcher(match)}, received ${
        describeType(actual)
      }`,
      expected: describeMatcher(match),
      received: describeType(actual),
    });
    return;
  }

  // Check additional properties
  for (const [key, expected] of Object.entries(match)) {
    if (key === "typeId") continue;

    // Nested children for list types (skip map's { key, value } structure)
    if (key === "children" && Array.isArray(expected)) {
      // Map children are { key, value } objects for type inference only
      if (expected.length > 0 && expected[0]?.key) continue;
      const actualChildren = (actual as Record<string, unknown>)
        .children as FieldLike[] | undefined;
      if (!actualChildren) continue;
      for (let i = 0; i < expected.length; i++) {
        const childEntry = expected[i] as MatchEntry;
        if (childEntry?.match && actualChildren[i]?.type) {
          collectTypeIssues(
            childEntry.match,
            actualChildren[i].type,
            [...path, actualChildren[i].name ?? String(i)],
            issues,
          );
        }
      }
      continue;
    }

    // Nested children for struct (record of entries)
    if (
      key === "children" && typeof expected === "object" &&
      !Array.isArray(expected)
    ) {
      const actualChildren = (actual as Record<string, unknown>)
        .children as FieldLike[] | undefined;
      if (!actualChildren) continue;
      for (
        const [name, childEntry] of Object.entries(
          expected as Record<string, MatchEntry>,
        )
      ) {
        const actualChild = actualChildren.find((c) => c.name === name);
        if (!actualChild) {
          issues.push({
            code: "column-missing",
            path: [...path, name],
            message: `Struct field "${name}" not found`,
          });
        } else {
          collectTypeIssues(
            childEntry.match,
            actualChild.type,
            [...path, name],
            issues,
          );
        }
      }
      continue;
    }

    // Dictionary value type
    if (key === "dictionary" && typeof expected === "object") {
      const dictEntry = expected as MatchEntry;
      const actualDict = (actual as Record<string, unknown>).dictionary;
      if (actualDict) {
        collectTypeIssues(
          dictEntry.match,
          actualDict as DataTypeLike,
          [...path, "dictionary"],
          issues,
        );
      }
      continue;
    }

    // Simple property comparison
    if ((actual as Record<string, unknown>)[key] !== expected) {
      issues.push({
        code: "type-mismatch",
        path,
        message: `Expected ${key}=${expected}, received ${key}=${
          (actual as Record<string, unknown>)[key]
        }`,
        expected: String(expected),
        received: String((actual as Record<string, unknown>)[key]),
      });
    }
  }
}

/** Simple boolean check (used by oneOf() internally). */
function matchesType(
  match: TypeMatcher,
  actual: DataTypeLike,
): boolean {
  const issues: QuiverIssue[] = [];
  collectTypeIssues(match, actual, [], issues);
  return issues.length === 0;
}

/**
 * Validate a parsed schema against declared entries.
 * strict=true (tuple form): exact column count required
 * strict=false (record form): partial — only declared columns checked
 */
export function assertSchema(
  declared: Record<string, MatchEntry>,
  actual: SchemaLike,
  strict: boolean,
): void {
  const issues: QuiverIssue[] = [];
  const declaredNames = Object.keys(declared);
  const actualNames = actual.fields.map((f) => f.name);

  if (strict && declaredNames.length !== actualNames.length) {
    issues.push({
      code: "column-count",
      path: [],
      message: `Expected ${declaredNames.length} columns (${
        declaredNames.join(", ")
      }), got ${actualNames.length} (${actualNames.join(", ")})`,
      expected: String(declaredNames.length),
      received: String(actualNames.length),
    });
  }

  for (const name of declaredNames) {
    const actualField = actual.fields.find((f) => f.name === name);
    if (!actualField) {
      issues.push({
        code: "column-missing",
        path: [name],
        message: `Column "${name}" not found in table. Available: ${
          actualNames.join(", ")
        }`,
      });
      continue;
    }

    collectTypeIssues(declared[name].match, actualField.type, [name], issues);
  }

  if (issues.length > 0) {
    throw new QuiverError(issues);
  }
}
