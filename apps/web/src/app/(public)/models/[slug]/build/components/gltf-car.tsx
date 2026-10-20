"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { DEFAULT_MATERIAL_PATTERNS, NOT_CABIN_GLASS, type CarAsset } from "@/lib/car-assets";
import { CabinInterior, cabinLevels, type CabinSpec } from "./cabin-interior";
import { damp, useMotion } from "./motion";

interface GltfCarProps {
  asset: CarAsset;
  bodyHex: string;
  bodyMetallic: boolean;
  interiorHex: string;
  wheelStyle: "standard" | "sport";
}

type Paintable = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

interface Wheel {
  node: THREE.Object3D;
  rest: THREE.Quaternion;
  /** Axle direction in the wheel's parent space. */
  axis: THREE.Vector3;
  radius: number;
  calipers: { node: THREE.Object3D; pos: THREE.Vector3; quat: THREE.Quaternion }[];
}

interface Door {
  node: THREE.Object3D;
  rest: THREE.Quaternion;
  axis: THREE.Vector3;
  angle: number;
}

interface Prepared {
  root: THREE.Group;
  paint: { material: Paintable; flake: THREE.Vector2 }[];
  interior: Paintable[];
  rims: { material: Paintable; original: THREE.Color }[];
  headlights: Paintable[];
  taillights: Paintable[];
  glass: THREE.MeshPhysicalMaterial;
  /** Cabin volume derived from the glass (null when no interior is fitted). */
  cabin: CabinSpec | null;
  wheels: Wheel[];
  doors: Door[];
}

type Role = "paint" | "interior" | "rims" | "headlights" | "taillights";

const isPaintable = (m: THREE.Material): m is Paintable =>
  m instanceof THREE.MeshStandardMaterial; // MeshPhysicalMaterial extends it

/**
 * Loads a real vehicle model and adapts it to the configurator:
 *  - clones the cached scene and every material it changes, so selections
 *    never leak between visits
 *  - normalises size, orientation and position (nose → +X, wheels on y=0)
 *  - binds paint / interior / rim / light materials by name
 *  - animates the optional rig: wheels roll with the car's travel (calipers
 *    stay put), doors swing open on the interior step, lights wake up
 *
 * Geometry uses Meshopt compression, which drei decodes locally (no CDN).
 */
