import os
import json

proj = r"C:\Users\AMAL\knight-of-words-2.5d"

# 1. Check questions.json
q_path = os.path.join(proj, "data", "questions.json")
assert os.path.exists(q_path), "questions.json missing"
with open(q_path, encoding="utf-8") as f:
    qs = json.load(f)
print(f"Verification: {len(qs)} questions loaded.")
for q in qs:
    assert len(q["options"]) == 4, f"Question {q['id']} must have 4 options"
    assert 0 <= q["answer"] < 4, f"Question {q['id']} answer out of range"
    assert "clue" in q and q["clue"], f"Question {q['id']} missing clue"
    assert "explanation" in q and q["explanation"], f"Question {q['id']} missing explanation"

# 2. Check Three.js library
three_path = os.path.join(proj, "libs", "three.min.js")
assert os.path.exists(three_path), "three.min.js missing"
print(f"Verification: three.min.js size: {os.path.getsize(three_path)} bytes")

# 3. Check essential character and UI assets
required_assets = [
    "assets/knight/idle.png",
    "assets/knight/walk.png",
    "assets/knight/attack.png",
    "assets/knight/cast.png",
    "assets/knight/hurt.png",
    "assets/knight/slash_wave.png",
    "assets/ui/mask_full.png",
    "assets/ui/mask_empty.png",
    "assets/enemies/hiveling/Hiveling - fly0000.png",
    "assets/bosses/hornet/Hornet - idle0000.png",
    "assets/bosses/dung_defender/Dung_Def_Body.png",
    "assets/bosses/grimm/GG_grimm_bow0000.png",
    "assets/bg/nailmaster_03_0008_BG.png",
    "assets/bg/nailmaster_03_0006_curtain_MID.png",
    "assets/bg/Nailmaster_03__0001_Floor.png",
    "assets/bg/nailmaster_03_0003_FG.png"
]

missing = []
for rel in required_assets:
    full = os.path.join(proj, rel.replace("/", os.sep))
    if not os.path.exists(full):
        missing.append(rel)

if missing:
    print("WARNING: Missing assets:", missing)
else:
    print("Verification: All required sprite and UI textures exist on disk! Exit code 0.")
