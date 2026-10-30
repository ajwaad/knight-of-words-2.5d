using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace KnightOfWords
{
    public class TrialCanvas : MonoBehaviour
    {
        public static TrialCanvas Instance { get; private set; }

        [Header("UI References")]
        public GameObject panelRoot;
        public Text categoryText;
        public Text promptText;
        public Button[] optionButtons;
        public Text[] optionTexts;

        [Header("Feedback Panel")]
        public GameObject feedbackBanner;
        public Text feedbackText;
        public Text ruleExplanationText;

        private TrialQuestion currentQuestion;
        private Action onCorrectCallback;
        private Action onWrongCallback;
        private bool isAnswering = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            if (panelRoot != null)
            {
                panelRoot.SetActive(false);
            }
            if (feedbackBanner != null)
            {
                feedbackBanner.SetActive(false);
            }

            SetupOptionListeners();
        }

        private void SetupOptionListeners()
        {
            if (optionButtons == null) return;

            for (int i = 0; i < optionButtons.Length; i++)
            {
                int index = i;
                optionButtons[i].onClick.AddListener(() => SelectOption(index));
            }
        }

        private void Update()
        {
            if (panelRoot != null && panelRoot.activeSelf && !isAnswering)
            {
                if (Input.GetKeyDown(KeyCode.Alpha1) || Input.GetKeyDown(KeyCode.Keypad1)) SelectOption(0);
                if (Input.GetKeyDown(KeyCode.Alpha2) || Input.GetKeyDown(KeyCode.Keypad2)) SelectOption(1);
                if (Input.GetKeyDown(KeyCode.Alpha3) || Input.GetKeyDown(KeyCode.Keypad3)) SelectOption(2);
                if (Input.GetKeyDown(KeyCode.Alpha4) || Input.GetKeyDown(KeyCode.Keypad4)) SelectOption(3);
            }
        }

        public void DisplayTrial(TrialQuestion question, Action onCorrect, Action onWrong)
        {
            currentQuestion = question;
            onCorrectCallback = onCorrect;
            onWrongCallback = onWrong;
            isAnswering = false;

            if (categoryText != null) categoryText.text = $"❖ {question.category} ❖";
            if (promptText != null) promptText.text = question.prompt;

            if (feedbackBanner != null) feedbackBanner.SetActive(false);

            for (int i = 0; i < optionButtons.Length; i++)
            {
                if (i < question.options.Length)
                {
                    optionButtons[i].gameObject.SetActive(true);
                    if (optionTexts != null && i < optionTexts.Length && optionTexts[i] != null)
                    {
                        optionTexts[i].text = $"[{i + 1}]  {question.options[i]}";
                    }
                    optionButtons[i].interactable = true;
                }
                else
                {
                    optionButtons[i].gameObject.SetActive(false);
                }
            }

            if (panelRoot != null)
            {
                panelRoot.SetActive(true);
            }
        }

        public void SelectOption(int selectedIndex)
        {
            if (isAnswering || currentQuestion == null) return;
            isAnswering = true;

            bool isCorrect = (selectedIndex == currentQuestion.correctIndex);
            StartCoroutine(ShowFeedbackAndClose(isCorrect));
        }

        private IEnumerator ShowFeedbackAndClose(bool isCorrect)
        {
            if (feedbackBanner != null)
            {
                feedbackBanner.SetActive(true);
            }

            if (isCorrect)
            {
                if (feedbackText != null)
                {
                    feedbackText.text = "✦ RADIANT TRUTH! (+50 SOUL, +1 MASK) ✦";
                    feedbackText.color = new Color(0.3f, 1f, 0.4f);
                }
                if (ruleExplanationText != null)
                {
                    ruleExplanationText.text = currentQuestion.grammarRule;
                }
                ProceduralAudio.Instance?.PlayCorrect();
            }
            else
            {
                if (feedbackText != null)
                {
                    feedbackText.text = "✖ INCORRECT TRIAL ✖";
                    feedbackText.color = new Color(1f, 0.4f, 0.3f);
                }
                if (ruleExplanationText != null)
                {
                    ruleExplanationText.text = $"Lesson: {currentQuestion.grammarRule}";
                }
                ProceduralAudio.Instance?.PlayWrong();
            }

            yield return new WaitForSeconds(1.8f);

            if (panelRoot != null)
            {
                panelRoot.SetActive(false);
            }

            if (isCorrect)
            {
                onCorrectCallback?.Invoke();
            }
            else
            {
                onWrongCallback?.Invoke();
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.CloseTrial();
            }
        }
    }
}
