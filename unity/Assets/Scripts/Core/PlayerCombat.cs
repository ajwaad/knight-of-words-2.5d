using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    public class PlayerCombat : MonoBehaviour, IEntityDamageable
    {
        [Header("Health & Soul")]
        public int maxHealth = 5;
        public int currentHealth = 5;
        public int maxSoul = 100;
        public int currentSoul = 33;
        public int spellCost = 33;

        [Header("Prefabs & Resources")]
        public GameObject slashPrefab;
        public GameObject spellPrefab;

        [Header("Invulnerability")]
        public float invulnerabilityDuration = 1.2f;
        private bool isInvulnerable = false;

        private PlayerAnimation playerAnim;
        private SpriteRenderer spriteRenderer;

        public event Action<int, int> OnHealthChanged;
        public event Action<int, int> OnSoulChanged;

        private Sprite[] cachedVfxSpellFrames;

        private void Awake()
        {
            playerAnim = GetComponent<PlayerAnimation>();
            spriteRenderer = GetComponent<SpriteRenderer>();
            currentHealth = maxHealth;
            currentSoul = 33;
            LoadCachedVfx();
        }

        private void Start()
        {
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnSoulChanged?.Invoke(currentSoul, maxSoul);
        }

        private void LoadCachedVfx()
        {
            var list = new List<Sprite>();
            var allSprites = Resources.FindObjectsOfTypeAll<Sprite>();
            foreach (var s in allSprites)
            {
                if (s != null && s.name.StartsWith("Vengeful Spirit - fireball", StringComparison.OrdinalIgnoreCase))
                {
                    list.Add(s);
                }
            }
            list.Sort((a, b) => string.Compare(a.name, b.name, StringComparison.Ordinal));
            cachedVfxSpellFrames = list.ToArray();
        }

        public bool CanCastSpell()
        {
            return currentSoul >= spellCost;
        }

        public void ConsumeSoulForSpell()
        {
            currentSoul = Mathf.Clamp(currentSoul - spellCost, 0, maxSoul);
            OnSoulChanged?.Invoke(currentSoul, maxSoul);
        }

        public void AddSoul(int amount)
        {
            currentSoul = Mathf.Clamp(currentSoul + amount, 0, maxSoul);
            OnSoulChanged?.Invoke(currentSoul, maxSoul);
        }

        public void RestoreHealth(int amount)
        {
            currentHealth = Mathf.Clamp(currentHealth + amount, 1, maxHealth);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void SpawnSlash(Vector3 position, Vector2 direction, bool isDown, Action onPogo)
        {
            GameObject slashObj;
            if (slashPrefab != null)
            {
                slashObj = Instantiate(slashPrefab, position, Quaternion.identity);
            }
            else
            {
                slashObj = new GameObject("SlashHitbox");
                slashObj.transform.position = position;
                var col = slashObj.AddComponent<BoxCollider2D>();
                col.isTrigger = true;
                col.size = new Vector2(1.2f, 1.0f);
            }

            var slash = slashObj.GetComponent<SlashHitbox>() ?? slashObj.AddComponent<SlashHitbox>();
            slash.isDownwardSlash = isDown;
            slash.damage = 1;
            slash.onHitEnemy = () =>
            {
                AddSoul(11);
            };
            slash.onPogoSuccess = onPogo;
        }

        public void SpawnVengefulSpirit(Vector3 position, Vector2 direction)
        {
            GameObject spiritObj;
            if (spellPrefab != null)
            {
                spiritObj = Instantiate(spellPrefab, position, Quaternion.identity);
            }
            else
            {
                spiritObj = new GameObject("VengefulSpirit");
                spiritObj.transform.position = position;

                var sr = spiritObj.AddComponent<SpriteRenderer>();
                sr.sortingOrder = 10;
                var col = spiritObj.AddComponent<CircleCollider2D>();
                col.radius = 0.5f;
                col.isTrigger = true;
                spiritObj.AddComponent<Rigidbody2D>();
            }

            var spirit = spiritObj.GetComponent<VengefulSpirit>() ?? spiritObj.AddComponent<VengefulSpirit>();
            spirit.Launch(direction, cachedVfxSpellFrames);
        }

        public void TakeDamage(int amount, Vector2 hitSource)
        {
            if (isInvulnerable || currentHealth <= 0) return;

            currentHealth = Mathf.Clamp(currentHealth - amount, 0, maxHealth);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            ProceduralAudio.Instance?.PlayHit();
            StartCoroutine(DamageFeedbackRoutine(hitSource));

            if (currentHealth <= 0)
            {
                Die();
            }
        }

        private IEnumerator DamageFeedbackRoutine(Vector2 hitSource)
        {
            isInvulnerable = true;
            playerAnim.PlayAction(KnightAnimState.Hurt, 12f);

            // Small knockback
            var rb = GetComponent<Rigidbody2D>();
            if (rb != null)
            {
                float knockDir = transform.position.x < hitSource.x ? -1f : 1f;
                rb.linearVelocity = new Vector2(knockDir * 5f, 4f);
            }

            // Flashing
            float timer = 0f;
            while (timer < invulnerabilityDuration)
            {
                if (spriteRenderer != null)
                {
                    spriteRenderer.color = new Color(1f, 1f, 1f, spriteRenderer.color.a == 1f ? 0.3f : 1f);
                }
                yield return new WaitForSeconds(0.1f);
                timer += 0.1f;
            }

            if (spriteRenderer != null)
            {
                spriteRenderer.color = Color.white;
            }
            isInvulnerable = false;
        }

        private void Die()
        {
            // Reset to 5 masks, restart scene
            StartCoroutine(RespawnRoutine());
        }

        private IEnumerator RespawnRoutine()
        {
            yield return new WaitForSeconds(1.0f);
            currentHealth = maxHealth;
            currentSoul = 33;
            transform.position = new Vector3(-6f, 0f, 0f);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnSoulChanged?.Invoke(currentSoul, maxSoul);
        }
    }
}
