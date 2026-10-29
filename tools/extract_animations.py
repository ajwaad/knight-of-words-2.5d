import os
import json
import shutil
import argparse

DEFAULT_SRC = r"C:\Users\AMAL\Downloads\sprites\assets"
PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ_ASSETS = os.path.join(PROJ_ROOT, "assets")

# Exact, verified relative paths inside assets/ from manifest.txt
MANIFEST_ASSET_MAP = {
    "knight/idle": [
        "assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side0000.png",
        "assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side0001.png",
        "assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side0002.png",
        "assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side0003.png",
        "assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side0004.png",
    ],
    "knight/run": [
        f"assets/Inventory & UI/Loading icons/loading_icon_new000{i}.png" for i in range(8)
    ],
    "knight/jump": [
        f"assets/Particles & Effects/Charm & Spells/Desolate Dive - quake_pickup000{i}.png" for i in range(3, 9)
    ],
    "knight/attack": [
        "assets/Particles & Effects/Charm & Spells/Desolate Dive - quake_pickup0003.png",
        "assets/Particles & Effects/Charm & Spells/Desolate Dive - quake_pickup0004.png",
        "assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect0004.png",
        "assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect0005.png",
        "assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect0006.png",
        "assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect0007.png",
        "assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect0008.png",
    ],
    "knight/cast": [
        f"assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect000{i}.png" for i in range(3, 10)
    ],
    "knight/focus": [
        f"assets/Particles & Effects/Charm & Spells/Howling Wraiths - scream_spell_pickup000{i}.png" for i in range(4, 9)
    ],
    "knight/hurt": [
        f"assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side_shake_01000{i}.png" for i in range(3)
    ],
    "enemies/hiveling/fly": [
        f"assets/Enemies & Corpses/Hiveling - fly000{i}.png" for i in range(5)
    ],
    "enemies/hiveling/attack": [
        "assets/Enemies & Corpses/Hiveling - spawn_01.png",
        "assets/Enemies & Corpses/Hiveling - spawn_02.png",
        *[f"assets/Enemies & Corpses/Hiveling - fly000{i}.png" for i in range(5)],
    ],
    "enemies/mantis/idle": [
        "assets/Hunter_s Journal/Mantis Warrior - bestiary_mantis_f.png",
        "assets/Hunter_s Journal/Mantis Youth - bestiary_mantis_flyer_f.png",
        "assets/NPCs/Weavers/Weaver - idle0002.png",
        "assets/NPCs/Weavers/Weaver - idle0003.png",
        "assets/NPCs/Weavers/Weaver - idle0004.png",
        "assets/NPCs/Weavers/Weaver - idle0005.png",
    ],
    "enemies/mantis/attack": [
        "assets/Hunter_s Journal/Mantis Warrior - bestiary_mantis_f.png",
        "assets/Hunter_s Journal/Mantis Lords - bestiary_mantis_lords_f.png",
        "assets/Hunter_s Journal/Mantis Traitor - bestiary_heavy_mantis_f.png",
        *[f"assets/NPCs/Weavers/Weaver - crawl000{i}.png" for i in range(4)],
    ],
    "bosses/dung_defender/idle": [
        "assets/Hunter_s Journal/Dung Defender - bestiary__0005_dung-defender.png",
    ],
    "bosses/dung_defender/attack": [
        "assets/Hunter_s Journal/Dung Defender - bestiary__0005_dung-defender.png",
        "assets/Hunter_s Journal/White Defender - bestiary_White_Defender_full.png",
        "assets/Bosses/Dung Defender & White Defender/dung_statues_0006_1.png",
    ],
    "bosses/hornet/idle": [
        "assets/Bosses/Hornet/Hornet - idle0000.png",
        "assets/Bosses/Hornet/Hornet - idle0001.png",
    ],
    "bosses/hornet/jump": [
        f"assets/Bosses/Hornet/Hornet - jump000{i}.png" for i in range(10)
    ],
    "bosses/hornet/attack": [
        *[f"assets/Bosses/Hornet/Hornet - throw_side000{i}.png" for i in range(8)],
        "assets/Bosses/Hornet/Hornet - harpoon_side0000.png",
        "assets/Bosses/Hornet/Hornet - harpoon_side0001.png",
    ],
    "bosses/hornet/land": [
        f"assets/Bosses/Hornet/Hornet - hard_land000{i}.png" for i in range(6)
    ],
    "bosses/grimm/idle": [
        "assets/Bosses/Grimm/GG_grimm_bow0000.png",
        "assets/Bosses/Grimm/GG_grimm_bow0001.png",
        "assets/Hunter_s Journal/Troupe Master Grimm - Bestiary_Grimm_boss.png",
    ],
    "bosses/grimm/bow": [
        f"assets/Bosses/Grimm/GG_grimm_bow000{i}.png" for i in range(7)
    ],
    "bosses/grimm/attack": [
        *[f"assets/Bosses/Grimm/GG_grimm_bow000{i}.png" for i in range(2, 7)],
        "assets/Hunter_s Journal/Nightmare King Grimm - Bestiary_Grimm_Nightmare_boss.png",
    ],
    "vfx/slashes": [
        f"assets/Particles & Effects/Radiance_GG_slashes000{i}.png" if i < 10 else f"assets/Particles & Effects/Radiance_GG_slashes00{i}.png"
        for i in range(11)
    ],
    "vfx/dash": [
        f"assets/Particles & Effects/dash_effect_02000{i}.png" for i in range(5)
    ],
    "vfx/soul": [
        "assets/Particles & Effects/soul_orb.png",
        *[f"assets/Particles & Effects/Soul_burst000{i}.png" for i in range(5)],
        "assets/Bosses/The Hollow Knight/Pure Vessel focus ring -  focus_ring.png",
    ],
    "bg": [
        "assets/Architecture & Environment/Nailmaster_03__0001_Floor.png",
        "assets/Architecture & Environment/nailmaster_03_0008_BG.png",
        "assets/Architecture & Environment/nailmaster_03_0006_curtain_MID.png",
        "assets/Architecture & Environment/nailmaster_03_0003_FG.png",
        "assets/Architecture & Environment/nailmaster_03_0007_door.png",
        "assets/Architecture & Environment/Area specfic architecture/Greenpath/nailmaster_fung_hut_02.png",
        "assets/Architecture & Environment/Tram & Stagways/tram_BG_wrecked.png",
        "assets/Architecture & Environment/Area specfic architecture/City of Tears/Ruins_Houses_0004_1bg.png",
        "assets/Architecture & Environment/Area specfic architecture/Dirtmouth/Grimm Tents/Divine_Room_0005_1.png",
        "assets/Area save art/Area_Hive.png",
        "assets/Area save art/Area_Art_Mantis_Village.png",
        "assets/Area save art/Area_Waterways.png",
        "assets/Area save art/Area_Art_City_of_Tears.png",
        "assets/Area save art/Area_Art_Godshome.png",
    ],
    "ui": [
        "assets/Inventory & UI/select_game_HUD_0001_health.png",
        "assets/Inventory & UI/select_game_HUD_0001_health_steel.png",
        "assets/Inventory & UI/soul_orb_full_v020000.png",
        "assets/Inventory & UI/Geo - HUD_coin_v020004.png",
        "assets/Inventory & UI/Spell, Vengeful Spirit - Inv_0025_spell_fireball_01.png",
        "assets/Inventory & UI/Inv_0021_inv_dash_strike_skill.png",
    ],
}

