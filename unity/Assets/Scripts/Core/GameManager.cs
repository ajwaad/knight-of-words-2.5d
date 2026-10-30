using System;
using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public bool IsTrialActive { get; private set; } = false;

        private Queue<TrialQuestion> questionQueue = new Queue<TrialQuestion>();

        [Header("Victory Screen")]
        public GameObject victoryPanel;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            InitializeQuestionQueue();

            if (victoryPanel != null)
            {
                victoryPanel.SetActive(false);
            }
        }

        private void InitializeQuestionQueue()
        {
            var questions = CurriculumBank.GetYear3Questions();
            // Shuffle
            for (int i = 0; i < questions.Count; i++)
            {
                int r = UnityEngine.Random.Range(i, questions.Count);
                var temp = questions[i];
                questions[i] = questions[r];
                questions[r] = temp;
            }

            foreach (var q in questions)
            {
                questionQueue.Enqueue(q);
            }
        }

        public void OpenCombatTrial(Action onCorrect, Action onWrong)
        {
            if (IsTrialActive) return;

            if (questionQueue.Count == 0)
            {
                InitializeQuestionQueue();
            }

            IsTrialActive = true;
            var question = questionQueue.Dequeue();

            if (TrialCanvas.Instance != null)
            {
                TrialCanvas.Instance.DisplayTrial(question, onCorrect, onWrong);
            }
        }

        public void CloseTrial()
        {
            IsTrialActive = false;
        }

        public void OnBossDefeated()
        {
            if (victoryPanel != null)
            {
                victoryPanel.SetActive(true);
            }
        }
    }
}
