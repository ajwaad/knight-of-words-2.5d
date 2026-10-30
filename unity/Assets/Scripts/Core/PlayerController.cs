using UnityEngine;

namespace KnightOfWords
{
    [RequireComponent(typeof(Rigidbody2D), typeof(BoxCollider2D), typeof(PlayerAnimation))]
    [RequireComponent(typeof(PlayerCombat))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 8.5f;
        public float jumpForce = 14.5f;
        public float jumpCutMultiplier = 0.45f;
        public float fallGravityMultiplier = 1.6f;

        [Header("Ground Check")]
        public Transform groundCheck;
        public Vector2 groundCheckSize = new Vector2(0.6f, 0.15f);
        public LayerMask groundLayer;

        [Header("Combat Spawn Points")]
        public Transform forwardSlashPoint;
        public Transform upSlashPoint;
        public Transform downSlashPoint;
        public Transform castPoint;

        private Rigidbody2D rb;
        private BoxCollider2D boxCollider;
        private PlayerAnimation playerAnim;
        private PlayerCombat playerCombat;

        private float horizontalInput = 0f;
        private float verticalInput = 0f;
        private bool isGrounded = false;
        private bool isFacingRight = true;

        // Juiciness & feel
        private float coyoteTimeCounter = 0f;
        private const float CoyoteTimeDuration = 0.12f;
        private float jumpBufferCounter = 0f;
        private const float JumpBufferDuration = 0.12f;
        private float defaultGravity;

        private bool isAttacking = false;
        private bool isCasting = false;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            boxCollider = GetComponent<BoxCollider2D>();
            playerAnim = GetComponent<PlayerAnimation>();
            playerCombat = GetComponent<PlayerCombat>();

            defaultGravity = rb.gravityScale;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.freezeRotation = true;

            EnsureSpawnPoints();
        }

        private void EnsureSpawnPoints()
        {
            if (groundCheck == null)
            {
                var go = new GameObject("GroundCheck");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(0, -0.6f, 0);
                groundCheck = go.transform;
            }
            if (forwardSlashPoint == null)
            {
                var go = new GameObject("ForwardSlashPoint");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(0.8f, 0, 0);
                forwardSlashPoint = go.transform;
            }
            if (upSlashPoint == null)
            {
                var go = new GameObject("UpSlashPoint");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(0, 0.8f, 0);
                upSlashPoint = go.transform;
            }
            if (downSlashPoint == null)
            {
                var go = new GameObject("DownSlashPoint");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(0, -0.8f, 0);
                downSlashPoint = go.transform;
            }
            if (castPoint == null)
            {
                var go = new GameObject("CastPoint");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(0.6f, 0.1f, 0);
                castPoint = go.transform;
            }
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.IsTrialActive)
            {
                // Freeze player during full trial popup
                rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
                playerAnim.SetState(KnightAnimState.Idle);
                return;
            }

