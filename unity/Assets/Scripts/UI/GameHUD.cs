using UnityEngine;
using UnityEngine.UI;

namespace KnightOfWords
{
    public class GameHUD : MonoBehaviour
    {
        public static GameHUD Instance { get; private set; }

        [Header("Mask Health UI")]
        public Image[] maskImages;
        public Sprite fullMaskSprite;
        public Sprite emptyMaskSprite;

        [Header("Soul Gauge")]
        public Image soulFillImage;
        public Text soulText;

        [Header("Boss Health Bar")]
        public GameObject bossBarContainer;
        public Image bossHealthFill;
        public Text bossNameText;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            EnsureUIAndArenaVisuals();
        }

        private void EnsureUIAndArenaVisuals()
        {
            // Ensure full-screen RectTransform if GameHUD was serialized without one
            var rt = GetComponent<RectTransform>();
            if (rt != null)
            {
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.sizeDelta = Vector2.zero;
                rt.anchoredPosition = Vector2.zero;
            }

            if (fullMaskSprite == null) fullMaskSprite = RuntimeSpriteFactory.GetMaskSprite(true);
            if (emptyMaskSprite == null) emptyMaskSprite = RuntimeSpriteFactory.GetMaskSprite(false);

            // Unity Image.Type.Filled requires a non-null sprite to honour fillAmount
            if (soulFillImage != null && soulFillImage.sprite == null)
            {
                soulFillImage.sprite = RuntimeSpriteFactory.GetWhiteSprite();
            }
            if (bossHealthFill != null && bossHealthFill.sprite == null)
            {
                bossHealthFill.sprite = RuntimeSpriteFactory.GetWhiteSprite();
            }

            // Ensure Ground and Platforms have visible sprites
            var env = GameObject.Find("Environment");
            if (env != null)
            {
                foreach (Transform child in env.transform)
                {
                    var sr = child.GetComponent<SpriteRenderer>();
                    var col = child.GetComponent<BoxCollider2D>();
                    if (child.name == "Ground" && sr == null && col != null)
                    {
                        sr = child.gameObject.AddComponent<SpriteRenderer>();
                        sr.sprite = RuntimeSpriteFactory.GetPlatformSprite();
                        sr.drawMode = SpriteDrawMode.Tiled;
                        sr.size = col.size;
                        sr.color = new Color(0.22f, 0.28f, 0.38f, 1f);
                        sr.sortingOrder = 1;
                    }
                    else if (child.name.StartsWith("Platform_") && sr != null && sr.sprite == null && col != null)
                    {
                        sr.sprite = RuntimeSpriteFactory.GetPlatformSprite();
                        sr.drawMode = SpriteDrawMode.Tiled;
                        sr.size = col.size;
                    }
                }
            }
        }

        private void Start()
        {
            var playerCombat = FindFirstObjectByType<PlayerCombat>();
            if (playerCombat != null)
            {
                playerCombat.OnHealthChanged += UpdateHealthMasks;
                playerCombat.OnSoulChanged += UpdateSoulGauge;
                UpdateHealthMasks(playerCombat.currentHealth, playerCombat.maxHealth);
                UpdateSoulGauge(playerCombat.currentSoul, playerCombat.maxSoul);
            }

            var boss = FindFirstObjectByType<HornetBoss>();
            if (boss != null)
            {
                boss.OnBossHealthChanged += UpdateBossHealth;
                boss.OnBossDefeated += HideBossBar;
                if (bossNameText != null)
                {
                    bossNameText.text = boss.bossName;
                }
                UpdateBossHealth(boss.currentHealth, boss.maxHealth);
            }
        }

        public void UpdateHealthMasks(int current, int max)
        {
            if (maskImages == null) return;

            for (int i = 0; i < maskImages.Length; i++)
            {
                if (maskImages[i] != null)
                {
                    maskImages[i].gameObject.SetActive(i < max);
                    if (fullMaskSprite != null && emptyMaskSprite != null)
                    {
                        maskImages[i].sprite = (i < current) ? fullMaskSprite : emptyMaskSprite;
                        maskImages[i].color = Color.white;
                    }
                    else
                    {
                        maskImages[i].color = (i < current) ? Color.white : new Color(0.3f, 0.3f, 0.3f, 0.4f);
                    }
                }
            }
        }

        public void UpdateSoulGauge(int current, int max)
        {
            float fill = Mathf.Clamp01((float)current / max);
            if (soulFillImage != null)
            {
                soulFillImage.fillAmount = fill;
            }
            if (soulText != null)
            {
                soulText.text = $"{current} SOUL";
            }
        }

        public void UpdateBossHealth(int current, int max)
        {
            if (bossBarContainer != null)
            {
                bossBarContainer.SetActive(current > 0);
            }
            if (bossHealthFill != null)
            {
                bossHealthFill.fillAmount = Mathf.Clamp01((float)current / max);
            }
        }

        public void HideBossBar()
        {
            if (bossBarContainer != null)
            {
                bossBarContainer.SetActive(false);
            }
        }
    }
}
