using System;
using UnityEngine;

namespace KnightOfWords
{
    public class SlashHitbox : MonoBehaviour
    {
        public int damage = 1;
        public float duration = 0.15f;
        public bool isDownwardSlash = false;
        public Action onHitEnemy;
        public Action onPogoSuccess;

        private void Start()
        {
            Destroy(gameObject, duration);
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            // Check for Enemy
            var enemy = collision.GetComponent<IEntityDamageable>();
            if (enemy == null)
            {
                enemy = collision.GetComponentInParent<IEntityDamageable>();
            }

            if (enemy != null)
            {
                enemy.TakeDamage(damage, transform.position);
                ProceduralAudio.Instance?.PlayHit();
                onHitEnemy?.Invoke();

                if (isDownwardSlash)
                {
                    onPogoSuccess?.Invoke();
                }
            }

            // Check for Soul Totem
            var totem = collision.GetComponent<SoulTotem>();
            if (totem != null)
            {
                totem.HitTotem();
                ProceduralAudio.Instance?.PlayHit();
                onHitEnemy?.Invoke();

                if (isDownwardSlash)
                {
                    onPogoSuccess?.Invoke();
                }
            }
        }
    }

    public interface IEntityDamageable
    {
        void TakeDamage(int amount, Vector2 hitSource);
    }
}
