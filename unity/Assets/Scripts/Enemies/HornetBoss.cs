using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    public enum HornetState
    {
        Idle,
        Pacing,
        NeedleThrow,
        AcrobaticJump,
        DiveAttack,
        Staggered,
        Defeated
    }

    [RequireComponent(typeof(Rigidbody2D), typeof(BoxCollider2D), typeof(SpriteRenderer))]
    public class HornetBoss : MonoBehaviour, IEntityDamageable
    {
        [Header("Boss Stats")]
        public string bossName = "Hornet, Protector of the Word Vault";
        public int maxHealth = 18;
        public int currentHealth = 18;
        public int hitsBeforeStagger = 5;
        private int staggerCounter = 0;

        [Header("Movement & Combat")]
        public float moveSpeed = 4.5f;
        public float jumpForce = 13f;
        public Transform arenaCenter;
        public float arenaHalfWidth = 8f;

        private Rigidbody2D rb;
        private BoxCollider2D boxCollider;
        private SpriteRenderer spriteRenderer;

        public HornetState currentState = HornetState.Idle;
        private Transform playerTarget;
        private bool isFacingRight = false;
        private float stateTimer = 0f;

        // Sprites
        public Sprite[] idleFrames;
        public Sprite[] jumpFrames;
        public Sprite[] throwFrames;
        public Sprite[] landFrames;

        private int animFrame = 0;
        private float animTimer = 0f;

        public event Action<int, int> OnBossHealthChanged;
        public event Action OnBossDefeated;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            boxCollider = GetComponent<BoxCollider2D>();
            spriteRenderer = GetComponent<SpriteRenderer>();

            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.freezeRotation = true;

            currentHealth = maxHealth;
            LoadFrames();
        }

        private void Start()
        {
            var player = FindFirstObjectByType<PlayerController>();
            if (player != null)
            {
                playerTarget = player.transform;
            }

            OnBossHealthChanged?.Invoke(currentHealth, maxHealth);
            StartCoroutine(BehaviorFSM());
        }

        private void LoadFrames()
        {
            idleFrames = LoadNamedFrames("Hornet - idle");
            jumpFrames = LoadNamedFrames("Hornet - jump");
            throwFrames = LoadNamedFrames("Hornet - throw_side");
            landFrames = LoadNamedFrames("Hornet - hard_land");
        }

        private Sprite[] LoadNamedFrames(string prefix)
        {
            var list = new List<Sprite>();
            var all = Resources.FindObjectsOfTypeAll<Sprite>();
            foreach (var s in all)
            {
                if (s != null && s.name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    list.Add(s);
                }
            }
            list.Sort((a, b) => string.Compare(a.name, b.name, StringComparison.Ordinal));
            return list.ToArray();
        }

        private void Update()
        {
            UpdateAnimation();
            UpdateFacing();
        }

        private void UpdateFacing()
        {
            if (currentState == HornetState.Staggered || currentState == HornetState.Defeated) return;

            if (playerTarget != null)
            {
                bool shouldFaceRight = playerTarget.position.x > transform.position.x;
                if (shouldFaceRight != isFacingRight && currentState != HornetState.NeedleThrow)
                {
                    isFacingRight = shouldFaceRight;
                    spriteRenderer.flipX = !isFacingRight;
                }
            }
        }

        private void UpdateAnimation()
        {
            Sprite[] frames = idleFrames;
            float fps = 8f;

            switch (currentState)
            {
                case HornetState.Idle:
                case HornetState.Pacing:
                case HornetState.Staggered:
                    frames = idleFrames;
                    fps = currentState == HornetState.Staggered ? 4f : 8f;
                    break;
                case HornetState.NeedleThrow:
                    frames = throwFrames;
                    fps = 12f;
                    break;
                case HornetState.AcrobaticJump:
                case HornetState.DiveAttack:
                    frames = jumpFrames;
                    fps = 10f;
                    break;
            }

            if (frames == null || frames.Length == 0) return;

            animTimer += Time.deltaTime;
            if (animTimer >= 1f / fps)
            {
                animTimer -= 1f / fps;
                animFrame = (animFrame + 1) % frames.Length;
                spriteRenderer.sprite = frames[animFrame];
            }
        }

        private IEnumerator BehaviorFSM()
        {
            while (currentHealth > 0)
            {
                if (GameManager.Instance != null && GameManager.Instance.IsTrialActive)
                {
                    rb.linearVelocity = Vector2.zero;
                    yield return null;
                    continue;
                }

                // Pick action
                float roll = UnityEngine.Random.value;
                if (roll < 0.45f)
                {
                    yield return StartCoroutine(DoNeedleThrow());
                }
                else
                {
                    yield return StartCoroutine(DoAcrobaticLeap());
                }

                yield return StartCoroutine(DoPacing(UnityEngine.Random.Range(1.0f, 2.0f)));
            }
        }

        private IEnumerator DoPacing(float duration)
        {
            currentState = HornetState.Pacing;
            float timer = 0f;
            int dir = isFacingRight ? 1 : -1;

            while (timer < duration)
            {
                if (GameManager.Instance != null && GameManager.Instance.IsTrialActive)
                {
                    rb.linearVelocity = Vector2.zero;
                    yield return null;
                    continue;
                }

                rb.linearVelocity = new Vector2(dir * moveSpeed, rb.linearVelocity.y);
                timer += Time.deltaTime;
                yield return null;
            }

            rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
            currentState = HornetState.Idle;
        }

        private IEnumerator DoNeedleThrow()
        {
            currentState = HornetState.NeedleThrow;
            rb.linearVelocity = Vector2.zero;
            ProceduralAudio.Instance?.PlaySlash();

            // Telegraph pause
            yield return new WaitForSeconds(0.35f);

            // Needle thrust forward
            float lungeDir = isFacingRight ? 1f : -1f;
            rb.linearVelocity = new Vector2(lungeDir * 12f, 0f);
            yield return new WaitForSeconds(0.3f);

            rb.linearVelocity = Vector2.zero;
            yield return new WaitForSeconds(0.4f);
            currentState = HornetState.Idle;
        }

        private IEnumerator DoAcrobaticLeap()
        {
            currentState = HornetState.AcrobaticJump;
            ProceduralAudio.Instance?.PlayJump();

            // Jump high
            float horizontalTarget = playerTarget != null ? (playerTarget.position.x - transform.position.x) * 0.8f : 0f;
            rb.linearVelocity = new Vector2(horizontalTarget, jumpForce);

            yield return new WaitForSeconds(0.6f);

            // Dive toward player
            currentState = HornetState.DiveAttack;
            Vector2 diveDir = playerTarget != null ? ((Vector2)playerTarget.position - (Vector2)transform.position).normalized : Vector2.down;
            rb.linearVelocity = diveDir * 16f;

            yield return new WaitForSeconds(0.5f);
            rb.linearVelocity = Vector2.zero;
            currentState = HornetState.Idle;
        }

        public void TakeDamage(int amount, Vector2 hitSource)
        {
            if (currentState == HornetState.Defeated) return;

            currentHealth = Mathf.Clamp(currentHealth - amount, 0, maxHealth);
            OnBossHealthChanged?.Invoke(currentHealth, maxHealth);

            StartCoroutine(FlashWhiteRoutine());

            if (currentHealth <= 0)
            {
                DefeatBoss();
                return;
            }

            staggerCounter++;
            if (staggerCounter >= hitsBeforeStagger && currentState != HornetState.Staggered)
            {
                staggerCounter = 0;
                TriggerBossStaggerTrial();
            }
        }

        private IEnumerator FlashWhiteRoutine()
        {
            spriteRenderer.color = new Color(1f, 0.4f, 0.4f);
            yield return new WaitForSeconds(0.1f);
            spriteRenderer.color = Color.white;
        }

        private void TriggerBossStaggerTrial()
        {
            currentState = HornetState.Staggered;
            rb.linearVelocity = Vector2.zero;
            StopAllCoroutines();

            // Trigger Combat Trial through GameManager
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OpenCombatTrial(
                    onCorrect: () =>
                    {
                        // Critical Strike!
                        TakeDamage(5, transform.position);
                        ProceduralAudio.Instance?.PlayCorrect();
                        StartCoroutine(RecoverFromStagger(1.2f));
                    },
                    onWrong: () =>
                    {
                        // Immediate counterattack
                        ProceduralAudio.Instance?.PlayWrong();
                        StartCoroutine(RecoverFromStagger(0.2f));
                    }
                );
            }
            else
            {
                StartCoroutine(RecoverFromStagger(2.0f));
            }
        }

        private IEnumerator RecoverFromStagger(float delay)
        {
            yield return new WaitForSeconds(delay);
            if (currentHealth > 0)
            {
                currentState = HornetState.Idle;
                StartCoroutine(BehaviorFSM());
            }
        }

        private void DefeatBoss()
        {
            currentState = HornetState.Defeated;
            rb.linearVelocity = Vector2.zero;
            StopAllCoroutines();
            boxCollider.enabled = false;

            ProceduralAudio.Instance?.PlayCorrect();
            OnBossDefeated?.Invoke();

            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnBossDefeated();
            }
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (currentState == HornetState.Staggered || currentState == HornetState.Defeated) return;

            var player = collision.gameObject.GetComponent<PlayerCombat>();
            if (player != null)
            {
                player.TakeDamage(1, transform.position);
            }
        }
    }
}
