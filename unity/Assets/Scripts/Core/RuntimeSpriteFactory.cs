using System;
using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    /// <summary>
    /// Procedural fallback sprite generator so the Unity scene is 100% visible,
    /// animated, and playable out-of-the-box even when external sprite packs are absent.
    /// </summary>
    public static class RuntimeSpriteFactory
    {
        private static Sprite whiteSprite;
        private static Sprite maskFullSprite;
        private static Sprite maskEmptySprite;
        private static Sprite totemSprite;
        private static Sprite altarSprite;
        private static Sprite platformSprite;
        private static Sprite backdropSprite;
        private static Dictionary<string, Sprite[]> animCache = new Dictionary<string, Sprite[]>();

        public static Sprite GetWhiteSprite()
        {
            if (whiteSprite != null) return whiteSprite;
            var tex = new Texture2D(16, 16, TextureFormat.RGBA32, false);
            var cols = new Color32[16 * 16];
            for (int i = 0; i < cols.Length; i++) cols[i] = new Color32(255, 255, 255, 255);
            tex.SetPixels32(cols);
            tex.Apply();
            whiteSprite = Sprite.Create(tex, new Rect(0, 0, 16, 16), new Vector2(0.5f, 0.5f), 16f);
            whiteSprite.name = "ProceduralWhite";
            return whiteSprite;
        }

        public static Sprite GetMaskSprite(bool full)
        {
            if (full && maskFullSprite != null) return maskFullSprite;
            if (!full && maskEmptySprite != null) return maskEmptySprite;

            int w = 64, h = 76;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            Color32 fill = full ? new Color32(244, 247, 252, 255) : new Color32(80, 90, 110, 110);
            Color32 eye = new Color32(14, 18, 26, 255);

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float nx = (x - w * 0.5f) / (w * 0.42f);
                    float ny = (y - h * 0.45f) / (h * 0.40f);
                    bool inHead = (nx * nx + ny * ny) <= 1.0f;
                    bool inHorns = (y > h * 0.55f) && (Mathf.Abs(nx) > 0.35f && Mathf.Abs(nx) < 0.85f) && (y < h * 0.94f);
                    if (inHead || inHorns)
                    {
                        bool inEye = (Mathf.Abs(x - w * 0.35f) < 6 && Mathf.Abs(y - h * 0.40f) < 9) ||
                                     (Mathf.Abs(x - w * 0.65f) < 6 && Mathf.Abs(y - h * 0.40f) < 9);
                        tex.SetPixel(x, y, inEye ? (Color)eye : (Color)fill);
                    }
                    else
                    {
                        tex.SetPixel(x, y, Color.clear);
                    }
                }
            }
            tex.Apply();
            var sp = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 64f);
            sp.name = full ? "Ancient Mask Full" : "Ancient Mask Empty";
            if (full) maskFullSprite = sp; else maskEmptySprite = sp;
            return sp;
        }

        public static Sprite GetPlatformSprite()
        {
            if (platformSprite != null) return platformSprite;
            int w = 64, h = 32;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    bool border = (y >= h - 4) || (y < 3) || (x % 16 == 0);
                    Color c = border ? new Color(0.38f, 0.52f, 0.64f, 1f) : new Color(0.18f, 0.25f, 0.34f, 1f);
                    tex.SetPixel(x, y, c);
                }
            }
            tex.Apply();
            platformSprite = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 32f);
            platformSprite.name = "ProceduralPlatform";
            return platformSprite;
        }

        public static Sprite GetTotemSprite()
        {
            if (totemSprite != null) return totemSprite;
            int w = 64, h = 112;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float nx = (x - w * 0.5f) / (w * 0.36f);
                    float ny = (y - h * 0.5f) / (h * 0.46f);
                    if (Mathf.Abs(nx) < 1f - 0.25f * Mathf.Abs(ny) && Mathf.Abs(ny) < 0.95f)
                    {
                        bool glow = (Vector2.Distance(new Vector2(x, y), new Vector2(w * 0.5f, h * 0.68f)) < 12f);
                        tex.SetPixel(x, y, glow ? new Color(0.4f, 0.92f, 1f, 1f) : new Color(0.45f, 0.54f, 0.65f, 1f));
                    }
                    else tex.SetPixel(x, y, Color.clear);
                }
            }
            tex.Apply();
            totemSprite = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 48f);
            totemSprite.name = "soul_totem_03_a";
            return totemSprite;
        }

        public static Sprite GetAltarSprite()
        {
            if (altarSprite != null) return altarSprite;
            int w = 80, h = 112;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float nx = (x - w * 0.5f) / (w * 0.40f);
                    float ny = (y - h * 0.48f) / (h * 0.45f);
                    if ((nx * nx + ny * ny) <= 1.0f || (y < h * 0.5f && Mathf.Abs(nx) < 0.85f))
                    {
                        bool rune = (y > 24 && y < h - 24 && (y % 14 < 3) && Mathf.Abs(nx) < 0.55f);
                        tex.SetPixel(x, y, rune ? new Color(1f, 0.88f, 0.42f, 1f) : new Color(0.26f, 0.34f, 0.46f, 1f));
                    }
                    else tex.SetPixel(x, y, Color.clear);
                }
            }
            tex.Apply();
            altarSprite = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 48f);
            altarSprite.name = "lit_tablet";
            return altarSprite;
        }

        public static Sprite[] GetKnightFrames(string state)
        {
            string key = "knight_" + state;
            if (animCache.TryGetValue(key, out var cached)) return cached;

            var frames = new Sprite[4];
            for (int f = 0; f < 4; f++)
            {
                int w = 96, h = 96;
                var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
                int bob = (state == "run") ? ((f % 2 == 0) ? 3 : 0) : ((f % 2 == 0) ? 1 : 0);
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        Color col = Color.clear;
                        // Cloak & legs
                        if (y >= 10 + bob && y < 46 + bob && Mathf.Abs(x - 48) < (48 - y * 0.45f))
                        {
                            col = (state == "hurt" && f % 2 == 0) ? new Color(0.5f, 0.9f, 1f, 1f) : new Color(0.24f, 0.30f, 0.42f, 1f);
                        }
                        // Mask head
                        float hx = (x - 48f) / 18f;
                        float hy = (y - (58f + bob)) / 16f;
                        if (hx * hx + hy * hy <= 1.0f)
                        {
                            col = new Color(0.96f, 0.97f, 0.99f, 1f);
                            // Eyes (facing right by default in Unity)
                            if ((Vector2.Distance(new Vector2(x, y), new Vector2(53, 56 + bob)) < 4.5f) ||
                                (Vector2.Distance(new Vector2(x, y), new Vector2(43, 56 + bob)) < 4.0f))
                            {
                                col = new Color(0.06f, 0.08f, 0.12f, 1f);
                            }
                        }
                        // Horns
                        if (y >= 70 + bob && y < 88 + bob && (Mathf.Abs(x - 35) < 4 || Mathf.Abs(x - 61) < 4))
                        {
                            col = new Color(0.96f, 0.97f, 0.99f, 1f);
                        }
                        tex.SetPixel(x, y, col);
                    }
                }
                tex.Apply();
                frames[f] = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 64f);
                frames[f].name = $"knight_{state}_0{f}";
            }
            animCache[key] = frames;
            return frames;
        }

        public static Sprite[] GetHornetFrames(string state)
        {
            string key = "hornet_" + state;
            if (animCache.TryGetValue(key, out var cached)) return cached;

            var frames = new Sprite[4];
            for (int f = 0; f < 4; f++)
            {
                int w = 128, h = 128;
                var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
                int bob = (f % 2 == 0) ? 2 : 0;
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        Color col = Color.clear;
                        // Legs
                        if (y >= 8 && y < 34 && (Mathf.Abs(x - 58) < 3 || Mathf.Abs(x - 70) < 3))
                            col = new Color(0.08f, 0.1f, 0.14f, 1f);
                        // Crimson Cloak
                        if (y >= 30 + bob && y < 74 + bob && Mathf.Abs(x - 64) < (78 - y) * 0.55f)
                            col = new Color(0.76f, 0.12f, 0.18f, 1f);
                        // Horned White Mask
                        if (y >= 72 + bob && y < 98 + bob && Mathf.Abs(x - 64) < 14)
                        {
                            col = new Color(0.96f, 0.97f, 0.99f, 1f);
                            if (Vector2.Distance(new Vector2(x, y), new Vector2(69, 82 + bob)) < 4.5f)
                                col = new Color(0.08f, 0.1f, 0.14f, 1f);
                        }
                        if (y >= 96 + bob && y < 120 + bob && (Mathf.Abs(x - (50 - (y - 96) * 0.3f)) < 3.5f || Mathf.Abs(x - (78 + (y - 96) * 0.3f)) < 3.5f))
                            col = new Color(0.96f, 0.97f, 0.99f, 1f);
                        // Needle
                        if (Mathf.Abs(y - (54 + bob)) < 2 && x >= 24 && x <= 104)
                            col = new Color(0.85f, 0.9f, 0.96f, 1f);
                        tex.SetPixel(x, y, col);
                    }
                }
                tex.Apply();
                frames[f] = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 64f);
                frames[f].name = $"Hornet - {state}000{f}";
            }
            animCache[key] = frames;
            return frames;
        }

        public static Sprite[] GetFireballSprites()
        {
            if (animCache.TryGetValue("fireball", out var cached)) return cached;
            var frames = new Sprite[3];
            for (int f = 0; f < 3; f++)
            {
                int w = 96, h = 64;
                var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        float d = Vector2.Distance(new Vector2(x, y), new Vector2(60, 32));
                        if (d < 22f)
                            tex.SetPixel(x, y, d < 12f ? Color.white : new Color(0f, 0.84f, 1f, 0.9f));
                        else if (x < 60 && Mathf.Abs(y - 32) < (x / 60f) * 18f)
                            tex.SetPixel(x, y, new Color(0f, 0.84f, 1f, (x / 60f) * 0.75f));
                        else
                            tex.SetPixel(x, y, Color.clear);
                    }
                }
                tex.Apply();
                frames[f] = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 64f);
                frames[f].name = $"Vengeful Spirit - fireball_collect000{f + 4}";
            }
            animCache["fireball"] = frames;
            return frames;
        }

        public static Sprite GetSlashArcSprite()
        {
            if (animCache.TryGetValue("slash_arc", out var cached)) return cached[0];
            int w = 96, h = 80;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), new Vector2(20, 40));
                    if (d > 24f && d < 44f && x > 24)
                        tex.SetPixel(x, y, new Color(0.9f, 0.98f, 1f, 0.92f));
                    else
                        tex.SetPixel(x, y, Color.clear);
                }
            }
            tex.Apply();
            var sp = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 64f);
            sp.name = "SlashArc";
            animCache["slash_arc"] = new Sprite[] { sp };
            return sp;
        }
    }
}
