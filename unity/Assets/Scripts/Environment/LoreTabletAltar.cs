using UnityEngine;

namespace KnightOfWords
{
    [RequireComponent(typeof(SpriteRenderer), typeof(Collider2D))]
    public class LoreTabletAltar : MonoBehaviour
    {
        public GameObject promptIndicator;
        private SpriteRenderer spriteRenderer;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            if (spriteRenderer.sprite == null)
            {
                spriteRenderer.sprite = RuntimeSpriteFactory.GetAltarSprite();
            }
            GetComponent<Collider2D>().isTrigger = true;
            if (promptIndicator != null)
            {
                promptIndicator.SetActive(false);
            }
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (collision.GetComponent<PlayerController>() != null)
            {
                spriteRenderer.color = new Color(0.8f, 0.95f, 1f, 1f);
                if (promptIndicator != null)
                {
                    promptIndicator.SetActive(true);
                }
            }
        }

        private void OnTriggerExit2D(Collider2D collision)
        {
            if (collision.GetComponent<PlayerController>() != null)
            {
                spriteRenderer.color = Color.white;
                if (promptIndicator != null)
                {
                    promptIndicator.SetActive(false);
                }
            }
        }

        public void ActivateTrial()
        {
            if (GameManager.Instance != null && !GameManager.Instance.IsTrialActive)
            {
                GameManager.Instance.OpenCombatTrial(
                    onCorrect: () =>
                    {
                        var player = FindFirstObjectByType<PlayerCombat>();
                        if (player != null)
                        {
                            player.RestoreHealth(1);
                            player.AddSoul(50);
                        }
                        ProceduralAudio.Instance?.PlayCorrect();
                    },
                    onWrong: () =>
                    {
                        ProceduralAudio.Instance?.PlayWrong();
                    }
                );
            }
        }
    }
}
