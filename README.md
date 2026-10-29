# Knight of Words: 2.5D Hallownest Trial (KSSR English Year 3)

An interactive **2.5D educational combat game** set in the atmospheric world of *Hollow Knight*, specifically calibrated for **Malaysian Primary School Year 3 pupils (strictly 9 years old, SK level)** adhering to the **DSKP KSSR Semakan English Curriculum**.

Combat actions are directly driven by language proficiency: pupils slash, cast spells, and heal by correctly answering curriculum-aligned English questions across 5 themed subterranean chambers.

---

## 🎮 How to Run

### Method 1: Double-Click Launcher (Fastest)
Double-click `start_game.bat` inside `C:\Users\AMAL\knight-of-words-2.5d\`.
This starts the local Python server and automatically launches the game in your default web browser (`http://localhost:8085`).

### Method 2: Command Line
```powershell
cd C:\Users\AMAL\knight-of-words-2.5d
python server.py
```
Then navigate to `http://localhost:8085` in Google Chrome, Microsoft Edge, Brave, or Mozilla Firefox.

---

## ⚔️ Combat Mechanics

The player controls **The Knight** facing Hallownest adversaries in a 2.5D arena stage with dynamic lighting, multiplane parallax depth, and spatial shadows:

| Action | Cost / Req | Base Effect | Trigger Condition |
| :--- | :--- | :--- | :--- |
| **[1] Nail Slash** | Free | 25 DMG (+ Streak Bonus) | Builds **+25 Soul** on correct answer |
| **[2] Soul Spirit** | 33 Soul | 50 DMG projectile | Launches a piercing Vengeful Spirit orb |
| **[3] Focus Heal** | 33 Soul | +1 Health Mask | Ethereal focus recovery up to max 5 masks |
| **[4] Great Slash** | 2-Streak | 70 Heavy Area DMG | High-damage energy wave unlocked on combo |

### 📖 The Question Trial System
When an action is chosen, a DSKP question trial appears:
- **Correct Answer**: The Knight charges forward in 3D space, executes the selected attack/spell, deals damage, builds Soul, and advances combo streaks.
- **Incorrect Answer**: The attack is blocked! The student immediately receives supportive pedagogical feedback explaining the grammar rule. The enemy counter-attacks, shattering 1 of the Knight's health masks.
- **Nailmaster's Lore (Invisible Safety Net)**: An unobtrusive hint drawer that students can toggle to review grammar rules (e.g., *"Remember: 'He' and 'She' use 'has got'"*) without triggering evaluation paralysis or remedial stigma.

---

## 📚 KSSR Year 3 Curriculum Coverage (5 Chambers)

