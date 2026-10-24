import { expect, it } from "vitest";

import { analyzeJavaScriptStaticSource } from "./javascriptStaticAnalysis.js";
import { parseJavaScriptSource } from "./javascriptSourceParser.js";
import { indexJavaScriptBindingsWithReceiversSteps } from "./javascriptSemanticAnalysis.js";
import { completeSemanticSteps } from "./javascriptSemanticTraversal.js";
import { JavaScriptRouteScan } from "./javascriptRouteScan.js";

const routeEndpoints = (source: string) =>
  analyzeJavaScriptStaticSource(source)
    .endpoints.filter(({ kind }) => kind === "route")
    .map(({ value, mechanism, interpretation }) => ({
      value,
      mechanism,
      interpretation,
    }));

it("reads exact route-property templates and leaves interpolated values unknown", () => {
  expect(
    routeEndpoints(`
      const routes = [
        { path: \`settings\`, component: Settings },
        { route: \`users/\${userId}\`, component: User },
        { path: "/login", element: login },
      ];
    `),
  ).toEqual([
    {
      value: "settings",
      mechanism: "property:path",
      interpretation: undefined,
    },
    {
      value: "/login",
      mechanism: "property:path",
      interpretation: undefined,
    },
  ]);
});

it("keeps route properties on router records exact", () => {
  expect(
    routeEndpoints(`
      const routes = [
        { path: "admin", children: [] },
        { _$: "route", path: "typed" },
      ];
    `).map(({ value, interpretation }) => [value, interpretation]),
  ).toEqual([
    ["admin", undefined],
    ["typed", undefined],
  ]);
});

it("reports path properties outside router records only as candidates", () => {
  expect(
    routeEndpoints(`
      const patch = [{ type: "set", path: "updatedAt", value: 1 }];
      const worktree = { path: "", head: "" };
      const routes = [{ path: "/bare" }];
    `),
  ).toEqual([
    {
      value: "updatedAt",
      mechanism: "property:path",
      interpretation: "candidate",
    },
    { value: "", mechanism: "property:path", interpretation: "candidate" },
    {
      value: "/bare",
      mechanism: "property:path",
      interpretation: "candidate",
    },
  ]);
});

it("preserves all route candidates in an object with repeated path keys", () => {
  const endpoints = routeEndpoints(
    `const record = { ${Array.from({ length: 20_000 }, (_, i) => `path: "p${String(i)}"`).join(", ")} };`,
  );
  expect(endpoints).toHaveLength(20_000);
  expect(
    endpoints.every(({ interpretation }) => interpretation === "candidate"),
  ).toBe(true);
}, 30000);

it("scans an object's route fields once for repeated path keys", () => {
  const file = parseJavaScriptSource(
    `const record = { ${Array.from({ length: 128 }, (_, i) => `path: "p${String(i)}"`).join(", ")} };`,
  );
  if (file === null) throw new Error("fixture must parse");
  const statement = file.program.body[0];
  if (statement?.type !== "VariableDeclaration")
    throw new Error("fixture must declare a record");
  const object = statement.declarations[0]?.init;
  if (object?.type !== "ObjectExpression")
    throw new Error("fixture must initialize an object");
  const index = completeSemanticSteps(
    indexJavaScriptBindingsWithReceiversSteps(file.program),
  );
  let candidates = 0;
  const scan = completeSemanticSteps(
    JavaScriptRouteScan.createSteps(file, index, () => {
      candidates += 1;
    }),
  );
  let fieldScans = 0;
  const properties = object.properties;
  const iterator = properties[Symbol.iterator].bind(properties);
  Object.defineProperty(properties, Symbol.iterator, {
    configurable: true,
    value: () => {
      fieldScans += 1;
      return iterator();
    },
  });
  scan.inspect(object, statement.declarations[0]!);
  for (let i = 0; i < properties.length; i += 1)
    scan.inspect(properties[i]!, object);
  expect(fieldScans).toBe(1);
  expect(candidates).toBe(properties.length);
});
