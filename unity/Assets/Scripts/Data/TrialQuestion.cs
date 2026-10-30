using System;
using System.Collections.Generic;
using UnityEngine;

namespace KnightOfWords
{
    [Serializable]
    public class TrialQuestion
    {
        public string id;
        public string category;       // e.g., "Have Got / Has Got", "Present Continuous", "Past Simple", "Prepositions"
        public string prompt;         // Question sentence with blank or inquiry
        public string[] options;      // 4 choices
        public int correctIndex;      // 0 to 3
        public string grammarRule;    // Clear pedagogical hint / explanation
        public string tier;           // "Emerging", "Core", "Extension"
    }

    public static class CurriculumBank
    {
        public static List<TrialQuestion> GetYear3Questions()
        {
            return new List<TrialQuestion>
            {
                // STRAND 1: Have Got / Has Got
                new TrialQuestion {
                    id = "HG01",
                    category = "Grammar: Have/Has Got",
                    prompt = "The brave Knight ______ a sharp silver nail.",
                    options = new string[] { "has got", "have got", "is got", "having got" },
                    correctIndex = 0,
                    grammarRule = "Use 'has got' with singular subjects (He, She, It, The Knight).",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "HG02",
                    category = "Grammar: Have/Has Got",
                    prompt = "The elder bugs ______ ancient masks to protect their faces.",
                    options = new string[] { "has got", "have got", "are got", "has" },
                    correctIndex = 1,
                    grammarRule = "Use 'have got' with plural subjects (They, We, The bugs).",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "HG03",
                    category = "Grammar: Have/Has Got",
                    prompt = "Hornet: 'I ______ a needle and silk thread!'",
                    options = new string[] { "has got", "have got", "am got", "having" },
                    correctIndex = 1,
                    grammarRule = "Pronoun 'I' takes 'have got' (I have got).",
                    tier = "Emerging"
                },
                new TrialQuestion {
                    id = "HG04",
                    category = "Grammar: Have/Has Got",
                    prompt = "The tiny grub ______ any wings to fly away.",
                    options = new string[] { "hasn't got", "haven't got", "isn't got", "don't got" },
                    correctIndex = 0,
                    grammarRule = "Negative singular uses 'hasn't got' (has not got).",
                    tier = "Extension"
                },

                // STRAND 2: Present Continuous (am/is/are + verb-ing)
                new TrialQuestion {
                    id = "PC01",
                    category = "Grammar: Present Continuous",
                    prompt = "Look! The guardian Hornet ______ across the cavern right now.",
                    options = new string[] { "is dashing", "are dashing", "am dashing", "dashes" },
                    correctIndex = 0,
                    grammarRule = "Actions happening now with a singular subject use 'is + verb-ing'.",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "PC02",
                    category = "Grammar: Present Continuous",
                    prompt = "The Hivelings ______ sweet nectar in their nest.",
                    options = new string[] { "is making", "are making", "am making", "makes" },
                    correctIndex = 1,
                    grammarRule = "Plural subjects take 'are + verb-ing' in the present continuous.",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "PC03",
                    category = "Grammar: Present Continuous",
                    prompt = "Listen! The Knight ______ the ancient spell of Soul.",
                    options = new string[] { "is casting", "are casting", "cast", "were casting" },
                    correctIndex = 0,
                    grammarRule = "'The Knight' is singular, so we say 'is casting'.",
                    tier = "Emerging"
                },
                new TrialQuestion {
                    id = "PC04",
                    category = "Grammar: Present Continuous",
                    prompt = "We ______ quietly so we do not wake the sleeping beast.",
                    options = new string[] { "is walking", "are walking", "walking", "was walking" },
                    correctIndex = 1,
                    grammarRule = "Pronoun 'We' takes 'are walking'.",
                    tier = "Core"
                },

                // STRAND 3: Past Simple (was / were / regular / irregular)
                new TrialQuestion {
                    id = "PS01",
                    category = "Grammar: Past Simple",
                    prompt = "Yesterday, the King's palace ______ dark and silent.",
                    options = new string[] { "was", "were", "is", "are" },
                    correctIndex = 0,
                    grammarRule = "In past simple, singular subjects take 'was'.",
                    tier = "Emerging"
                },
                new TrialQuestion {
                    id = "PS02",
                    category = "Grammar: Past Simple",
                    prompt = "Last night, the great explorers ______ deep into the Forgotten Caverns.",
                    options = new string[] { "travelled", "travels", "travelling", "was travel" },
                    correctIndex = 0,
                    grammarRule = "For past events with regular verbs, add '-ed' (travelled).",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "PS03",
                    category = "Grammar: Past Simple",
                    prompt = "All the ancient warriors ______ brave and loyal.",
                    options = new string[] { "was", "were", "are", "being" },
                    correctIndex = 1,
                    grammarRule = "Plural past tense takes 'were' (warriors were).",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "PS04",
                    category = "Grammar: Past Simple",
                    prompt = "The Knight ______ a mysterious glowing tablet on the path.",
                    options = new string[] { "found", "finds", "finding", "finded" },
                    correctIndex = 0,
                    grammarRule = "Past tense of irregular verb 'find' is 'found'.",
                    tier = "Core"
                },

                // STRAND 4: Prepositions of Place
                new TrialQuestion {
                    id = "PR01",
                    category = "Vocabulary: Prepositions",
                    prompt = "The delicate flower was hidden ______ the massive stone bench.",
                    options = new string[] { "under", "between", "among", "through" },
                    correctIndex = 0,
                    grammarRule = "'Under' means below or beneath an object.",
                    tier = "Emerging"
                },
                new TrialQuestion {
                    id = "PR02",
                    category = "Vocabulary: Prepositions",
                    prompt = "The glowing altar stands ______ two tall pillars.",
                    options = new string[] { "between", "under", "on", "into" },
                    correctIndex = 0,
                    grammarRule = "'Between' is used when something is in the middle of two objects.",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "PR03",
                    category = "Vocabulary: Prepositions",
                    prompt = "The Knight stood proudly ______ front of the palace gate.",
                    options = new string[] { "in", "on", "at", "by" },
                    correctIndex = 0,
                    grammarRule = "The fixed prepositional phrase is 'in front of'.",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "PR04",
                    category = "Vocabulary: Prepositions",
                    prompt = "The lumafly lantern is hanging ______ the ceiling.",
                    options = new string[] { "from", "into", "between", "behind" },
                    correctIndex = 0,
                    grammarRule = "Objects suspended from above hang 'from' the ceiling.",
                    tier = "Extension"
                },

                // STRAND 5: Countable vs Uncountable Nouns
                new TrialQuestion {
                    id = "CN01",
                    category = "Grammar: Nouns & Quantifiers",
                    prompt = "Can you pass me a ______ of pure honey from the Hive?",
                    options = new string[] { "jar", "slice", "sheet", "packet" },
                    correctIndex = 0,
                    grammarRule = "Honey is an uncountable liquid measured in 'a jar of honey'.",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "CN02",
                    category = "Grammar: Nouns & Quantifiers",
                    prompt = "There are ______ shiny Geo coins scattered on the floor.",
                    options = new string[] { "many", "much", "a little", "any" },
                    correctIndex = 0,
                    grammarRule = "Use 'many' with plural countable nouns (coins).",
                    tier = "Core"
                },
                new TrialQuestion {
                    id = "CN03",
                    category = "Grammar: Nouns & Quantifiers",
                    prompt = "The tired traveller needs ______ fresh water to drink.",
                    options = new string[] { "some", "a few", "many", "two" },
                    correctIndex = 0,
                    grammarRule = "Use 'some' with uncountable nouns like water.",
                    tier = "Emerging"
                },
                new TrialQuestion {
                    id = "CN04",
                    category = "Grammar: Nouns & Quantifiers",
                    prompt = "How ______ Soul energy does the Knight have left?",
                    options = new string[] { "much", "many", "few", "number" },
                    correctIndex = 0,
                    grammarRule = "Use 'How much' when asking about uncountable amounts (energy).",
                    tier = "Core"
                }
            };
        }
    }
}
