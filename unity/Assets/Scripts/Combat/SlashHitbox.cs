using System;
using UnityEngine;

namespace KnightOfWords
{
    public class SlashHitbox : MonoBehaviour
    {
        public int damage = 1;
        public float duration = 0.16f;
        public bool isDownwardSlash = false;
        public Action onHitEnemy;
        public Action onPogoSuccess;

        private bool hasTriggered = false;

        private void Awake()
        {
            var rb = GetComponent<Rigidbody2D>();
            if (rb == null)
            {
                rb = gameObject.AddComponent<Rigidbody2D>();
            }
            rb.bodyType = RigidbodyType2D.Kinematic;
            rb.gravityScale = 0f;
        }

        private void Start()
        {
            Destroy(gameObject, duration);
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (hasTriggered) return;

            var enemy = collision.GetComponent<IEntityDamageable>() ?? collision.GetComponentInParent<IEntityDamageable>();
            if (enemy != null && !(enemy is PlayerCombat))
            {
                hasTriggered = true;
                enemy.TakeDamage(damage, transform.position);
                ProceduralAudio.Instance?.PlayHit();
                onHitEnemy?.Invoke();

                if (isDownwardSlash)
                {
                    onPogoSuccess?.Invoke();
                }
                return;
            }

            var totem = collision.GetComponent<SoulTotem>();
            if (totem != null)
            {
                hasTriggered = true;
                totem.HitTotem();
                ProceduralAudio.Instance?.PlayHit();
                onHitEnemy?.Invoke();

                if (isDownwardSlash)
                {
                    onPogoSuccess?.Invoke();
                }
                return;
            }

            var altar = collision.GetComponent<LoreTabletAltar>();
            if (altar != null)
            {
                hasTriggered = true;
                ProceduralAudio.Instance?.PlayHit();
                altar.ActivateTrial();
            }
        }
    }

    public interface IEntityDamageable
    {
        void TakeDamage(int amount, Vector2 hitSource);
    }
}
