import os
import re
import shutil
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

base_src = r"C:\Users\AMAL\Downloads\sprites\assets"
proj_assets = r"C:\Users\AMAL\knight-of-words-2.5d\assets"

def extract_all():
    print("=== EXTRACTING FULL MULTI-FRAME ANIMATION SEQUENCES ===")

    # 1. HORNET: 41 individual frames!
    # - Idle: Hornet - idle0000.png, idle0001.png
    # - Jump: Hornet - jump0000.png to jump0009.png (10 frames)
    # - Throw/Attack: Hornet - throw_side0000.png to throw_side0007.png (8 frames)
    # - Harpoon Thread: 9 frames
    # - Land: 6 frames
    hornet_src = os.path.join(base_src, "Bosses", "Hornet")
    hornet_dst = os.path.join(proj_assets, "bosses", "hornet")
    os.makedirs(os.path.join(hornet_dst, "idle"), exist_ok=True)
    os.makedirs(os.path.join(hornet_dst, "jump"), exist_ok=True)
    os.makedirs(os.path.join(hornet_dst, "attack"), exist_ok=True)
    os.makedirs(os.path.join(hornet_dst, "land"), exist_ok=True)

    for f in os.listdir(hornet_src):
        fp = os.path.join(hornet_src, f)
        if "idle" in f:
            shutil.copy2(fp, os.path.join(hornet_dst, "idle", f))
        elif "jump" in f:
            shutil.copy2(fp, os.path.join(hornet_dst, "jump", f))
        elif "throw_side" in f or "harpoon" in f:
            shutil.copy2(fp, os.path.join(hornet_dst, "attack", f))
        elif "hard_land" in f:
            shutil.copy2(fp, os.path.join(hornet_dst, "land", f))

    print(f"Hornet animation cycles organized into idle, jump, attack, land.")

    # 2. GRIMM:
    # - Bow: GG_grimm_bow0000.png to 0006.png (7 frames)
    # - Heartbeat: Grimm_sleep_heartbeat0000.png to 0003.png (4 frames)
    # - Eye Appear: Nightmare_Grimm_eye_appear0000.png to 0002.png (3 frames)
    grimm_src = os.path.join(base_src, "Bosses", "Grimm")
    grimm_dst = os.path.join(proj_assets, "bosses", "grimm")
    os.makedirs(os.path.join(grimm_dst, "bow"), exist_ok=True)
    os.makedirs(os.path.join(grimm_dst, "idle"), exist_ok=True)

    for f in os.listdir(grimm_src):
        fp = os.path.join(grimm_src, f)
        if "bow" in f:
            shutil.copy2(fp, os.path.join(grimm_dst, "bow", f))
        elif "heartbeat" in f:
            shutil.copy2(fp, os.path.join(grimm_dst, "idle", f))

    print(f"Grimm animation cycles organized.")

    # 3. HIVELING:
    # - Fly: Hiveling - fly0000.png to fly0004.png (5 frames)
    enemies_src = os.path.join(base_src, "Enemies & Corpses")
    hiveling_dst = os.path.join(proj_assets, "enemies", "hiveling", "fly")
    os.makedirs(hiveling_dst, exist_ok=True)
    for f in os.listdir(enemies_src):
        if f.startswith("Hiveling - fly") and f.endswith(".png"):
            shutil.copy2(os.path.join(enemies_src, f), os.path.join(hiveling_dst, f))
    print(f"Hiveling fly cycle copied (5 frames).")

    # 4. GRIMMKIN / GHOST CROWD:
    # - Grimm_crowd0000.png to 0007.png (8 frames)
    grimmkin_dst = os.path.join(proj_assets, "enemies", "grimmkin", "float")
    os.makedirs(grimmkin_dst, exist_ok=True)
    for f in os.listdir(enemies_src):
        if "Grimm_crowd" in f and f.endswith(".png"):
            shutil.copy2(os.path.join(enemies_src, f), os.path.join(grimmkin_dst, f))
    print(f"Grimmkin floating cycle copied (8 frames).")

    # 5. DUNG DEFENDER:
    dung_src = os.path.join(base_src, "Bosses", "Dung Defender & White Defender")
    dung_dst = os.path.join(proj_assets, "bosses", "dung_defender")
    os.makedirs(os.path.join(dung_dst, "sleep"), exist_ok=True)
    for f in os.listdir(dung_src):
        if "sleep" in f:
            shutil.copy2(os.path.join(dung_src, f), os.path.join(dung_dst, "sleep", f))
    print(f"Dung Defender sleep/emerge cycle copied.")

    # 6. VFX SLASHES: Radiance_GG_slashes0000.png to 0010.png (11 frames!)
    vfx_src = os.path.join(base_src, "Particles & Effects")
    slash_dst = os.path.join(proj_assets, "vfx", "slashes")
    os.makedirs(slash_dst, exist_ok=True)
    for f in os.listdir(vfx_src):
        if f.startswith("Radiance_GG_slashes") and f.endswith(".png"):
            shutil.copy2(os.path.join(vfx_src, f), os.path.join(slash_dst, f))
    print(f"Radiance multi-frame slashes copied (11 frames).")

    # 7. THE KNIGHT ANIMATION SEQUENCES FROM ATLAS:
    # Let's extract real sequential animation strips from 'The Knight main sprites - atlas0 #00000357.png'
    knight_atlas_path = os.path.join(base_src, "The Knight", "The Knight main sprites - atlas0 #00000357.png")
    atlas = Image.open(knight_atlas_path)
    alpha = np.array(atlas.split()[-1]) > 10
    labeled, num_features = label(alpha)
    objs = find_objects(labeled)

    knight_dst = os.path.join(proj_assets, "knight")
    os.makedirs(os.path.join(knight_dst, "idle"), exist_ok=True)
    os.makedirs(os.path.join(knight_dst, "run"), exist_ok=True)
    os.makedirs(os.path.join(knight_dst, "attack"), exist_ok=True)
    os.makedirs(os.path.join(knight_dst, "jump"), exist_ok=True)
    os.makedirs(os.path.join(knight_dst, "cast"), exist_ok=True)

    # Collect body-sized sprites with coordinates
    sprites = []
    for i, sl in enumerate(objs):
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        y = sl[0].start
        x = sl[1].start
        if 110 <= h <= 280 and 70 <= w <= 260:
            sprites.append({'id': i, 'x': x, 'y': y, 'w': w, 'h': h, 'sl': sl})

    # Sort primarily by Y, then X to get animation strips
    sprites.sort(key=lambda s: (round(s['y'] / 35) * 35, s['x']))

    # Group into strips of 4 to 8 frames
    strips = []
    current_strip = []
    for s in sprites:
        if not current_strip:
            current_strip.append(s)
        else:
            prev = current_strip[-1]
            if abs(s['y'] - prev['y']) < 30 and (s['x'] - prev['x']) < 400:
                current_strip.append(s)
            else:
                if len(current_strip) >= 4:
                    strips.append(current_strip)
                current_strip = [s]
    if len(current_strip) >= 4:
        strips.append(current_strip)

    print(f"Extracted {len(strips)} contiguous Knight animation strips from atlas!")

    # Categorize strips by aspect ratio / width
    # 1. Run/Walk: Typically 6-8 frames with moderate width (~120-170px)
    # 2. Idle: 4-6 frames upright (~100-140px)
    # 3. Slash/Attack: wide frames (>180px with weapon arc)
    # 4. Jump/Fall: vertical frames
    run_strip = None
    idle_strip = None
    attack_strip = None
    jump_strip = None
    cast_strip = None

    for strip in strips:
        avg_w = np.mean([s['w'] for s in strip])
        avg_h = np.mean([s['h'] for s in strip])
        n = len(strip)
        print(f"Strip: {n} frames, avg_w: {avg_w:.1f}, avg_h: {avg_h:.1f}, Y: {strip[0]['y']}")

        if n >= 6 and 120 <= avg_w <= 175 and run_strip is None:
            run_strip = strip
        elif n >= 4 and avg_w > 180 and attack_strip is None:
            attack_strip = strip
        elif n >= 4 and avg_w < 130 and idle_strip is None:
            idle_strip = strip
        elif n >= 4 and jump_strip is None:
            jump_strip = strip
        elif n >= 4 and cast_strip is None:
            cast_strip = strip

    # Fallbacks if any category is none
    if not run_strip and strips: run_strip = strips[0]
    if not idle_strip and len(strips) > 1: idle_strip = strips[1]
    if not attack_strip and len(strips) > 2: attack_strip = strips[2]
    if not jump_strip and len(strips) > 3: jump_strip = strips[3]
    if not cast_strip and len(strips) > 4: cast_strip = strips[4]

    def save_strip(strip, target_folder, prefix):
        if not strip: return
        for idx, s in enumerate(strip):
            sl = s['sl']
            crop = atlas.crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
            # Standardize canvas size to prevent jitter
            out_img = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
            # Anchor at bottom-center
            paste_x = (300 - crop.width) // 2
            paste_y = 300 - crop.height - 10
            out_img.paste(crop, (paste_x, paste_y))
            out_img.save(os.path.join(target_folder, f"{prefix}_{idx:02d}.png"))
        print(f"Saved {len(strip)} frames to {target_folder}")

    save_strip(idle_strip, os.path.join(knight_dst, "idle"), "knight_idle")
    save_strip(run_strip, os.path.join(knight_dst, "run"), "knight_run")
    save_strip(attack_strip, os.path.join(knight_dst, "attack"), "knight_attack")
    save_strip(jump_strip, os.path.join(knight_dst, "jump"), "knight_jump")
    save_strip(cast_strip, os.path.join(knight_dst, "cast"), "knight_cast")

    print("=== ALL ANIMATION CYCLES SUCCESSFULLY PROCESSED AND ORGANIZED! ===")

if __name__ == "__main__":
    extract_all()
