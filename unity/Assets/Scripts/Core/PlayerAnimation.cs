using System;
using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    public enum KnightAnimState
    {
        Idle,
        Run,
        Jump,
        Attack,
        Cast,
        Hurt,
        Focus
    }

    [RequireComponent(typeof(SpriteRenderer))]
    public class PlayerAnimation : MonoBehaviour
    {
        private SpriteRenderer spriteRenderer;

        public Sprite[] idleFrames;
        public Sprite[] runFrames;
        public Sprite[] jumpFrames;
        public Sprite[] attackFrames;
        public Sprite[] castFrames;
        public Sprite[] hurtFrames;
        public Sprite[] focusFrames;

        private KnightAnimState currentState = KnightAnimState.Idle;
        private int currentFrame = 0;
        private float frameTimer = 0f;
        private float currentFps = 10f;
        private bool isLockedAnimation = false;
        private Action onLockedAnimComplete = null;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            AutoPopulateFramesIfEmpty();
            if (idleFrames != null && idleFrames.Length > 0 && spriteRenderer.sprite == null)
            {
                spriteRenderer.sprite = idleFrames[0];
            }
        }

        public void AutoPopulateFramesIfEmpty()
        {
            if (idleFrames == null || idleFrames.Length == 0)
                idleFrames = LoadFrames("knight_idle_", "idle");
            if (runFrames == null || runFrames.Length == 0)
                runFrames = LoadFrames("knight_run_", "run");
            if (jumpFrames == null || jumpFrames.Length == 0)
                jumpFrames = LoadFrames("knight_jump_", "jump");
            if (attackFrames == null || attackFrames.Length == 0)
                attackFrames = LoadFrames("knight_attack_", "attack");
            if (castFrames == null || castFrames.Length == 0)
                castFrames = LoadFrames("knight_cast_", "cast");
            if (hurtFrames == null || hurtFrames.Length == 0)
                hurtFrames = LoadFrames("knight_hurt_", "hurt");
            if (focusFrames == null || focusFrames.Length == 0)
                focusFrames = LoadFrames("knight_focus_", "focus");
        }

        private Sprite[] LoadFrames(string prefix, string fallbackState)
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
                var allSprites = Resources.FindObjectsOfTypeAll<Sprite>();
                foreach (var s in allSprites)
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
            return RuntimeSpriteFactory.GetKnightFrames(fallbackState);
        }

        private void Update()
        {
            Sprite[] activeFrames = GetActiveFrames();
            if (activeFrames == null || activeFrames.Length == 0) return;

            frameTimer += Time.deltaTime;
            float frameInterval = 1f / currentFps;

            if (frameTimer >= frameInterval)
            {
                frameTimer -= frameInterval;
                currentFrame++;

                if (currentFrame >= activeFrames.Length)
                {
                    if (isLockedAnimation)
                    {
                        isLockedAnimation = false;
                        currentFrame = 0;
                        var callback = onLockedAnimComplete;
                        onLockedAnimComplete = null;
                        callback?.Invoke();
                        SetState(KnightAnimState.Idle);
                        return;
                    }
                    else
                    {
                        currentFrame = 0;
                    }
                }

                if (currentFrame < activeFrames.Length)
                {
                    spriteRenderer.sprite = activeFrames[currentFrame];
                }
            }
        }

        public void SetState(KnightAnimState newState)
        {
            if (isLockedAnimation) return;
            if (currentState == newState) return;

            currentState = newState;
            currentFrame = 0;
            frameTimer = 0f;

            switch (currentState)
            {
                case KnightAnimState.Idle:
                    currentFps = 8f;
                    break;
                case KnightAnimState.Run:
                    currentFps = 14f;
                    break;
                case KnightAnimState.Jump:
                    currentFps = 10f;
                    break;
                case KnightAnimState.Focus:
                    currentFps = 8f;
                    break;
            }

            Sprite[] frames = GetActiveFrames();
            if (frames != null && frames.Length > 0)
            {
                spriteRenderer.sprite = frames[0];
            }
        }

        public void PlayAction(KnightAnimState actionState, float fps = 18f, Action onComplete = null)
        {
            currentState = actionState;
            currentFrame = 0;
            frameTimer = 0f;
            currentFps = fps;
            isLockedAnimation = true;
            onLockedAnimComplete = onComplete;

            Sprite[] frames = GetActiveFrames();
            if (frames != null && frames.Length > 0)
            {
                spriteRenderer.sprite = frames[0];
            }
        }

        private Sprite[] GetActiveFrames()
        {
            switch (currentState)
            {
                case KnightAnimState.Idle: return idleFrames;
                case KnightAnimState.Run: return runFrames;
                case KnightAnimState.Jump: return jumpFrames;
                case KnightAnimState.Attack: return attackFrames;
                case KnightAnimState.Cast: return castFrames;
                case KnightAnimState.Hurt: return hurtFrames;
                case KnightAnimState.Focus: return focusFrames;
                default: return idleFrames;
            }
        }

        public void SetFacingDirection(bool faceRight)
        {
            spriteRenderer.flipX = !faceRight;
        }
    }
}