            ReadInput();
            HandleGrounding();
            HandleJump();
            HandleCombatInputs();
            UpdateAnimation();
        }

        private void FixedUpdate()
        {
            if (GameManager.Instance != null && GameManager.Instance.IsTrialActive)
            {
                return;
            }

            ApplyMovement();
            ApplyBetterJumping();
        }

        private void ReadInput()
        {
            horizontalInput = Input.GetAxisRaw("Horizontal");
            verticalInput = Input.GetAxisRaw("Vertical");

            if (Input.GetButtonDown("Jump") || Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow))
            {
                jumpBufferCounter = JumpBufferDuration;
            }
            else
            {
                jumpBufferCounter -= Time.deltaTime;
            }

            if (Input.GetButtonUp("Jump") || Input.GetKeyUp(KeyCode.Space) || Input.GetKeyUp(KeyCode.W) || Input.GetKeyUp(KeyCode.UpArrow))
            {
                if (rb.linearVelocity.y > 0)
                {
                    rb.linearVelocity = new Vector2(rb.linearVelocity.x, rb.linearVelocity.y * jumpCutMultiplier);
                }
            }
        }

        private void HandleGrounding()
        {
            Vector2 checkPos = groundCheck != null ? (Vector2)groundCheck.position : (Vector2)transform.position + Vector2.down * 0.6f;
            isGrounded = Physics2D.OverlapBox(checkPos, groundCheckSize, 0f, groundLayer);

            if (isGrounded)
            {
                coyoteTimeCounter = CoyoteTimeDuration;
            }
            else
            {
                coyoteTimeCounter -= Time.deltaTime;
            }
        }

        private void HandleJump()
        {
            if (jumpBufferCounter > 0f && coyoteTimeCounter > 0f)
            {
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
                jumpBufferCounter = 0f;
                coyoteTimeCounter = 0f;
                ProceduralAudio.Instance?.PlayJump();
            }
        }

        private void ApplyMovement()
        {
            float targetSpeed = horizontalInput * moveSpeed;
            rb.linearVelocity = new Vector2(targetSpeed, rb.linearVelocity.y);

            if (horizontalInput > 0.05f && !isFacingRight)
            {
                Flip();
            }
            else if (horizontalInput < -0.05f && isFacingRight)
            {
                Flip();
            }
        }

        private void ApplyBetterJumping()
        {
            if (rb.linearVelocity.y < 0)
            {
                rb.gravityScale = defaultGravity * fallGravityMultiplier;
            }
            else
            {
                rb.gravityScale = defaultGravity;
            }
        }

        private void HandleCombatInputs()
        {
            // Attack (J, Z, or Mouse 0)
            if ((Input.GetKeyDown(KeyCode.J) || Input.GetKeyDown(KeyCode.Z) || Input.GetMouseButtonDown(0)) && !isAttacking)
            {
                ExecuteNailAttack();
            }

            // Cast Spell (K, X, or Mouse 1)
            if ((Input.GetKeyDown(KeyCode.K) || Input.GetKeyDown(KeyCode.X) || Input.GetMouseButtonDown(1)) && !isCasting)
            {
                ExecuteSpellCast();
            }

            // Interact with Altar (E)
            if (Input.GetKeyDown(KeyCode.E))
            {
                TryInteractAltar();
            }
        }

        private void ExecuteNailAttack()
        {
            isAttacking = true;
            ProceduralAudio.Instance?.PlaySlash();

            Vector2 slashDir = isFacingRight ? Vector2.right : Vector2.left;
            Transform spawnPoint = forwardSlashPoint;
            bool isDown = false;

            if (verticalInput > 0.5f)
            {
                slashDir = Vector2.up;
                spawnPoint = upSlashPoint;
            }
            else if (verticalInput < -0.5f && !isGrounded)
            {
                slashDir = Vector2.down;
                spawnPoint = downSlashPoint;
                isDown = true;
            }

            playerCombat.SpawnSlash(spawnPoint.position, slashDir, isDown, () =>
            {
                // Pogo bounce!
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce * 0.85f);
                coyoteTimeCounter = CoyoteTimeDuration;
            });

            playerAnim.PlayAction(KnightAnimState.Attack, 18f, () =>
            {
                isAttacking = false;
            });
        }

        private void ExecuteSpellCast()
        {
            if (!playerCombat.CanCastSpell())
            {
                return;
            }

            isCasting = true;
            ProceduralAudio.Instance?.PlayCast();

            Vector2 castDir = isFacingRight ? Vector2.right : Vector2.left;
            playerCombat.ConsumeSoulForSpell();
            playerCombat.SpawnVengefulSpirit(castPoint.position, castDir);

            playerAnim.PlayAction(KnightAnimState.Cast, 16f, () =>
            {
                isCasting = false;
            });
        }

        private void TryInteractAltar()
        {
            var hits = Physics2D.OverlapCircleAll(transform.position, 1.5f);
            foreach (var h in hits)
            {
                var altar = h.GetComponent<LoreTabletAltar>();
                if (altar != null)
                {
                    altar.ActivateTrial();
                    break;
                }
            }
        }

        private void Flip()
        {
            isFacingRight = !isFacingRight;
            playerAnim.SetFacingDirection(isFacingRight);

            // Invert x offsets for forward spawn points
            if (forwardSlashPoint != null)
            {
                var p = forwardSlashPoint.localPosition;
                p.x = Mathf.Abs(p.x) * (isFacingRight ? 1f : -1f);
                forwardSlashPoint.localPosition = p;
            }
            if (castPoint != null)
            {
                var p = castPoint.localPosition;
                p.x = Mathf.Abs(p.x) * (isFacingRight ? 1f : -1f);
                castPoint.localPosition = p;
            }
        }

        private void UpdateAnimation()
        {
            if (isAttacking || isCasting) return;

            if (!isGrounded)
            {
                playerAnim.SetState(KnightAnimState.Jump);
            }
            else if (Mathf.Abs(horizontalInput) > 0.05f)
            {
                playerAnim.SetState(KnightAnimState.Run);
            }
            else
            {
                playerAnim.SetState(KnightAnimState.Idle);
            }
        }
    }
}
