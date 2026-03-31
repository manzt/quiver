/**
 * Vite plugin for inline TypeScript type snapshots.
 *
 * Recognises `expectType(expr).toMatchInlineSnapshot(...)` in test files
 * and replaces the `expectType(expr)` call with
 * `expect({ __type__: "<resolved>" })` at transform time, using the
 * TypeScript language service to resolve the type.
 *
 * Because the method name stays `toMatchInlineSnapshot`, vitest's
 * built-in `--update` mechanism works out of the box.
 */

import type { Plugin } from "vitest/config";
import ts from "typescript";
import MagicString from "magic-string";

// ---------------------------------------------------------------------------
// TypeScript language service
// ---------------------------------------------------------------------------

function createLanguageService(
  fileNames: string[],
  compilerOptions: ts.CompilerOptions,
): ts.LanguageService {
  const files = new Map<string, { version: number; content: string }>();

  for (const fileName of fileNames) {
    const content = ts.sys.readFile(fileName);
    if (!content) continue;
    files.set(fileName, { version: 0, content });
  }

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...files.keys()],
    getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
    getScriptSnapshot(fileName) {
      const file = files.get(fileName);
      if (file) return ts.ScriptSnapshot.fromString(file.content);
      const content = ts.sys.readFile(fileName);
      return content ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };

  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

function getTypeAtPosition(
  service: ts.LanguageService,
  fileName: string,
  offset: number,
): string {
  const info = service.getQuickInfoAtPosition(fileName, offset);
  if (!info?.displayParts) return "unknown";

  return (
    info.displayParts
      .map((p) => p.text)
      .join("")
      // Strip declaration prefix
      .replace(/^(const|let|var|function|type) \w+: /, "")
      .replace(/^\(property\) .*?: /, "")
      .replace(/^\(method\) /, "")
      // Collapse TS language service whitespace to single spaces
      .replace(/\n\s*/g, " ")
      .trim()
  );
}

// ---------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------

/**
 * Walk the TS AST looking for call chains of the form:
 *   expectType(EXPR).toMatchInlineSnapshot(...)
 *
 * Returns the `expectType(EXPR)` CallExpression nodes.
 */
function findExpectTypeCalls(
  sourceFile: ts.SourceFile,
): { node: ts.CallExpression; arg: ts.Expression }[] {
  const results: { node: ts.CallExpression; arg: ts.Expression }[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "toMatchInlineSnapshot"
    ) {
      const obj = node.expression.expression;
      if (
        ts.isCallExpression(obj) &&
        ts.isIdentifier(obj.expression) &&
        obj.expression.text === "expectType" &&
        obj.arguments.length === 1
      ) {
        results.push({ node: obj, arg: obj.arguments[0] });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function typeSnapshots(): Plugin {
  let service: ts.LanguageService | null = null;

  function getService(fileName: string): ts.LanguageService {
    if (service) return service;

    // Read deno.json imports to build TS paths
    const denoJson = JSON.parse(ts.sys.readFile("deno.json")!);
    const paths: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(denoJson.imports ?? {})) {
      const v = value as string;
      if (v.startsWith("npm:")) {
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
      baseUrl: ts.sys.getCurrentDirectory(),
    };

    service = createLanguageService([fileName], compilerOptions);
    return service;
  }

  return {
    name: "vitest-type-snapshots",
    enforce: "pre",

    transform(code, id) {
      if (!code.includes("expectType")) return;

      const sourceFile = ts.createSourceFile(
        id,
        code,
        ts.ScriptTarget.Latest,
        true,
      );
      const calls = findExpectTypeCalls(sourceFile);
      if (calls.length === 0) return;

      const svc = getService(id);
      const s = new MagicString(code);

      for (const { node, arg } of calls) {
        const resolvedType = getTypeAtPosition(svc, id, arg.getStart());
        const json = JSON.stringify(resolvedType);
        s.overwrite(
          node.getStart(),
          node.getEnd(),
          `expect({ __type__: ${json} })`,
        );
      }

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      };
    },
  };
}