export function GltfCar({
  asset,
  bodyHex,
  bodyMetallic,
  interiorHex,
  wheelStyle,
}: GltfCarProps): React.ReactElement {
  const { scene } = useGLTF(asset.url, false, true);
  const motion = useMotion();

  const prepared = React.useMemo<Prepared>(() => {
    const patterns = { ...DEFAULT_MATERIAL_PATTERNS, ...asset.materials };
    const rig = asset.rig ?? {};
    const re = (p: string | undefined): RegExp | null => (p ? new RegExp(p, "i") : null);
    const paintRe = new RegExp(patterns.paint, "i");
    const interiorRe = new RegExp(patterns.interior, "i");
    const rimRe = new RegExp(patterns.rim, "i");
    const glassRe = new RegExp(patterns.glass, "i");
    const headRe = re(rig.headlights);
    const tailRe = re(rig.taillights);

    const model = scene.clone(true);
    const clones = new Map<THREE.Material, Paintable>();
    // One clear-glass material for all cabin glazing. Physical transmission
    // (not opacity): see-through head-on, full-strength Fresnel reflections
    // at glancing angles — like real automotive glass, with no grey veil.
    const glass = new THREE.MeshPhysicalMaterial({
      name: "CabinGlass",
      color: "#ffffff",
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      thickness: 0.004,
      ior: 1.52,
      specularIntensity: 1,
      envMapIntensity: 1.3,
      attenuationColor: new THREE.Color("#e9f2f0"),
      attenuationDistance: 0.6,
      side: THREE.DoubleSide,
    });
    const out: Prepared = {
      root: new THREE.Group(),
      paint: [],
      interior: [],
      rims: [],
      headlights: [],
      taillights: [],
      glass,
      cabin: null,
      wheels: [],
      doors: [],
    };

    const role = (name: string): Role | null => {
      if (paintRe.test(name)) return "paint";
      if (interiorRe.test(name)) return "interior";
      if (rimRe.test(name)) return "rims";
      if (headRe?.test(name)) return "headlights";
      if (tailRe?.test(name)) return "taillights";
      return null;
    };

    const cloneFor = (m: Paintable, r: Role): Paintable => {
      const existing = clones.get(m);
      if (existing) return existing;
      const c = m.clone();
      clones.set(m, c);
      if (r === "paint") out.paint.push({ material: c, flake: c.normalScale.clone() });
      else if (r === "interior") out.interior.push(c);
      else if (r === "rims") out.rims.push({ material: c, original: c.color.clone() });
      else {
        c.emissive = new THREE.Color(r === "headlights" ? "#fff6e6" : "#ff1a1a");
        c.emissiveIntensity = 0;
        c.toneMapped = false; // lets bloom pick the lamps up
        (r === "headlights" ? out.headlights : out.taillights).push(c);
      }
      return c;
    };

    const isCabinGlass = (name: string): boolean =>
      glassRe.test(name) && !NOT_CABIN_GLASS.test(name);
    const hideRe = re(asset.interior?.hide);
    const glassMeshes: THREE.Mesh[] = [];

    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      // Grounding comes from contact shadows + the reflective floor.
      obj.castShadow = false;
      obj.receiveShadow = false;
      const swap = (m: THREE.Material): THREE.Material => {
        const name = m.name ?? "";
        if (isCabinGlass(name)) {
          obj.renderOrder = 2; // after the cabin, so the interior shows through
          glassMeshes.push(obj);
          return glass;
        }
        if (hideRe?.test(name)) obj.visible = false;
        const r = role(name);
        return r && isPaintable(m) ? cloneFor(m, r) : m;
      };
      obj.material = Array.isArray(obj.material) ? obj.material.map(swap) : swap(obj.material);
    });

    // Orientation, scale and placement.
    model.rotation.y = asset.rotationY;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = (asset.length ?? 3.8) / Math.max(size.x, size.z, 1e-6);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    model.updateMatrixWorld(true);

    // Cabin volume from the glazing, for the generated interior.
    if (asset.interior && glassMeshes.length) {
      const g = new THREE.Box3();
      for (const m of glassMeshes) g.union(new THREE.Box3().setFromObject(m));
      out.cabin = {
        x0: g.min.x,
        x1: g.max.x,
        width: (g.max.z - g.min.z) * 0.9,
        belt: g.min.y,
        roof: g.max.y,
        rows: asset.interior.rows,
        ...asset.interior.cabin,
      };

      if (asset.interior.replace) {
        const c = out.cabin;
        const { floor } = cabinLevels(c);
        const tol = 0.06;
        const volume = new THREE.Box3(
          new THREE.Vector3(c.x0 - tol, floor - tol, -c.width / 2 - tol),
          new THREE.Vector3(c.x1 + tol, c.roof + tol, c.width / 2 + tol),
        );
        const glassSet = new Set<THREE.Object3D>(glassMeshes);
        const mb = new THREE.Box3();
        model.traverse((o) => {
          if (!(o instanceof THREE.Mesh) || glassSet.has(o)) return;
          mb.setFromObject(o);
          if (!mb.isEmpty() && volume.containsBox(mb)) o.visible = false;
        });
      }
    }

    // Rig: wheels. The car's lateral axis is world Z once the nose points
    // along +X, so each wheel's axle is world Z expressed in its parent's
    // space; the rolling radius is the axle's height above the floor.
    const caliperRe = re(rig.calipers);
    const parentQ = new THREE.Quaternion();
    const worldPos = new THREE.Vector3();
    for (const name of rig.wheels ?? []) {
      // GLTFLoader strips "." and other reserved characters from node names.
      const node =
        model.getObjectByName(name) ?? model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
      if (!node) continue;
      node.getWorldPosition(worldPos);
      const radius = Math.max(0.1, worldPos.y);
      (node.parent ?? model).getWorldQuaternion(parentQ);
      const axis = rig.wheelAxis
        ? new THREE.Vector3(...rig.wheelAxis).normalize()
        : new THREE.Vector3(0, 0, 1).applyQuaternion(parentQ.clone().invert()).normalize();
      const calipers: Wheel["calipers"] = [];
      if (caliperRe) {
        node.traverse((child) => {
          if (child !== node && caliperRe.test(child.name)) {
            calipers.push({ node: child, pos: child.position.clone(), quat: child.quaternion.clone() });
          }
        });
      }
      out.wheels.push({ node, rest: node.quaternion.clone(), axis, radius, calipers });
    }
    for (const d of rig.doors ?? []) {
      const node = model.getObjectByName(d.node);
      if (!node) continue;
      out.doors.push({
        node,
        rest: node.quaternion.clone(),
        axis: new THREE.Vector3(...d.axis).normalize(),
        angle: d.angle,
      });
    }

    out.root.add(model);
    return out;
  }, [scene, asset]);

  // Selection targets — the frame loop eases materials towards them.
  const targets = React.useRef({
    body: new THREE.Color(bodyHex),
    interior: new THREE.Color(interiorHex),
    metalness: bodyMetallic ? 0.7 : 0.1,
    roughness: bodyMetallic ? 0.34 : 0.4,
    flake: bodyMetallic ? 0.35 : 0,
    sport: wheelStyle === "sport",
  });
  React.useEffect(() => {
    const t = targets.current;
    t.body.set(bodyHex);
    t.interior.set(interiorHex);
    t.metalness = bodyMetallic ? 0.7 : 0.1;
    t.roughness = bodyMetallic ? 0.34 : 0.4;
    t.flake = bodyMetallic ? 0.35 : 0;
    t.sport = wheelStyle === "sport";
  }, [bodyHex, interiorHex, bodyMetallic, wheelStyle]);

  // Snap to the initial selection so the car never fades in from the
  // model's original colour.
  React.useLayoutEffect(() => {
    const t = targets.current;
    for (const { material: m, flake } of prepared.paint) {
      m.color.copy(t.body);
      m.metalness = t.metalness;
      m.roughness = t.roughness;
      m.normalScale.copy(flake).multiplyScalar(t.flake);
    }
    for (const m of prepared.interior) m.color.copy(t.interior);
  }, [prepared]);

  const doorOpen = React.useRef(0);
  const flakeMix = React.useRef(targets.current.flake);
  const scratchQ = React.useMemo(() => new THREE.Quaternion(), []);
  const invQ = React.useMemo(() => new THREE.Quaternion(), []);
  const darkRim = React.useMemo(() => new THREE.Color("#2b2b2b"), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = targets.current;
    const m = motion.current;
    const k = damp(7, dt);

    flakeMix.current += (t.flake - flakeMix.current) * k;
    for (const { material, flake } of prepared.paint) {
      material.color.lerp(t.body, k);
      material.metalness += (t.metalness - material.metalness) * k;
      material.roughness += (t.roughness - material.roughness) * k;
      material.normalScale.copy(flake).multiplyScalar(flakeMix.current);
    }
    for (const mat of prepared.interior) mat.color.lerp(t.interior, k);
    for (const { material, original } of prepared.rims) {
      material.color.lerp(t.sport ? darkRim : original, k);
    }

    // Lights: headlights wake after the drive-in, brake lights flare while braking.
    for (const mat of prepared.headlights) mat.emissiveIntensity = 5 * m.lightsOn;
    for (const mat of prepared.taillights) {
      mat.emissiveIntensity = 0.8 * m.lightsOn + 4 * m.braking;
    }

    // Wheels roll with distance travelled; calipers are held still.
    for (const w of prepared.wheels) {
      // Rolling forward (+X) turns the wheel negatively about the axle (+Z).
      scratchQ.setFromAxisAngle(w.axis, -m.travel / w.radius);
      w.node.quaternion.copy(scratchQ).multiply(w.rest);
      if (w.calipers.length) {
        invQ.copy(w.node.quaternion).invert();
        for (const c of w.calipers) {
          c.node.quaternion.copy(invQ).multiply(w.rest).multiply(c.quat);
          c.node.position.copy(c.pos).applyQuaternion(w.rest).applyQuaternion(invQ);
        }
      }
    }

    // Doors ease open / closed.
    doorOpen.current += (m.doorsTarget - doorOpen.current) * damp(m.reduced ? 30 : 3.2, dt);
    for (const d of prepared.doors) {
      scratchQ.setFromAxisAngle(d.axis, d.angle * doorOpen.current);
      d.node.quaternion.copy(scratchQ).multiply(d.rest);
    }
  });

  // Free the cloned materials when this car unmounts.
  React.useEffect(
    () => () => {
      for (const mat of [
        ...prepared.paint.map((p) => p.material),
        ...prepared.interior,
        ...prepared.rims.map((r) => r.material),
        ...prepared.headlights,
        ...prepared.taillights,
        prepared.glass,
      ]) {
        mat.dispose();
      }
    },
    [prepared],
  );

  return (
    <group>
      <primitive object={prepared.root} />
      {prepared.cabin ? <CabinInterior cabin={prepared.cabin} interiorHex={interiorHex} /> : null}
    </group>
  );
}

/** Start downloading a model before the canvas mounts. */
export function preloadCar(url: string): void {
  useGLTF.preload(url, false, true);
}
