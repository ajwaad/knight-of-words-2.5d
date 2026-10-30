using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    [RequireComponent(typeof(SpriteRenderer), typeof(Rigidbody2D), typeof(Collider2D))]
    public class VengefulSpirit : MonoBehaviour
    {
        public float speed = 14f;
        public int damage = 3;
        public float lifetime = 2.5f;

        public Sprite[] projectileFrames;
        private SpriteRenderer spriteRenderer;
        private Rigidbody2D rb;
        private int currentFrame = 0;
        private float frameTimer = 0f;
        private float fps = 14f;

        private HashSet<IEntityDamageable> hitTargets = new HashSet<IEntityDamageable>();

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            rb = GetComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

            var col = GetComponent<Collider2D>();
            col.isTrigger = true;

            Destroy(gameObject, lifetime);
        }

        public void Launch(Vector2 direction, Sprite[] frames = null)
        {
            if (frames != null && frames.Length > 0)
            {
                projectileFrames = frames;
            }

            rb.linearVelocity = direction.normalized * speed;
            if (direction.x < 0)
            {
                spriteRenderer.flipX = true;
            }
        }

        private void Update()
        {
            if (projectileFrames == null || projectileFrames.Length == 0) return;

            frameTimer += Time.deltaTime;
            if (frameTimer >= 1f / fps)
            {
                frameTimer -= 1f / fps;
                currentFrame = (currentFrame + 1) % projectileFrames.Length;
                spriteRenderer.sprite = projectileFrames[currentFrame];
            }
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            var damageable = collision.GetComponent<IEntityDamageable>() ?? collision.GetComponentInParent<IEntityDamageable>();
            if (damageable != null && !hitTargets.Contains(damageable))
            {
                hitTargets.Add(damageable);
                damageable.TakeDamage(damage, transform.position);
                ProceduralAudio.Instance?.PlayHit();
            }

            // Hit wall/solid ground
            if (collision.CompareTag("Ground") || collision.gameObject.layer == LayerMask.NameToLayer("Default"))
            {
                // Can dissipate or continue piercing
            }
        }
    }
}
