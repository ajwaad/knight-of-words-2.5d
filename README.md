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

## 🎨 Asset Integration (From Extracted Sprites)
All assets are extracted and organized directly from `C:\Users\AMAL\Downloads\sprites\assets`:
- **The Knight**: Idle, run, nail attack, soul cast, hurt, and great slash shockwaves.
- **Bosses & Enemies**: Animated Hornet, Troupe Master Grimm, Dung Defender, Hiveling swarm, and Grimmkin scouts.
- **Environment Parallax**: Deep Nailmaster background (`Z = -20`), midground drapery (`Z = -8`), 3D tilted stone floor (`Z = 0`), and foreground arches (`Z = +6.5`).
- **UI**: Authentic health masks (full & broken), glowing Soul vessel, charms, and selection cursors.
- **Sound**: 100% procedural Web Audio API synthesizer for zero-latency nail clashing, spell bursts, mask cracks, and radiant arpeggio chimes.