| Chamber | Boss / Enemy | DSKP Units Covered | Grammar & Vocabulary Focus |
| :---: | :--- | :--- | :--- |
| **1** | **Hiveling Swarm** (HP: 60) | Unit 1: *Welcome!*<br>Unit 2: *Everyday Routines* | `have got` / `has got`, numbers in tens (10-100), telling time (*half past*, *o'clock*), daily verbs (*brushes*, *wakes*). |
| **2** | **Mantis Scout** (HP: 90) | Unit 3: *Right Now*<br>Unit 4: *Year In, Year Out* | Present continuous (`is/are + verb-ing`), weather, seasons, Hari Kebangsaan (August). |
| **3** | **Dung Defender** (HP: 120) | Unit 5: *My New House*<br>Unit 6: *Food, Please!* | Prepositions of place (*under*, *between*, *next to*), countable/uncountable nouns (`some`/`any`, `There is/are`). |
| **4** | **Hornet** (HP: 160) | Unit 7: *Out and About*<br>Unit 8: *Where Were You Yesterday?* | Directions (*turn left*, *cross safely*), school safety rules (`must`/`mustn't`), Past Simple (`was`/`were`). |
| **5** | **Troupe Master Grimm** (HP: 200) | Unit 9: *On Holiday*<br>Unit 10: *The World Around Us* | Irregular past tense verbs (*went*, *saw*, *drank*, *bought*), Comparatives & Superlatives (*bigger than*, *the fastest*). |

---

## 📊 Teacher's PBS Assessment Dashboard
Click the **"📊 PBS Report"** button on the bottom HUD at any time to inspect formative assessment data:
- **Total Questions Attempted**
- **Accuracy Percentage**
- **DSKP Learning Standards Mastered** (e.g. 2.1.5, 4.3.2, 3.2.2)
- **Unit Practice Breakdown** (Units 1 to 10)

---

## 🎨 Asset Integration (Direct `manifest.txt` Mapping)
All character, boss, enemy, environment, UI, and VFX textures are mapped **directly to the existing file paths in `manifest.txt`** (with automatic URL encoding for spaces, `&`, and `#`, plus automatic transparent-bounds and eye-facing normalization):
- **The Knight (Main Character)**:
  - **Idle**: `assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side0000.png` .. `0004.png`
  - **Run**: `assets/Inventory & UI/Loading icons/loading_icon_new0000.png` .. `0007.png`
  - **Jump / Dive**: `assets/Particles & Effects/Charm & Spells/Desolate Dive - quake_pickup0003.png` .. `0008.png`
  - **Nail Slash / Cast**: `assets/Particles & Effects/Charm & Spells/Vengeful Spirit - fireball_collect0003.png` .. `0009.png`
  - **Focus Heal**: `assets/Particles & Effects/Charm & Spells/Howling Wraiths - scream_spell_pickup0004.png` .. `0008.png` + `assets/Bosses/The Hollow Knight/Pure Vessel focus ring -  focus_ring.png`
  - **Hurt**: `assets/Bosses/The Hollow Knight/The Hollow Knight Path of Pain scene - small_side_shake_010000.png` .. `010002.png`
- **Bosses & Enemies**:
  - **Chamber 1 (Hiveling Swarm)**: `assets/Enemies & Corpses/Hiveling - fly0000.png` .. `0004.png` & `spawn_01..02.png`
  - **Chamber 2 (Mantis Scout)**: `assets/Hunter_s Journal/Mantis Warrior - bestiary_mantis_f.png`, `Mantis Youth - bestiary_mantis_flyer_f.png`, `Mantis Lords - bestiary_mantis_lords_f.png`, and `assets/NPCs/Weavers/Weaver - idle0002..0005.png` & `crawl0000..0003.png`
  - **Chamber 3 (Dung Defender)**: `assets/Hunter_s Journal/Dung Defender - bestiary__0005_dung-defender.png`, `White Defender - bestiary_White_Defender_full.png`, and `assets/Bosses/Dung Defender & White Defender/dung_statues_0006_1.png`
  - **Chamber 4 (Hornet)**: `assets/Bosses/Hornet/Hornet - idle0000..0001.png`, `jump0000..0009.png`, `throw_side0000..0007.png`, `harpoon_side0000..0001.png`, and `hard_land0000..0005.png`
  - **Chamber 5 (Troupe Master Grimm)**: `assets/Bosses/Grimm/GG_grimm_bow0000..0006.png`, `assets/Hunter_s Journal/Troupe Master Grimm - Bestiary_Grimm_boss.png`, and `Nightmare King Grimm - Bestiary_Grimm_Nightmare_boss.png`
- **Full-Resolution Room Backgrounds**:
  - `assets/Architecture & Environment/nailmaster_03_0008_BG.png`, `Area specfic architecture/Greenpath/nailmaster_fung_hut_02.png`, `Tram & Stagways/tram_BG_wrecked.png`, `Area specfic architecture/City of Tears/Ruins_Houses_0004_1bg.png`, and `Area specfic architecture/Dirtmouth/Grimm Tents/Divine_Room_0005_1.png`
- **HUD & VFX**:
  - `assets/Inventory & UI/select_game_HUD_0001_health.png`, `select_game_HUD_0001_health_steel.png`, `soul_orb_full_v020000.png`, `Geo - HUD_coin_v020004.png`, `assets/Particles & Effects/Radiance_GG_slashes0000..0010.png`, `dash_effect_020000..020004.png`, and `Soul_burst0000..0004.png`
