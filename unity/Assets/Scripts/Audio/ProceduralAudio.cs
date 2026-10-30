using UnityEngine;

namespace KnightOfWords
{
    public class ProceduralAudio : MonoBehaviour
    {
        public static ProceduralAudio Instance { get; private set; }

        private AudioSource audioSource;

        private AudioClip slashClip;
        private AudioClip castClip;
        private AudioClip hitClip;
        private AudioClip jumpClip;
        private AudioClip correctClip;
        private AudioClip wrongClip;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            audioSource = gameObject.AddComponent<AudioSource>();
            audioSource.playOnAwake = false;

            GenerateAudioClips();
        }

        private void GenerateAudioClips()
        {
            slashClip = CreateSlashSound();
            castClip = CreateCastSound();
            hitClip = CreateHitSound();
            jumpClip = CreateJumpSound();
            correctClip = CreateChimeSound();
            wrongClip = CreateBuzzSound();
        }

        public void PlaySlash() => Play(slashClip, 0.7f);
        public void PlayCast() => Play(castClip, 0.9f);
        public void PlayHit() => Play(hitClip, 0.8f);
        public void PlayJump() => Play(jumpClip, 0.5f);
        public void PlayCorrect() => Play(correctClip, 0.9f);
        public void PlayWrong() => Play(wrongClip, 0.7f);

        private void Play(AudioClip clip, float volume = 1.0f)
        {
            if (clip != null && audioSource != null)
            {
                audioSource.PlayOneShot(clip, volume);
            }
        }

        private AudioClip CreateSlashSound()
        {
            int sampleRate = 44100;
            float duration = 0.18f;
            int totalSamples = Mathf.FloorToInt(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Exp(-t * 28f);
                float noise = (Random.value * 2f - 1f) * 0.7f;
                float freq = Mathf.Lerp(880f, 180f, t / duration);
                float tone = Mathf.Sin(2f * Mathf.PI * freq * t) * 0.4f;
                samples[i] = (noise + tone) * envelope;
            }

            var clip = AudioClip.Create("Slash", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateCastSound()
        {
            int sampleRate = 44100;
            float duration = 0.45f;
            int totalSamples = Mathf.FloorToInt(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Sin(Mathf.Clamp01(t / 0.05f) * Mathf.PI * 0.5f) * Mathf.Exp(-t * 8f);
                float freq = Mathf.Lerp(220f, 660f, Mathf.Pow(t / duration, 0.5f));
                float sub = Mathf.Sin(2f * Mathf.PI * (freq * 0.5f) * t) * 0.5f;
                float main = Mathf.Sin(2f * Mathf.PI * freq * t) * 0.5f;
                float noise = (Random.value * 2f - 1f) * 0.25f;
                samples[i] = (sub + main + noise) * envelope;
            }

            var clip = AudioClip.Create("Cast", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateHitSound()
        {
            int sampleRate = 44100;
            float duration = 0.15f;
            int totalSamples = Mathf.FloorToInt(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Exp(-t * 35f);
                float freq = Mathf.Lerp(160f, 40f, t / duration);
                float thump = Mathf.Sin(2f * Mathf.PI * freq * t);
                float crack = (Random.value * 2f - 1f) * 0.4f * Mathf.Exp(-t * 70f);
                samples[i] = (thump + crack) * envelope;
            }

            var clip = AudioClip.Create("Hit", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateJumpSound()
        {
            int sampleRate = 44100;
            float duration = 0.12f;
            int totalSamples = Mathf.FloorToInt(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Exp(-t * 18f);
                float freq = Mathf.Lerp(280f, 520f, t / duration);
                samples[i] = Mathf.Sin(2f * Mathf.PI * freq * t) * envelope * 0.6f;
            }

            var clip = AudioClip.Create("Jump", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateChimeSound()
        {
            int sampleRate = 44100;
            float duration = 0.6f;
            int totalSamples = Mathf.FloorToInt(sampleRate * duration);
            float[] samples = new float[totalSamples];

            // Harmonic chord (C5, E5, G5)
            float[] freqs = new float[] { 523.25f, 659.25f, 783.99f };

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Exp(-t * 4.5f);
                float val = 0f;
                for (int f = 0; f < freqs.Length; f++)
                {
                    val += Mathf.Sin(2f * Mathf.PI * freqs[f] * t) * (1f / (f + 1));
                }
                samples[i] = (val / freqs.Length) * envelope * 0.8f;
            }

            var clip = AudioClip.Create("Chime", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private AudioClip CreateBuzzSound()
        {
            int sampleRate = 44100;
            float duration = 0.3f;
            int totalSamples = Mathf.FloorToInt(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Exp(-t * 10f);
                float square = Mathf.Sign(Mathf.Sin(2f * Mathf.PI * 130.81f * t)); // Low C
                samples[i] = square * envelope * 0.4f;
            }

            var clip = AudioClip.Create("Buzz", totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }
    }
}
