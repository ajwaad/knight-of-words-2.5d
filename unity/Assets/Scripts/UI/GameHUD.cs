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
