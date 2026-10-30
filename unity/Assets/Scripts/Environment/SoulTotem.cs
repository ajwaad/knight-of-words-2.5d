using System.Collections;
using UnityEngine;

namespace KnightOfWords
{
    [RequireComponent(typeof(SpriteRenderer), typeof(Collider2D))]
    public class SoulTotem : MonoBehaviour
    {
        public int hitsRemaining = 3;
        private SpriteRenderer spriteRenderer;
        private Collider2D totemCollider;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            if (spriteRenderer.sprite == null)
            {
                spriteRenderer.sprite = RuntimeSpriteFactory.GetTotemSprite();
            }
            totemCollider = GetComponent<Collider2D>();
        }

        public void HitTotem()
        {
            if (hitsRemaining <= 0) return;

            hitsRemaining--;
            StartCoroutine(FlashWhite());

            if (hitsRemaining <= 0)
            {
                spriteRenderer.color = new Color(0.5f, 0.5f, 0.5f, 0.6f);
            }
        }

        private IEnumerator FlashWhite()
        {
            spriteRenderer.color = new Color(0.75f, 0.95f, 1f, 1f);
            yield return new WaitForSeconds(0.12f);
            if (hitsRemaining > 0)
            {
                spriteRenderer.color = Color.white;
            }
        }
    }
}
