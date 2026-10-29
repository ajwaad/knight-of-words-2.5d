import os
import sys
import glob
import json
import shutil
import argparse
import numpy as np
from PIL import Image

DEFAULT_SRC = r"C:\Users\AMAL\Downloads\sprites\assets"
PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ_ASSETS = os.path.join(PROJ_ROOT, "assets")

def standardize_frame(img, canvas_size=(300, 300), bottom_pad=12, auto_upright=False):
    """Crops transparent bounds, optionally fixes 90-degree rotated Unity atlas sprites, and centers on a uniform canvas."""
    img = img.convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3] > 12
    if not np.any(alpha):
        return Image.new("RGBA", canvas_size, (0, 0, 0, 0))

    ys, xs = np.where(alpha)
    crop = img.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

    if auto_upright:
        # In Unity tk2d atlases, upright Knight sprites have the bright white mask at the top
        # If packed sideways (90 deg), the brightest region is on the left or right edge.
        c_arr = np.array(crop)
        c_alpha = c_arr[:, :, 3] > 40
        luma = (0.299 * c_arr[:, :, 0] + 0.587 * c_arr[:, :, 1] + 0.114 * c_arr[:, :, 2]) * c_alpha
        h, w = luma.shape
        if w > h * 1.15:
            top_b = luma[:max(1, h // 3), :].mean()
            left_b = luma[:, :max(1, w // 3)].mean()
            right_b = luma[:, -max(1, w // 3):].mean()
            if left_b > top_b * 1.25 and left_b >= right_b:
                crop = crop.rotate(-90, expand=True)
            elif right_b > top_b * 1.25 and right_b > left_b:
                crop = crop.rotate(90, expand=True)

    cw, ch = canvas_size
    max_w, max_h = int(cw * 0.86), int(ch * 0.86)
    if crop.width > max_w or crop.height > max_h:
        scale = min(max_w / max(crop.width, 1), max_h / max(crop.height, 1))
        crop = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.Resampling.LANCZOS)

    out = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    px = (cw - crop.width) // 2
    py = max(0, ch - crop.height - bottom_pad)
    out.paste(crop, (px, py), crop)
    return out

def copy_named_sequence(src_files, dst_folder, prefix=None, canvas_size=None, max_frames=12):
    os.makedirs(dst_folder, exist_ok=True)
    selected = sorted(src_files)[:max_frames]
    saved = []
    for idx, fp in enumerate(selected):
        fname = f"{prefix}_{idx:02d}.png" if prefix else os.path.basename(fp)
        out_path = os.path.join(dst_folder, fname)
        if canvas_size:
            im = standardize_frame(Image.open(fp), canvas_size=canvas_size)
            im.save(out_path, "PNG")
        else:
            shutil.copy2(fp, out_path)
        saved.append(out_path)
    return saved

def find_files_matching(root_dir, keywords, exclude=()):
    matches = []
    for dirpath, _, filenames in os.walk(root_dir):
        for fn in filenames:
            if not fn.lower().endswith(".png"):
                continue
            low = fn.lower()
            if any(k.lower() in low for k in keywords) and not any(x.lower() in low for x in exclude):
                matches.append(os.path.join(dirpath, fn))
    return sorted(matches)

def rebuild_manifests():
    manifest = {}
    animations = {}
    for dirpath, _, filenames in os.walk(PROJ_ASSETS):
        pngs = sorted([f for f in filenames if f.lower().endswith(".png")])
        if not pngs:
            continue
        rel_dir = os.path.relpath(dirpath, PROJ_ASSETS).replace("\\", "/")
        if rel_dir == ".":
            continue
        manifest[rel_dir] = pngs
        animations[rel_dir] = [f"assets/{rel_dir}/{f}" for f in pngs]

    with open(os.path.join(PROJ_ASSETS, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    os.makedirs(os.path.join(PROJ_ROOT, "data"), exist_ok=True)
    with open(os.path.join(PROJ_ROOT, "data", "animations.json"), "w", encoding="utf-8") as f:
        json.dump(animations, f, indent=2)
    print(f"Updated assets/manifest.json and data/animations.json ({sum(len(v) for v in manifest.values())} PNGs indexed).")

def extract_from_drive_dump(base_src):
    if not os.path.exists(base_src):
        print(f"[INFO] External sprite dump '{base_src}' not found on this machine.")
        print("[INFO] Retaining bundled ready-to-play PNG assets in assets/ and refreshing manifests.")
        rebuild_manifests()
        return

    print(f"=== SYNCING PROPERLY NAMED ASSETS FROM {base_src} ===")

    # 1. THE KNIGHT: Prefer named frames in 'The Knight' subfolder over raw packed atlas
    knight_dir = os.path.join(base_src, "The Knight")
    if os.path.exists(knight_dir):
        idle_files = find_files_matching(knight_dir, ["idle"], exclude=["atlas"])
        run_files = find_files_matching(knight_dir, ["run", "walk"], exclude=["atlas"])
        jump_files = find_files_matching(knight_dir, ["jump", "airborne", "fall"], exclude=["atlas"])
        atk_files = find_files_matching(knight_dir, ["slash", "attack", "nail"], exclude=["atlas"])
        cast_files = find_files_matching(knight_dir, ["fireball", "cast", "focus", "scream"], exclude=["atlas"])
        hurt_files = find_files_matching(knight_dir, ["hurt", "damage", "recoil", "stun"], exclude=["atlas"])

        if idle_files:
            copy_named_sequence(idle_files, os.path.join(PROJ_ASSETS, "knight", "idle"), "knight_idle", (300, 300), 4)
        if run_files:
            copy_named_sequence(run_files, os.path.join(PROJ_ASSETS, "knight", "run"), "knight_run", (300, 300), 7)
        if jump_files:
            copy_named_sequence(jump_files, os.path.join(PROJ_ASSETS, "knight", "jump"), "knight_jump", (300, 300), 5)
        if atk_files:
            copy_named_sequence(atk_files, os.path.join(PROJ_ASSETS, "knight", "attack"), "knight_attack", (300, 300), 5)
        if cast_files:
            copy_named_sequence(cast_files, os.path.join(PROJ_ASSETS, "knight", "cast"), "knight_cast", (300, 300), 5)
        if hurt_files:
            im = standardize_frame(Image.open(hurt_files[0]), (300, 300))
            im.save(os.path.join(PROJ_ASSETS, "knight", "hurt.png"), "PNG")

    # 2. CHAMBER 1: HIVELING
    hiveling_files = find_files_matching(base_src, ["Hiveling - fly"])
    if hiveling_files:
        copy_named_sequence(hiveling_files, os.path.join(PROJ_ASSETS, "enemies", "hiveling", "fly"), None, None, 5)
        copy_named_sequence(hiveling_files, os.path.join(PROJ_ASSETS, "enemies", "hiveling"), None, None, 5)

    # 3. CHAMBER 2: MANTIS SCOUT / MANTIS YOUTH / MANTIS WARRIOR
    mantis_idle = find_files_matching(base_src, ["Mantis Youth - idle", "Mantis Warrior - idle", "Mantis - idle", "Mantis_fly"])
    mantis_atk = find_files_matching(base_src, ["Mantis Youth - attack", "Mantis Warrior - slash", "Mantis - attack", "Mantis - lance"])
    if mantis_idle:
        copy_named_sequence(mantis_idle, os.path.join(PROJ_ASSETS, "enemies", "mantis", "idle"), "Mantis_Scout_idle", (340, 320), 6)
    if mantis_atk:
        copy_named_sequence(mantis_atk, os.path.join(PROJ_ASSETS, "enemies", "mantis", "attack"), "Mantis_Scout_attack", (340, 320), 6)

    # 4. CHAMBER 3: DUNG DEFENDER
    dung_idle = find_files_matching(base_src, ["Dung Defender - idle", "Dung_Def_Body", "dung_def_idle"])
    dung_atk = find_files_matching(base_src, ["Dung Defender - throw", "Dung Defender - roll", "Dung Defender - punch", "dung_def_sleep"])
    if dung_idle:
        copy_named_sequence(dung_idle, os.path.join(PROJ_ASSETS, "bosses", "dung_defender", "idle"), "dung_def_idle", (360, 320), 4)
    if dung_atk:
        copy_named_sequence(dung_atk, os.path.join(PROJ_ASSETS, "bosses", "dung_defender", "attack"), "dung_def_attack", (360, 320), 4)

    # 5. CHAMBER 4: HORNET
    hornet_idle = find_files_matching(base_src, ["Hornet - idle"])
    hornet_jump = find_files_matching(base_src, ["Hornet - jump"])
    hornet_atk = find_files_matching(base_src, ["Hornet - throw_side"])
    hornet_land = find_files_matching(base_src, ["Hornet - hard_land"])
    if hornet_idle:
        copy_named_sequence(hornet_idle, os.path.join(PROJ_ASSETS, "bosses", "hornet", "idle"), None, None, 2)
    if hornet_jump:
        copy_named_sequence(hornet_jump, os.path.join(PROJ_ASSETS, "bosses", "hornet", "jump"), None, None, 10)
    if hornet_atk:
        copy_named_sequence(hornet_atk, os.path.join(PROJ_ASSETS, "bosses", "hornet", "attack"), None, None, 8)
    if hornet_land:
        copy_named_sequence(hornet_land, os.path.join(PROJ_ASSETS, "bosses", "hornet", "land"), None, None, 6)

    # 6. CHAMBER 5: TROUPE MASTER GRIMM (Use standing/bow/cast frames, NOT sleep_heartbeat organ!)
    grimm_bow = find_files_matching(base_src, ["GG_grimm_bow", "Grimm - bow"])
    grimm_idle = find_files_matching(base_src, ["Grimm - idle", "GG_grimm_bow", "Grimm - stand", "Grimm - cape"])
    if grimm_bow:
        copy_named_sequence(grimm_bow, os.path.join(PROJ_ASSETS, "bosses", "grimm", "bow"), None, None, 7)
    if grimm_idle:
        for i in range(4):
            src_fp = grimm_idle[min(i, len(grimm_idle) - 1)]
            dst_fp = os.path.join(PROJ_ASSETS, "bosses", "grimm", "idle", f"Grimm_sleep_heartbeat000{i}.png")
            os.makedirs(os.path.dirname(dst_fp), exist_ok=True)
            shutil.copy2(src_fp, dst_fp)

    rebuild_manifests()
    print("=== DRIVE SPRITE SYNC COMPLETE ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Hollow Knight 1.5.12459 named sprites into Knight of Words 2.5D.")
    parser.add_argument("--src", default=DEFAULT_SRC, help="Path to extracted Hollow Knight sprites Drive folder")
    args = parser.parse_args()
    extract_from_drive_dump(args.src)
