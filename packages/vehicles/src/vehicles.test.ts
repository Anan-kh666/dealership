import { describe, expect, it } from "vitest";
import { listVehicleSlugs, loadOptionCatalog, loadVehicle } from "./discover";
import { mergeRig, resolveRotation, type Detected } from "./scene";
import { vehicleSchema } from "./schema";

const detected = (over: Partial<Detected> = {}): Detected => ({
  rotationY: null,
  lengthAxis: "Z",
  wheels: [],
  headlights: null,
  taillights: null,
  materials: [],
  triangles: 0,
  ...over,
});

describe("models/ folder", () => {
  it("has at least one vehicle and every vehicle.json is valid", () => {
    const slugs = listVehicleSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const v = loadVehicle(slug);
      expect(v.ok ? [] : v.errors, slug).toEqual([]);
    }
  });

  it("only references options that are defined", () => {
    const shared = new Set(loadOptionCatalog().map((o) => o.name));
    for (const slug of listVehicleSlugs()) {
      const v = loadVehicle(slug);
      if (!v.ok) continue;
      const known = new Set([...shared, ...v.vehicle.options.map((o) => o.name)]);
      const used = v.vehicle.trims.flatMap((t) => t.options.map((o) => o.name));
      expect(used.filter((n) => !known.has(n)), slug).toEqual([]);
    }
  });
});

describe("vehicleSchema", () => {
  const minimal = {
    make: "Test",
    name: "Test",
    year: 2026,
    bodyType: "SEDAN",
    description: "x",
    colors: { exterior: [{ name: "White", hex: "#FFFFFF" }], interior: [{ name: "Black", hex: "#000000" }] },
    trims: [{ name: "Base", price: 1, transmission: "CVT", fuelType: "PETROL", drivetrain: "FWD", seats: 5, doors: 4 }],
  };

  it("fills defaults", () => {
    const v = vehicleSchema.parse(minimal);
    expect(v.published).toBe(true);
    expect(v.model3d.optimize).toBe(true);
    expect(v.trims[0]!.horsepower).toBeNull();
  });

  it("rejects typos instead of ignoring them", () => {
    const bad = { ...minimal, trims: [{ ...minimal.trims[0], horsePower: 300 }] };
    expect(vehicleSchema.safeParse(bad).success).toBe(false);
  });

  it("checks stock against trims and colours", () => {
    const bad = {
      ...minimal,
      stock: [{ vin: "WBATST20260000001", trim: "Nope", exteriorColor: "White", interiorColor: "Black" }],
    };
    const res = vehicleSchema.safeParse(bad);
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error?.issues)).toContain('No trim named \\"Nope\\"');
  });
});

describe("orientation", () => {
  it("maps Blender's default front (-Y) to nose → +X", () => {
    expect(resolveRotation({}, detected()).rotationY).toBeCloseTo(Math.PI / 2);
    expect(resolveRotation({ forward: "+Y" }, detected()).rotationY).toBeCloseTo(-Math.PI / 2);
    expect(resolveRotation({ forward: "+X" }, detected()).rotationY).toBe(0);
  });

  it("prefers explicit settings, then the lamps", () => {
    expect(resolveRotation({ rotationY: 1 }, detected({ rotationY: 2 })).rotationY).toBe(1);
    expect(resolveRotation({}, detected({ rotationY: 2 })).rotationY).toBe(2);
  });

  it("warns when it has to guess", () => {
    expect(resolveRotation({}, detected({ lengthAxis: "X" })).warning).toBeTruthy();
  });
});

describe("mergeRig", () => {
  it("lets vehicle.json override what was detected", () => {
    const rig = mergeRig(detected({ wheels: ["a", "b", "c", "d"], headlights: "^h$" }), { headlights: "^x$" });
    expect(rig).toEqual({ wheels: ["a", "b", "c", "d"], headlights: "^x$" });
  });

  it("is omitted when there is nothing to animate", () => {
    expect(mergeRig(detected(), undefined)).toBeUndefined();
  });
});
