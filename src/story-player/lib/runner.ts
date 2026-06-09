import { transform } from "sucrase";

// A self-contained, offline, deterministic test runner for the G4 sandbox.
// Transpiles the editable TS slice + a hidden Jest-style test file in-browser (sucrase),
// wires a tiny CommonJS module graph for the relative imports, and runs the tests with a
// minimal jest-ish harness. No remote bundler, no backend — so it works offline and the
// e2e is reliable. (Real Sandpack / E2B is a drop-in swap behind the same shape later.)

export interface TestResult {
  name: string;
  status: "pass" | "fail";
  message?: string;
}

function fmt(v: unknown): string {
  if (typeof v === "function") return "[function]";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function compile(src: string): string {
  return transform(src, { transforms: ["typescript", "imports"], production: true }).code;
}

function baseKey(files: Record<string, string>, req: string): string | null {
  if (!req.startsWith(".")) return null;
  const target = req.replace(/^\.\//, "");
  for (const c of [target, `${target}.ts`, `${target}.tsx`]) {
    if (files[c] !== undefined) return c;
  }
  return null;
}

// Build the module graph and execute the test file against it.
export function runTests(
  files: Record<string, string>,
  testFile: { name: string; content: string }
): TestResult[] {
  const modules: Record<string, { exports: Record<string, unknown> }> = {};

  const load = (path: string): Record<string, unknown> => {
    if (modules[path]) return modules[path].exports;
    const mod = { exports: {} as Record<string, unknown> };
    modules[path] = mod;
    const code = compile(files[path]);
    const require = (req: string) => {
      const r = baseKey(files, req);
      if (!r) throw new Error(`Cannot resolve module '${req}' from ${path}`);
      return load(r);
    };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function("require", "module", "exports", code);
    fn(require, mod, mod.exports);
    return mod.exports;
  };

  const results: TestResult[] = [];

  const makeExpect = (received: unknown) => ({
    toBe(exp: unknown) {
      if (!Object.is(received, exp)) throw new Error(`expected ${fmt(exp)}, got ${fmt(received)}`);
    },
    toEqual(exp: unknown) {
      if (JSON.stringify(received) !== JSON.stringify(exp))
        throw new Error(`expected ${fmt(exp)}, got ${fmt(received)}`);
    },
    toThrow() {
      let threw = false;
      try {
        (received as () => void)();
      } catch {
        threw = true;
      }
      if (!threw) throw new Error("expected the call to throw, but it did not");
    },
    not: {
      toBe(exp: unknown) {
        if (Object.is(received, exp)) throw new Error(`expected not ${fmt(exp)}`);
      },
      toThrow() {
        try {
          (received as () => void)();
        } catch (e) {
          throw new Error(`expected no throw, but it threw: ${(e as Error).message}`);
        }
      },
    },
  });

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      results.push({ name, status: "pass" });
    } catch (e) {
      results.push({ name, status: "fail", message: (e as Error).message });
    }
  };

  const requireForTest = (req: string) => {
    const r = baseKey(files, req);
    if (!r) throw new Error(`Cannot resolve module '${req}' from the test file`);
    return load(r);
  };

  try {
    const code = compile(testFile.content);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function("require", "test", "it", "expect", "module", "exports", code);
    fn(requireForTest, test, test, makeExpect, { exports: {} }, {});
  } catch (e) {
    // A compile/import error means the whole suite couldn't run — surface it as a failure.
    results.push({ name: "suite failed to load", status: "fail", message: (e as Error).message });
  }

  return results;
}
