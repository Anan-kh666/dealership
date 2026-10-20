"""
Export the open Blender scene to the dealership site.

How to use:
  1. Save your .blend inside the vehicle's folder, e.g. models/aurora-suv/aurora-suv.blend
     (create the folder if it's a new vehicle — the folder name becomes the web address).
  2. In Blender: Scripting tab → Open → this file → Run Script (▶).
  3. It writes models/<vehicle>/model.glb. With `pnpm dev` running, the site
     picks it up within a second or two; otherwise run `pnpm vehicles:sync`.

The site does the heavy lifting (texture compression, mesh compression,
wheel pivots), so this exports at full quality with no compression.
Checked against Blender 3.6 – 4.x export options.
"""

import os
import re

import bpy

# Export only the selected objects (True) or everything visible (False).
ONLY_SELECTED = False


def report(lines):
    print("\n".join(lines))
    def draw(self, _context):
        for line in lines:
            self.layout.label(text=line)
    bpy.context.window_manager.popup_menu(draw, title="Export to site", icon="EXPORT")


def main():
    blend = bpy.data.filepath
    if not blend:
        report(["Save the .blend into models/<vehicle-folder>/ first."])
        return
    folder = os.path.dirname(blend)
    if os.path.basename(os.path.dirname(folder)) != "models":
        report([
            "This .blend isn't inside models/<vehicle-folder>/.",
            f"It's in: {folder}",
            "Move it there (Save As) and run again.",
        ])
        return

    tips = []
    materials = [m.name for m in bpy.data.materials if m.users]
    if not any(re.search(r"paint|^body|carpaint", m, re.I) for m in materials):
        tips.append('Tip: name the body material "Paint" so customers can pick colours.')
    if not any(re.search(r"glass|window|windscreen|windshield", m, re.I) for m in materials):
        tips.append('Tip: name window materials "Glass" for see-through windows.')
    wheels = [o.name for o in bpy.data.objects if re.search(r"wheel", o.name, re.I)
              and not re.search(r"steer|spare", o.name, re.I)]
    if len(wheels) < 4:
        tips.append("Tip: name the wheels Wheel_FL, Wheel_FR, Wheel_RL, Wheel_RR so they spin.")
    if not any(re.search(r"head.?(light|lamp)", m, re.I) for m in materials):
        tips.append('Tip: a "Headlight" material lets the site find the front and light it up.')

    out = os.path.join(folder, "model.glb")
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        use_selection=ONLY_SELECTED,
        export_apply=True,   # apply modifiers (mirror, subdivision, bevel…)
        export_yup=True,     # glTF is Y-up; the site expects this
    )
    size = os.path.getsize(out) / 1024 / 1024
    report([f"Exported {os.path.relpath(out, os.path.dirname(os.path.dirname(folder)))} ({size:.1f} MB)"] + tips)


main()
