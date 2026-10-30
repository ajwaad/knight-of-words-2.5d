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
        public float arenaHalfWidth = 12f;

        private Rigidbody2D rb;
        private BoxCollider2D boxCollider;
        private SpriteRenderer spriteRenderer;

        public HornetState currentState = HornetState.Idle;
        private Transform playerTarget;
        private bool isFacingRight = false;

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
            if (idleFrames != null && idleFrames.Length > 0 && spriteRenderer.sprite == null)
            {
                spriteRenderer.sprite = idleFrames[0];
            }
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
            idleFrames = LoadNamedFrames("Hornet - idle", "idle");
            jumpFrames = LoadNamedFrames("Hornet - jump", "jump");
            throwFrames = LoadNamedFrames("Hornet - throw_side", "throw");
            landFrames = LoadNamedFrames("Hornet - hard_land", "land");
        }

        private Sprite[] LoadNamedFrames(string prefix, string fallbackKey)
        {
            var list = new List<Sprite>();
            var resSprites = Resources.LoadAll<Sprite>("Sprites");
            if (resSprites != null)
            {
                foreach (var s in resSprites)
                {
                    if (s != null && s.name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                        list.Add(s);
                }
            }
            if (list.Count == 0)
            {
                var all = Resources.FindObjectsOfTypeAll<Sprite>();
                foreach (var s in all)
                {
                    if (s != null && s.name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                        list.Add(s);
                }
            }
            if (list.Count > 0)
            {
                list.Sort((a, b) => string.Compare(a.name, b.name, StringComparison.Ordinal));
                return list.ToArray();
            }
            return RuntimeSpriteFactory.GetHornetFrames(fallbackKey);
        }

        private void Update()
        {
            UpdateAnimation();
            UpdateFacing();

            // Clamp within arena walls so Hornet never escapes
            Vector3 pos = transform.position;
            pos.x = Mathf.Clamp(pos.x, -arenaHalfWidth, arenaHalfWidth);
            if (pos.y > 6.5f) pos.y = 6.5f;
            transform.position = pos;
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
                    spriteRenderer.flipX = isFacingRight;
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

                float roll = UnityEngine.Random.value;
                if (roll < 0.45f)
                {
                    yield return StartCoroutine(DoNeedleThrow());
                }
                else
                {
                    yield return StartCoroutine(DoAcrobaticLeap());
                }

                yield return StartCoroutine(DoPacing(UnityEngine.Random.Range(1.0f, 1.8f)));
            }
        }

        private IEnumerator DoPacing(float duration)
        {
            currentState = HornetState.Pacing;
            float timer = 0f;

            while (timer < duration)
            {
                if (GameManager.Instance != null && GameManager.Instance.IsTrialActive)
                {
                    rb.linearVelocity = Vector2.zero;
                    yield return null;
                    continue;
                }

                int dir = isFacingRight ? 1 : -1;
                if (transform.position.x > arenaHalfWidth - 1.5f) dir = -1;
                if (transform.position.x < -arenaHalfWidth + 1.5f) dir = 1;

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

            yield return new WaitForSeconds(0.35f);

            float lungeDir = isFacingRight ? 1f : -1f;
            rb.linearVelocity = new Vector2(lungeDir * 11.5f, 0f);
            yield return new WaitForSeconds(0.3f);

            rb.linearVelocity = Vector2.zero;
            yield return new WaitForSeconds(0.4f);
            currentState = HornetState.Idle;
        }

        private IEnumerator DoAcrobaticLeap()
        {
            currentState = HornetState.AcrobaticJump;
            ProceduralAudio.Instance?.PlayJump();

            float horizontalTarget = playerTarget != null ? Mathf.Clamp((playerTarget.position.x - transform.position.x) * 0.7f, -7f, 7f) : 0f;
            rb.linearVelocity = new Vector2(horizontalTarget, jumpForce);

            yield return new WaitForSeconds(0.55f);

            currentState = HornetState.DiveAttack;
            Vector2 targetFloorPos = playerTarget != null ? new Vector2(playerTarget.position.x, -1.8f) : new Vector2(transform.position.x, -1.8f);
            Vector2 diveDir = (targetFloorPos - (Vector2)transform.position).normalized;
            if (diveDir.y > -0.35f) diveDir = new Vector2(diveDir.x, -0.75f).normalized;
            rb.linearVelocity = diveDir * 15f;

            yield return new WaitForSeconds(0.45f);
            rb.linearVelocity = Vector2.zero;
            currentState = HornetState.Idle;
        }

        public void TakeDamage(int amount, Vector2 hitSource)
        {
            if (currentState == HornetState.Defeated) return;

            bool wasStaggered = (currentState == HornetState.Staggered);
            currentHealth = Mathf.Clamp(currentHealth - amount, 0, maxHealth);
            OnBossHealthChanged?.Invoke(currentHealth, maxHealth);

            StartCoroutine(FlashWhiteRoutine());

            if (currentHealth <= 0)
            {
                DefeatBoss();
                return;
            }

            if (!wasStaggered)
            {
                staggerCounter++;
                if (staggerCounter >= hitsBeforeStagger)
                {
                    staggerCounter = 0;
                    TriggerBossStaggerTrial();
                }
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

            if (GameManager.Instance != null)
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
                        TakeDamage(5, transform.position);
                        ProceduralAudio.Instance?.PlayCorrect();
                        if (currentHealth > 0)
                        {
                            StartCoroutine(RecoverFromStagger(1.2f));
                        }
                    },
                    onWrong: () =>
                    {
                        ProceduralAudio.Instance?.PlayWrong();
                        if (currentHealth > 0)
                        {
                            StartCoroutine(RecoverFromStagger(0.2f));
                        }
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
            if (currentHealth > 0 && currentState != HornetState.Defeated)
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
            TryDealContactDamage(collision.gameObject);
        }

        private void OnCollisionStay2D(Collision2D collision)
        {
            TryDealContactDamage(collision.gameObject);
        }

        private void TryDealContactDamage(GameObject target)
        {
            if (currentState == HornetState.Staggered || currentState == HornetState.Defeated) return;

            var player = target.GetComponent<PlayerCombat>();
            if (player != null)
            {
                player.TakeDamage(1, transform.position);
            }
        }
    }
}
