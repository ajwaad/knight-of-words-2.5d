import os
import re

proj = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
game_js = os.path.join(proj, "js", "game25d.js")

with open(game_js, "r", encoding="utf-8") as f:
    code = f.read()

with open(os.path.join(proj, "assets", "manifest.txt"), "r", encoding="utf-8") as f:
    manifest_set = set(l.split(" | ")[0].strip() for l in f if l.strip() and not l.startswith("#"))

assets = re.findall(r"['\"](assets/[^'\"\$`]+?\.png)['\"]", code)
print(f"Checking {len(assets)} static asset paths in game25d.js against manifest.txt...")

missing = [a for a in assets if a not in manifest_set]
if missing:
    raise AssertionError(f"Asset paths in game25d.js not in manifest.txt: {missing}")
else:
    print("100% of static asset paths referenced in game25d.js match manifest.txt verbatim!")
