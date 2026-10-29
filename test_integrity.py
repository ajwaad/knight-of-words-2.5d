import os
import json

proj = os.path.dirname(os.path.abspath(__file__))

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

# 3. Check essential character, boss, enemy, VFX, and UI assets
required_assets = [
    "assets/knight/idle.png",
    "assets/knight/walk.png",
    "assets/knight/attack.png",
    "assets/knight/cast.png",
    "assets/knight/hurt.png",
    "assets/knight/slash_wave.png",
    "assets/knight/idle/knight_idle_00.png",
    "assets/knight/run/knight_run_00.png",
    "assets/knight/jump/knight_jump_00.png",
    "assets/knight/attack/knight_attack_00.png",
    "assets/knight/cast/knight_cast_00.png",
    "assets/ui/mask_full.png",
    "assets/ui/mask_empty.png",
    "assets/vfx/soul_orb.png",
    "assets/vfx/slashes/Radiance_GG_slashes0000.png",
    "assets/enemies/hiveling/Hiveling - fly0000.png",
    "assets/enemies/hiveling/fly/Hiveling - fly0000.png",
    "assets/enemies/mantis/idle/Mantis_Scout_idle_00.png",
    "assets/enemies/mantis/attack/Mantis_Scout_attack_00.png",
    "assets/bosses/hornet/Hornet - idle0000.png",
    "assets/bosses/hornet/idle/Hornet - idle0000.png",
    "assets/bosses/dung_defender/Dung_Def_Body.png",
    "assets/bosses/dung_defender/idle/dung_def_idle_00.png",
    "assets/bosses/dung_defender/attack/dung_def_attack_00.png",
    "assets/bosses/grimm/GG_grimm_bow0000.png",
    "assets/bosses/grimm/bow/GG_grimm_bow0000.png",
    "assets/bosses/grimm/idle/Grimm_sleep_heartbeat0000.png",
    "assets/bg/nailmaster_03_0008_BG.png",
    "assets/bg/nailmaster_03_0006_curtain_MID.png",
    "assets/bg/Nailmaster_03__0001_Floor.png",
    "assets/bg/nailmaster_03_0003_FG.png",
    "assets/bg/chamber_gate_arch.png"
]

missing = []
for rel in required_assets:
    full = os.path.join(proj, rel.replace("/", os.sep))
    if not os.path.exists(full):
        missing.append(rel)

if missing:
    raise AssertionError(f"Missing required assets: {missing}")
else:
    print("Verification: All required sprite and UI textures exist on disk! Exit code 0.")
