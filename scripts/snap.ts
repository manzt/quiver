#!/usr/bin/env -S deno run -A
/**
 * Type snapshot testing.
 *
 * Reads .ts files containing `//^?` comments and verifies or updates
 * the inferred type snapshot. The caret points at the character on
 * the previous line whose type to check.
 *
 * Usage:
 *   deno run -A scripts/snap.ts __tests__/snap.test.ts     # check
 *   deno run -A scripts/snap.ts --update __tests__/snap.test.ts  # update
 *
 * Example:
 *   const row = table.at(0);
 *       //^? { id: number; name: string | null }
 *
 * The `^` points at `r` in `row`. The script queries the TypeScript
 * language service for the quickinfo at that position and compares
 * with the snapshot after `//^? `.
 */

import ts from "typescript";
import * as path from "@std/path";

function createLanguageService(
  fileNames: string[],
  compilerOptions: ts.CompilerOptions,
): ts.LanguageService {
  const files = new Map<string, { version: number; content: string }>();

  for (const fileName of fileNames) {
    files.set(fileName, {
      version: 0,
      content: Deno.readTextFileSync(fileName),
    });
  }

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...files.keys()],
    getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
    getScriptSnapshot: (fileName) => {
      const file = files.get(fileName);
      if (file) return ts.ScriptSnapshot.fromString(file.content);
      try {
        const content = Deno.readTextFileSync(fileName);
        return ts.ScriptSnapshot.fromString(content);
      } catch {
        return undefined;
      }
    },
    getCurrentDirectory: () => Deno.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (fileName) => {
      try {
        Deno.statSync(fileName);
        return true;
      } catch {
        return false;
      }
    },
    readFile: (fileName) => {
      try {
        return Deno.readTextFileSync(fileName);
      } catch {
        return undefined;
      }
    },
    readDirectory: ts.sys.readDirectory,
    directoryExists: (dirName) => {
      try {
        return Deno.statSync(dirName).isDirectory;
      } catch {
        return false;
      }
    },
    getDirectories: ts.sys.getDirectories,
  };

  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

interface Snapshot {
  line: number; // 0-based line of the //^? comment
  col: number; // 0-based column the ^ points at (on previous line)
  existing: string; // current snapshot text (empty if none)
  targetLine: number; // 0-based line being queried
}

function findSnapshots(source: string): Snapshot[] {
  const lines = source.split("\n");
  const snapshots: Snapshot[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)\/\/(\s*)\^(\?)\s?(.*)/);
    if (!match) continue;

    const indent = match[1].length;
    const spacesBeforeCaret = match[2].length;
    const col = indent + 2 + spacesBeforeCaret; // // + spaces + ^
    const existing = match[4].trim();

    snapshots.push({
      line: i,
      col,
      existing,
      targetLine: i - 1,
    });
  }

  return snapshots;
}

function getTypeAtPosition(
  service: ts.LanguageService,
  fileName: string,
  source: string,
  line: number,
  col: number,
): string {
  const lines = source.split("\n");
  let offset = 0;
  for (let i = 0; i < line; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }
  offset += col;

  const info = service.getQuickInfoAtPosition(fileName, offset);
  if (!info?.displayParts) return "unknown";

  return info.displayParts.map((p) => p.text).join("")
    // Strip declaration prefix
    .replace(/^(const|let|var|function|type) \w+: /, "")
    .replace(/^\(property\) .*?: /, "")
    .replace(/^\(method\) /, "")
    // Collapse to single line
    .replace(/\n\s*/g, " ")
    .trim();
}

async function main() {
  const args = Deno.args;
  const update = args.includes("--update");
  const files = args.filter((a) => !a.startsWith("--"));

  if (files.length === 0) {
    console.error("Usage: snap.ts [--update] <file.ts> ...");
    Deno.exit(1);
  }

  const resolvedFiles = files.map((f) => path.resolve(f));

  // Read deno.json imports to build TS paths
  const denoJson = JSON.parse(Deno.readTextFileSync("deno.json"));
  const paths: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(denoJson.imports ?? {})) {
    const v = value as string;
    if (v.startsWith("npm:")) {
      // npm: specifiers — resolve through node_modules
      const pkg = v.replace(/^npm:/, "").replace(/@\^?[\d.]+$/, "");
      paths[key] = [`./node_modules/${pkg}`];
    }
  }

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    paths,
    baseUrl: Deno.cwd(),
  };

  const service = createLanguageService(resolvedFiles, compilerOptions);
  let failures = 0;
  let updates = 0;

  for (const fileName of resolvedFiles) {
    const source = Deno.readTextFileSync(fileName);
    const snapshots = findSnapshots(source);

    if (snapshots.length === 0) {
      console.log(`  ${path.relative(Deno.cwd(), fileName)}: no snapshots`);
      continue;
    }

    const lines = source.split("\n");
    let modified = false;

    for (const snap of snapshots) {
      const actual = getTypeAtPosition(
        service,
        fileName,
        source,
        snap.targetLine,
        snap.col,
      );

      if (snap.existing === "") {
        // Empty snapshot — fill in
        if (update) {
          const indent = lines[snap.line].match(/^(\s*)/)?.[1] ?? "";
          lines[snap.line] = `${indent}//^? ${actual}`;
          modified = true;
          updates++;
          console.log(
            `  ${path.relative(Deno.cwd(), fileName)}:${
              snap.line + 1
            } updated: ${actual}`,
          );
        } else {
          console.log(
            `  ${path.relative(Deno.cwd(), fileName)}:${
              snap.line + 1
            } empty snapshot (run with --update)`,
          );
          console.log(`    inferred: ${actual}`);
          failures++;
        }
      } else if (snap.existing !== actual) {
        if (update) {
          const indent = lines[snap.line].match(/^(\s*)/)?.[1] ?? "";
          lines[snap.line] = `${indent}//^? ${actual}`;
          modified = true;
          updates++;
          console.log(
            `  ${path.relative(Deno.cwd(), fileName)}:${snap.line + 1} updated`,
          );
          console.log(`    old: ${snap.existing}`);
          console.log(`    new: ${actual}`);
        } else {
          console.error(
            `  FAIL ${path.relative(Deno.cwd(), fileName)}:${snap.line + 1}`,
          );
          console.error(`    expected: ${snap.existing}`);
          console.error(`    actual:   ${actual}`);
          failures++;
        }
      } else {
        console.log(
          `  ${path.relative(Deno.cwd(), fileName)}:${snap.line + 1} ok`,
        );
      }
    }

    if (modified) {
      await Deno.writeTextFile(fileName, lines.join("\n"));
    }
  }

  if (updates > 0) {
    console.log(`\n${updates} snapshot(s) updated.`);
  }
  if (failures > 0) {
    console.error(`\n${failures} snapshot(s) failed.`);
    Deno.exit(1);
  }
}

main();
