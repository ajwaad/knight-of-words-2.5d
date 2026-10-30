using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace KnightOfWords.Editor
{
    public static class KnightOfWordsSceneBuilder
    {
        [MenuItem("Knight of Words/Build Complete Scene")]
        public static void BuildScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "KnightOfWords";

            // 1. Camera
            var camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            var cam = camObj.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 6.0f;
            cam.backgroundColor = new Color(0.04f, 0.06f, 0.08f); // Moody Deep Cavern
            cam.clearFlags = CameraClearFlags.SolidColor;
            camObj.transform.position = new Vector3(0, 0, -10);

            // 2. Global Managers
            var gmObj = new GameObject("GameManager");
            var gm = gmObj.AddComponent<GameManager>();

            var audioObj = new GameObject("ProceduralAudio");
            var audio = audioObj.AddComponent<ProceduralAudio>();

            // 3. Environment & Platforms
            var envRoot = new GameObject("Environment");

            // Ground
            var groundObj = new GameObject("Ground");
            groundObj.transform.SetParent(envRoot.transform);
            groundObj.transform.position = new Vector3(0, -3.5f, 0);
            groundObj.tag = "Ground";
            var groundCol = groundObj.AddComponent<BoxCollider2D>();
            groundCol.size = new Vector2(34f, 1.5f);

            // Left & Right Arena Walls
            var leftWall = new GameObject("LeftWall");
            leftWall.transform.SetParent(envRoot.transform);
            leftWall.transform.position = new Vector3(-16f, 0, 0);
            var leftCol = leftWall.AddComponent<BoxCollider2D>();
            leftCol.size = new Vector2(1f, 14f);

            var rightWall = new GameObject("RightWall");
            rightWall.transform.SetParent(envRoot.transform);
            rightWall.transform.position = new Vector3(16f, 0, 0);
            var rightCol = rightWall.AddComponent<BoxCollider2D>();
            rightCol.size = new Vector2(1f, 14f);

            // Floating Platforms for Pogo & Navigation
            CreatePlatform(envRoot.transform, new Vector3(-6f, -0.6f, 0), new Vector2(4f, 0.4f), "Platform_Left");
            CreatePlatform(envRoot.transform, new Vector3(6f, -0.6f, 0), new Vector2(4f, 0.4f), "Platform_Right");
            CreatePlatform(envRoot.transform, new Vector3(0f, 1.8f, 0), new Vector2(5f, 0.4f), "Platform_HighCenter");

            // Decorative Backdrops
            CreateBackdrop(envRoot.transform);

            // 4. Props (Soul Totem & Lore Tablet Altar)
            var totemObj = new GameObject("SoulTotem");
            totemObj.transform.SetParent(envRoot.transform);
            totemObj.transform.position = new Vector3(-11f, -2.1f, 0);
            var totemSr = totemObj.AddComponent<SpriteRenderer>();
            totemSr.sortingOrder = 2;
            totemSr.sprite = FindSpriteByName("soul_totem_03_a");
            var totemCol = totemObj.AddComponent<BoxCollider2D>();
            totemCol.size = new Vector2(1.2f, 2.2f);
            totemObj.AddComponent<SoulTotem>();

            var altarObj = new GameObject("LoreTabletAltar");
            altarObj.transform.SetParent(envRoot.transform);
            altarObj.transform.position = new Vector3(0f, -2.1f, 0);
            var altarSr = altarObj.AddComponent<SpriteRenderer>();
            altarSr.sortingOrder = 2;
            altarSr.sprite = FindSpriteByName("lit_tablet");
            var altarCol = altarObj.AddComponent<BoxCollider2D>();
            altarCol.isTrigger = true;
            altarCol.size = new Vector2(2.0f, 2.0f);
            var altar = altarObj.AddComponent<LoreTabletAltar>();

            // 5. The Knight (Player)
            var knightObj = new GameObject("Knight");
            knightObj.transform.position = new Vector3(-5f, -2.0f, 0);
            var knightSr = knightObj.AddComponent<SpriteRenderer>();
            knightSr.sortingOrder = 5;
            var knightRb = knightObj.AddComponent<Rigidbody2D>();
            knightRb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            knightRb.freezeRotation = true;
            knightRb.gravityScale = 3f;

            var knightCol = knightObj.AddComponent<BoxCollider2D>();
            knightCol.size = new Vector2(0.8f, 1.2f);
            knightCol.offset = new Vector2(0f, 0f);

            var knightAnim = knightObj.AddComponent<PlayerAnimation>();
            var knightCombat = knightObj.AddComponent<PlayerCombat>();
            var knightCtrl = knightObj.AddComponent<PlayerController>();

            // 6. Hornet Boss
            var hornetObj = new GameObject("HornetBoss");
            hornetObj.transform.position = new Vector3(6f, -1.8f, 0);
            var hornetSr = hornetObj.AddComponent<SpriteRenderer>();
            hornetSr.sortingOrder = 5;
            var hornetRb = hornetObj.AddComponent<Rigidbody2D>();
            hornetRb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            hornetRb.freezeRotation = true;
            hornetRb.gravityScale = 3f;

            var hornetCol = hornetObj.AddComponent<BoxCollider2D>();
            hornetCol.size = new Vector2(1.2f, 1.8f);

            var hornet = hornetObj.AddComponent<HornetBoss>();

            // 7. UI Canvas & Event System
            var eventObj = new GameObject("EventSystem");
            eventObj.AddComponent<EventSystem>();
            eventObj.AddComponent<StandaloneInputModule>();

            var canvasObj = new GameObject("Canvas");
            var canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasObj.AddComponent<GraphicRaycaster>();

            // Game HUD
            var hudObj = new GameObject("GameHUD");
            hudObj.transform.SetParent(canvasObj.transform, false);
            var hud = hudObj.AddComponent<GameHUD>();

            BuildHUD(hudObj, hud);

            // Trial Canvas Popup
            var trialObj = new GameObject("TrialCanvas");
            trialObj.transform.SetParent(canvasObj.transform, false);
            var trialCanvas = trialObj.AddComponent<TrialCanvas>();

            BuildTrialUI(trialObj, trialCanvas);

            // Victory Panel
            var victoryObj = BuildVictoryUI(canvasObj);
            gm.victoryPanel = victoryObj;

            // 8. Save Scene
            string scenePath = "Assets/Scenes/KnightOfWords.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log($"[KnightOfWords] Scene built and saved successfully to {scenePath}");

            // Set Build Settings
            var originalScenes = EditorBuildSettings.scenes;
            var newScenes = new EditorBuildSettingsScene[] {
                new EditorBuildSettingsScene(scenePath, true)
            };
            EditorBuildSettings.scenes = newScenes;
        }

        private static void CreatePlatform(Transform parent, Vector3 pos, Vector2 size, string name)
        {
            var pObj = new GameObject(name);
            pObj.transform.SetParent(parent);
            pObj.transform.position = pos;
            pObj.tag = "Ground";

            var col = pObj.AddComponent<BoxCollider2D>();
            col.size = size;

            var sr = pObj.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 1;
            sr.sprite = FindSpriteByName("floor_layered_0000_04_green") ?? FindSpriteByName("floor_layered_0001_03_green");
            sr.drawMode = SpriteDrawMode.Tiled;
            sr.size = size;
            sr.color = new Color(0.7f, 0.85f, 0.9f);
        }

        private static void CreateBackdrop(Transform parent)
        {
            var bgObj = new GameObject("Backdrop_Wall");
            bgObj.transform.SetParent(parent);
            bgObj.transform.position = new Vector3(0, 0, 3f);
            var sr = bgObj.AddComponent<SpriteRenderer>();
            sr.sortingOrder = -5;
            sr.sprite = FindSpriteByName("back_mid_wall_no_eyes_temple") ?? FindSpriteByName("fungus_temple_backwall_small");
            if (sr.sprite != null)
            {
                sr.color = new Color(0.15f, 0.22f, 0.3f, 0.85f);
                bgObj.transform.localScale = new Vector3(4f, 4f, 1f);
            }
        }

        private static void BuildHUD(GameObject parent, GameHUD hud)
        {
            // Health Masks Top-Left
            var healthRoot = new GameObject("HealthMasks");
            healthRoot.transform.SetParent(parent.transform, false);
            var hRect = healthRoot.AddComponent<RectTransform>();
            hRect.anchorMin = new Vector2(0, 1);
            hRect.anchorMax = new Vector2(0, 1);
            hRect.pivot = new Vector2(0, 1);
            hRect.anchoredPosition = new Vector2(40, -40);
            hRect.sizeDelta = new Vector2(300, 60);

            var hGroup = healthRoot.AddComponent<HorizontalLayoutGroup>();
            hGroup.spacing = 15;
            hGroup.childForceExpandWidth = false;
            hGroup.childForceExpandHeight = false;

            var maskSprites = new Image[5];
            var maskSpriteAsset = FindSpriteByName("Ancient Mask");

            for (int i = 0; i < 5; i++)
            {
                var mask = new GameObject($"Mask_{i}");
                mask.transform.SetParent(healthRoot.transform, false);
                var img = mask.AddComponent<Image>();
                img.rectTransform.sizeDelta = new Vector2(48, 54);
                img.sprite = maskSpriteAsset;
                img.color = Color.white;
                maskSprites[i] = img;
            }
            hud.maskImages = maskSprites;

            // Soul Vessel Top-Left
            var soulRoot = new GameObject("SoulGauge");
            soulRoot.transform.SetParent(parent.transform, false);
            var sRect = soulRoot.AddComponent<RectTransform>();
            sRect.anchorMin = new Vector2(0, 1);
            sRect.anchorMax = new Vector2(0, 1);
            sRect.pivot = new Vector2(0, 1);
            sRect.anchoredPosition = new Vector2(40, -110);
            sRect.sizeDelta = new Vector2(200, 30);

            var sBg = soulRoot.AddComponent<Image>();
            sBg.color = new Color(0.1f, 0.15f, 0.2f, 0.8f);

            var soulFill = new GameObject("SoulFill");
            soulFill.transform.SetParent(soulRoot.transform, false);
            var fRect = soulFill.AddComponent<RectTransform>();
            fRect.anchorMin = Vector2.zero;
            fRect.anchorMax = Vector2.one;
            fRect.sizeDelta = Vector2.zero;
            var fillImg = soulFill.AddComponent<Image>();
            fillImg.type = Image.Type.Filled;
            fillImg.fillMethod = Image.FillMethod.Horizontal;
            fillImg.color = new Color(0.9f, 0.95f, 1f, 0.9f); // Radiant white-blue soul
            hud.soulFillImage = fillImg;

            var sTextObj = new GameObject("SoulText");
            sTextObj.transform.SetParent(soulRoot.transform, false);
            var tRect = sTextObj.AddComponent<RectTransform>();
            tRect.anchorMin = Vector2.zero;
            tRect.anchorMax = Vector2.one;
            var sText = sTextObj.AddComponent<Text>();
            sText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            sText.fontSize = 18;
            sText.alignment = TextAnchor.MiddleCenter;
            sText.color = Color.black;
            hud.soulText = sText;

            // Boss Health Bar Top-Center
            var bossRoot = new GameObject("BossBar");
            bossRoot.transform.SetParent(parent.transform, false);
            var bRect = bossRoot.AddComponent<RectTransform>();
            bRect.anchorMin = new Vector2(0.5f, 1);
            bRect.anchorMax = new Vector2(0.5f, 1);
            bRect.pivot = new Vector2(0.5f, 1);
            bRect.anchoredPosition = new Vector2(0, -40);
            bRect.sizeDelta = new Vector2(500, 45);

            var bBg = bossRoot.AddComponent<Image>();
            bBg.color = new Color(0.1f, 0.1f, 0.15f, 0.9f);

            var bFillObj = new GameObject("BossFill");
            bFillObj.transform.SetParent(bossRoot.transform, false);
            var bfRect = bFillObj.AddComponent<RectTransform>();
            bfRect.anchorMin = Vector2.zero;
            bfRect.anchorMax = Vector2.one;
            bfRect.sizeDelta = new Vector2(-10, -10);
            var bFill = bFillObj.AddComponent<Image>();
            bFill.type = Image.Type.Filled;
            bFill.fillMethod = Image.FillMethod.Horizontal;
            bFill.color = new Color(0.85f, 0.2f, 0.25f); // Crimson Boss Health

            var bTextObj = new GameObject("BossName");
            bTextObj.transform.SetParent(bossRoot.transform, false);
            var btRect = bTextObj.AddComponent<RectTransform>();
            btRect.anchorMin = new Vector2(0, 1);
            btRect.anchorMax = new Vector2(1, 1);
            btRect.anchoredPosition = new Vector2(0, 25);
            btRect.sizeDelta = new Vector2(0, 30);
            var bText = bTextObj.AddComponent<Text>();
            bText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            bText.fontSize = 20;
            bText.alignment = TextAnchor.MiddleCenter;
            bText.color = new Color(1f, 0.9f, 0.7f);

            hud.bossBarContainer = bossRoot;
            hud.bossHealthFill = bFill;
            hud.bossNameText = bText;
        }

        private static void BuildTrialUI(GameObject parent, TrialCanvas trial)
        {
            var root = new GameObject("PanelRoot");
            root.transform.SetParent(parent.transform, false);
            var rRect = root.AddComponent<RectTransform>();
            rRect.anchorMin = Vector2.zero;
            rRect.anchorMax = Vector2.one;
            rRect.sizeDelta = Vector2.zero;

            var darkOverlay = root.AddComponent<Image>();
            darkOverlay.color = new Color(0f, 0.05f, 0.1f, 0.85f);
            trial.panelRoot = root;

            // Dialogue Container
            var dialogBox = new GameObject("DialogueBackboard");
            dialogBox.transform.SetParent(root.transform, false);
            var dRect = dialogBox.AddComponent<RectTransform>();
            dRect.anchorMin = new Vector2(0.5f, 0.5f);
            dRect.anchorMax = new Vector2(0.5f, 0.5f);
            dRect.sizeDelta = new Vector2(900, 520);
            var dImg = dialogBox.AddComponent<Image>();
            dImg.sprite = FindSpriteByName("Dream_Nail_Dialogue_Backboard");
            dImg.color = new Color(0.12f, 0.15f, 0.22f, 0.96f);

            // Category Text
            var catObj = new GameObject("CategoryText");
            catObj.transform.SetParent(dialogBox.transform, false);
            var catRect = catObj.AddComponent<RectTransform>();
            catRect.anchorMin = new Vector2(0, 1);
            catRect.anchorMax = new Vector2(1, 1);
            catRect.pivot = new Vector2(0.5f, 1);
            catRect.anchoredPosition = new Vector2(0, -30);
            catRect.sizeDelta = new Vector2(800, 40);
            var catText = catObj.AddComponent<Text>();
            catText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            catText.fontSize = 22;
            catText.alignment = TextAnchor.MiddleCenter;
            catText.color = new Color(1f, 0.84f, 0.2f); // Gold header
            trial.categoryText = catText;

            // Prompt Text
            var promptObj = new GameObject("PromptText");
            promptObj.transform.SetParent(dialogBox.transform, false);
            var pRect = promptObj.AddComponent<RectTransform>();
            pRect.anchorMin = new Vector2(0, 1);
            pRect.anchorMax = new Vector2(1, 1);
            pRect.pivot = new Vector2(0.5f, 1);
            pRect.anchoredPosition = new Vector2(0, -85);
            pRect.sizeDelta = new Vector2(820, 110);
            var pText = promptObj.AddComponent<Text>();
            pText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            pText.fontSize = 28;
            pText.alignment = TextAnchor.MiddleCenter;
            pText.color = Color.white;
            trial.promptText = pText;

            // 4 Option Buttons (2x2 grid)
            trial.optionButtons = new Button[4];
            trial.optionTexts = new Text[4];

            Vector2[] buttonPositions = new Vector2[] {
                new Vector2(-210, -230),
                new Vector2(210, -230),
                new Vector2(-210, -310),
                new Vector2(210, -310)
            };

            for (int i = 0; i < 4; i++)
            {
                var btnObj = new GameObject($"OptionButton_{i + 1}");
                btnObj.transform.SetParent(dialogBox.transform, false);
                var bRect = btnObj.AddComponent<RectTransform>();
                bRect.anchorMin = new Vector2(0.5f, 1);
                bRect.anchorMax = new Vector2(0.5f, 1);
                bRect.anchoredPosition = buttonPositions[i];
                bRect.sizeDelta = new Vector2(380, 60);

                var bImg = btnObj.AddComponent<Image>();
                bImg.color = new Color(0.2f, 0.25f, 0.35f, 0.9f);
                var btn = btnObj.AddComponent<Button>();

                var txtObj = new GameObject("Text");
                txtObj.transform.SetParent(btnObj.transform, false);
                var tRect = txtObj.AddComponent<RectTransform>();
                tRect.anchorMin = Vector2.zero;
                tRect.anchorMax = Vector2.one;
                tRect.sizeDelta = Vector2.zero;
                var txt = txtObj.AddComponent<Text>();
                txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                txt.fontSize = 22;
                txt.alignment = TextAnchor.MiddleCenter;
                txt.color = Color.white;

                trial.optionButtons[i] = btn;
                trial.optionTexts[i] = txt;
            }

            // Feedback Banner (Bottom)
            var fbObj = new GameObject("FeedbackBanner");
            fbObj.transform.SetParent(dialogBox.transform, false);
            var fbRect = fbObj.AddComponent<RectTransform>();
            fbRect.anchorMin = new Vector2(0, 0);
            fbRect.anchorMax = new Vector2(1, 0);
            fbRect.pivot = new Vector2(0.5f, 0);
            fbRect.anchoredPosition = new Vector2(0, 20);
            fbRect.sizeDelta = new Vector2(820, 100);

            var fbImg = fbObj.AddComponent<Image>();
            fbImg.color = new Color(0.08f, 0.12f, 0.18f, 0.95f);

            var fbTitle = new GameObject("Title");
            fbTitle.transform.SetParent(fbObj.transform, false);
            var fbtRect = fbTitle.AddComponent<RectTransform>();
            fbtRect.anchorMin = new Vector2(0, 0.5f);
            fbtRect.anchorMax = new Vector2(1, 1);
            var fbt = fbTitle.AddComponent<Text>();
            fbt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            fbt.fontSize = 22;
            fbt.alignment = TextAnchor.MiddleCenter;
            trial.feedbackText = fbt;

            var fbRule = new GameObject("Rule");
            fbRule.transform.SetParent(fbObj.transform, false);
            var fbrRect = fbRule.AddComponent<RectTransform>();
            fbrRect.anchorMin = new Vector2(0, 0);
            fbrRect.anchorMax = new Vector2(1, 0.5f);
            var fbr = fbRule.AddComponent<Text>();
            fbr.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            fbr.fontSize = 18;
            fbr.alignment = TextAnchor.MiddleCenter;
            fbr.color = new Color(0.85f, 0.9f, 1f);
            trial.ruleExplanationText = fbr;

            trial.feedbackBanner = fbObj;
            fbObj.SetActive(false);
            root.SetActive(false);
        }

        private static GameObject BuildVictoryUI(GameObject canvasObj)
        {
            var victoryRoot = new GameObject("VictoryPanel");
            victoryRoot.transform.SetParent(canvasObj.transform, false);
            var rRect = victoryRoot.AddComponent<RectTransform>();
            rRect.anchorMin = Vector2.zero;
            rRect.anchorMax = Vector2.one;
            rRect.sizeDelta = Vector2.zero;

            var bg = victoryRoot.AddComponent<Image>();
            bg.color = new Color(0.05f, 0.08f, 0.12f, 0.92f);

            var vTextObj = new GameObject("VictoryText");
            vTextObj.transform.SetParent(victoryRoot.transform, false);
            var vtRect = vTextObj.AddComponent<RectTransform>();
            vtRect.anchorMin = new Vector2(0.5f, 0.5f);
            vtRect.anchorMax = new Vector2(0.5f, 0.5f);
            vtRect.sizeDelta = new Vector2(800, 200);
            var vt = vTextObj.AddComponent<Text>();
            vt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            vt.fontSize = 36;
            vt.alignment = TextAnchor.MiddleCenter;
            vt.color = new Color(1f, 0.9f, 0.4f);
            vt.text = "❖ RADIANCE OF KNOWLEDGE ACHIEVED ❖\n\nHornet yields before your mastery of English!\nYou have sealed the Hallownest Word Trials.";

            victoryRoot.SetActive(false);
            return victoryRoot;
        }

        private static Sprite FindSpriteByName(string name)
        {
            var all = Resources.FindObjectsOfTypeAll<Sprite>();
            foreach (var s in all)
            {
                if (s != null && s.name.Equals(name, StringComparison.OrdinalIgnoreCase))
                {
                    return s;
                }
            }
            // Fallback substring
            foreach (var s in all)
            {
                if (s != null && s.name.IndexOf(name, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    return s;
                }
            }
            return null;
        }
    }
}