def sync_from_source(base_src):
    if os.path.exists(base_src) and os.path.abspath(base_src) != os.path.abspath(PROJ_ASSETS):
        copied = 0
        for group, rel_list in MANIFEST_ASSET_MAP.items():
            for rel_path in rel_list:
                sub = rel_path[len("assets/"):] if rel_path.startswith("assets/") else rel_path
                src_fp = os.path.join(base_src, sub.replace("/", os.sep))
                dst_fp = os.path.join(PROJ_ASSETS, sub.replace("/", os.sep))
                if os.path.isfile(src_fp):
                    os.makedirs(os.path.dirname(dst_fp), exist_ok=True)
                    shutil.copy2(src_fp, dst_fp)
                    copied += 1
        print(f"Synced {copied} exact manifest.txt files from {base_src} into {PROJ_ASSETS}.")
    else:
        print("Using in-place manifest.txt asset tree inside assets/.")

    manifest_out = {k: [os.path.basename(p) for p in v] for k, v in MANIFEST_ASSET_MAP.items()}
    with open(os.path.join(PROJ_ASSETS, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest_out, f, indent=2)
    os.makedirs(os.path.join(PROJ_ROOT, "data"), exist_ok=True)
    with open(os.path.join(PROJ_ROOT, "data", "animations.json"), "w", encoding="utf-8") as f:
        json.dump(MANIFEST_ASSET_MAP, f, indent=2)
    print("Updated assets/manifest.json and data/animations.json with exact manifest.txt paths.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync exact manifest.txt Hollow Knight assets.")
    parser.add_argument("--src", default=DEFAULT_SRC, help="Path to Hollow Knight sprites/assets directory")
    args = parser.parse_args()
    sync_from_source(args.src)
