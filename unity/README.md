# Knight of Words — Unity Edition (2.5D / 2D Educational Action-Platformer)

A Hollow Knight-inspired educational combat game aligned with the **Malaysian DSKP KSSR Semakan English Year 3 Curriculum** (for 9-year-old primary pupils), built in **Unity 6 (6000.6.7f1)** and powered by **Unity-MCP**.

---

## 🎮 Game Overview

In *Knight of Words*, players control **The Knight** venturing through deep caverns to confront **Hornet, Protector of the Word Vault**. Striking lore tablets or staggering the boss summons **Combat Trials** grounded in the primary English curriculum.

### Core Mechanics
- **Responsive Platforming**: Snappy physics movement with coyote time, jump buffering, and variable jump height.
- **Combat & Pogo**: Forward, upward, and downward nail slashes. Downward slashes on totems or enemies bounce The Knight upward (*pogo mechanic*).
- **Soul & Spells**: Striking enemies or Soul Totems builds SOUL energy (0–100). Spend 33 SOUL to unleash the **Vengeful Spirit** piercing projectile spell.
- **Combat Trials (Word Altars & Boss Stagger)**: Answering educational trials correctly grants a **Radiant Truth** buff (+50 Soul, +1 Health Mask, and critical strike against the boss).
- **Zero-Cringe Pedagogical Architecture**: Atmospheric, dark-fantasy aesthetic with dignified, constructive grammar explanations that build confidence.

---

## 📚 Curriculum Alignment (DSKP KSSR Semakan Year 3)

The trial question bank (`Assets/Scripts/Data/TrialQuestion.cs`) contains 20+ carefully scaffolded questions across 5 core grammar strands:

1. **Have Got / Has Got**:
   - Singular vs. plural agreement (*The Knight has got a sharp nail* vs. *The bugs have got ancient masks*).
   - Negative forms (*hasn't got*, *haven't got*).
2. **Present Continuous (am/is/are + verb-ing)**:
   - Dynamic actions happening now (*Hornet is dashing across the cavern*).
3. **Past Simple (was / were / regular & irregular past)**:
   - Past states (*Yesterday, the King's palace was silent*).
   - Regular verbs with *-ed* (*travelled*) and irregular verbs (*found*, *went*, *saw*).
4. **Prepositions of Place**:
   - High-frequency locatives (*under*, *between*, *in front of*, *from*).
5. **Countable and Uncountable Nouns & Quantifiers**:
   - Measuring mass nouns (*a jar of honey*, *some water*).
   - Quantifiers (*many coins*, *how much energy*).

---

## 🕹️ Controls

| Action | Primary Key | Secondary / Mouse |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `Left` / `Right` Arrow | — |
| **Jump** | `Space` or `W` or `Up` Arrow | — |
| **Nail Attack** | `J` or `Z` | Left Mouse Button |
| **Upward Slash** | `W` + Attack | `Up` + Attack |
| **Downward Pogo Slash** | `S` (in air) + Attack | `Down` (in air) + Attack |
| **Cast Vengeful Spirit** | `K` or `X` | Right Mouse Button |
| **Read Altar / Tablet** | `E` (near Lore Tablet) | — |
| **Answer Trial** | `1`, `2`, `3`, `4` | Click Option Button |

---

## 🛠️ Architecture & Scripts

```
unity/Assets/
├── Scenes/
│   └── KnightOfWords.unity       # Complete scene with Camera, Arena, Knight, Hornet, HUD, & Trial UI
├── Scripts/
│   ├── Audio/
│   │   └── ProceduralAudio.cs    # Algorithmic waveform generator for swooshes, impacts, chimes, and casts
│   ├── Combat/
│   │   ├── SlashHitbox.cs        # Hitbox detector with pogo bounce & soul generation
│   │   └── VengefulSpirit.cs     # Linear projectile with animated fireball frames & piercing damage
│   ├── Core/
│   │   ├── GameManager.cs        # Game flow, question queue, and victory state controller
│   │   ├── PlayerAnimation.cs    # Frame-by-frame sprite animator (Idle, Run, Jump, Attack, Cast, Hurt)
│   │   ├── PlayerCombat.cs       # 5 Masks Health system, Soul gauge (0-100), i-frames
│   │   └── PlayerController.cs   # Snappy 2D platformer movement & combat dispatcher
│   ├── Data/
│   │   └── TrialQuestion.cs      # KSSR English Year 3 Curriculum Bank & serializable data structures
│   ├── Editor/
│   │   └── KnightOfWordsSceneBuilder.cs # Automated scene builder & asset linker
│   ├── Enemies/
│   │   └── HornetBoss.cs         # Boss FSM (Pacing, Needle Throw, Acrobatic Leap, Stagger, Defeat)
│   ├── Environment/
│   │   ├── LoreTabletAltar.cs    # Interactive lore tablet triggering curriculum trials
│   │   └── SoulTotem.cs          # Breakable soul recharging totems
│   └── UI/
│       ├── GameHUD.cs            # Mask icons, Soul gauge fill, Hornet boss health bar
│       └── TrialCanvas.cs        # Dream-nail dialogue backboard popup with 4 choices & feedback
```

---

## 🚀 Running with Unity MCP

To automate, inspect, or play through `unity-mcp-cli`:

```bash
# Check status
npx unity-mcp-cli status ./

# Execute C# snippet or play mode check
npx unity-mcp-cli exec "UnityEditor.SceneManagement.EditorSceneManager.OpenScene(\"Assets/Scenes/KnightOfWords.unity\");"
```
