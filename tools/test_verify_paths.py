import os
import re

proj = r"C:\Users\AMAL\knight-of-words-2.5d"
game_js = os.path.join(proj, "js", "game25d.js")

with open(game_js, "r", encoding="utf-8") as f:
    code = f.read()

# Find all occurrences of assets/...
assets = re.findall(r"['\"](assets/[^'\"]+?\.png)['\"]", code)
print(f"Checking {len(assets)} asset paths in game25d.js...")

missing = []
for a in assets:
    full = os.path.join(proj, a.replace("/", os.sep))
    if not os.path.exists(full):
        missing.append(a)

if missing:
    print("Missing assets in game25d.js:", missing)
else:
    print("100% of asset paths referenced in game25d.js exist on disk!")
