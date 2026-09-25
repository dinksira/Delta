/**
 * duelQuiz data
 * Builds the participant duel quiz for a topic battle. When the battle carries
 * authored questions (custom builder), each is mapped into a `DuelQuestion`
 * tagged by kind so the participant can answer it exactly as authored. When the
 * battle has no questions, a curated subject deck (falling back to general
 * knowledge) is used instead. A deterministic mock leaderboard is derived.
 */

import type {
  DuelLeaderboardEntry,
  DuelQuestion,
  DuelQuiz,
} from "@/modules/Competition/types/duelQuiz";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import type {
  TopicBattle,
  TopicBattleMatchingPair,
  TopicBattleQuestion,
} from "@/modules/Competition/types/topicBattle";

interface SubjectDeck {
  keywords: string[];
  questions: DuelQuestion[];
}

function mcq(text: string, options: string[], correctIndex: number): DuelQuestion {
  return {
    id: `q-${text.length}-${correctIndex}`,
    kind: "multiple_choice",
    text,
    options: options.map((option, index) => ({
      id: `o${index}`,
      label: String.fromCharCode(65 + index),
      text: option,
    })),
    correctId: `o${correctIndex}`,
    difficulty: "EASY",
    points: 100,
  };
}

const SUBJECT_DECKS: SubjectDeck[] = [
  {
    keywords: ["math", "calculus", "algebra", "geometry", "arithmetic"],
    questions: [
      mcq("What is the derivative of x²?", ["x", "2x", "2", "x²"], 1),
      mcq("Solve for x: 2x + 6 = 14", ["3", "4", "5", "6"], 1),
      mcq("Factor x² − 9", ["(x − 3)(x + 3)", "(x − 3)²", "(x + 3)²", "(x − 9)(x + 1)"], 0),
      mcq("What is the slope of the line y = 3x + 5?", ["3", "5", "−3", "0"], 0),
      mcq("If f(x) = x² + 2x, what is f(3)?", ["9", "12", "15", "18"], 2),
    ],
  },
  {
    keywords: ["physics"],
    questions: [
      mcq(
        "Which phenomenon describes electrons emitted from a material when light shines on it?",
        [
          "Compton scattering",
          "Photoelectric effect",
          "Blackbody radiation",
          "Wave-particle duality",
        ],
        1,
      ),
      mcq("What is the SI unit of electric current?", ["Volt", "Ampere", "Ohm", "Watt"], 1),
      mcq(
        "What is the acceleration due to gravity on Earth?",
        ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "7.8 m/s²"],
        1,
      ),
      mcq("What is the formula for force?", ["F = m/a", "F = ma", "F = mv", "F = m + a"], 1),
      mcq("What is the SI unit of power?", ["Joule", "Newton", "Watt", "Volt"], 2),
    ],
  },
  {
    keywords: ["chemistry", "chemical"],
    questions: [
      mcq("What is the chemical symbol for potassium?", ["Po", "Pt", "K", "Ka"], 2),
      mcq("What is the pH of a neutral solution at 25°C?", ["0", "7", "14", "1"], 1),
      mcq("How many hydrogen atoms are in one molecule of water?", ["1", "2", "3", "4"], 1),
      mcq(
        "What type of bond involves the sharing of electron pairs?",
        ["Ionic bond", "Metallic bond", "Covalent bond", "Hydrogen bond"],
        2,
      ),
      mcq(
        "Which gas is produced when hydrochloric acid reacts with zinc?",
        ["Oxygen", "Hydrogen", "Chlorine", "Carbon dioxide"],
        1,
      ),
    ],
  },
  {
    keywords: ["biology", "bio", "life science"],
    questions: [
      mcq("What is the basic unit of life?", ["Atom", "Molecule", "Cell", "Tissue"], 2),
      mcq(
        "What is the powerhouse of the cell?",
        ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
        2,
      ),
      mcq("How many chromosomes do humans have?", ["23", "44", "46", "48"], 2),
      mcq("Which organ is responsible for pumping blood?", ["Lungs", "Brain", "Heart", "Liver"], 2),
      mcq(
        "What process do plants use to convert sunlight into energy?",
        ["Respiration", "Photosynthesis", "Fermentation", "Digestion"],
        1,
      ),
    ],
  },
  {
    keywords: ["english", "language", "literature", "grammar"],
    questions: [
      mcq(
        "Who wrote 'Romeo and Juliet'?",
        ["Charles Dickens", "Ernest Hemingway", "William Shakespeare", "Jane Austen"],
        2,
      ),
      mcq("What is the antonym of 'benevolent'?", ["Kind", "Generous", "Hostile", "Charitable"], 2),
      mcq(
        "Identify the verb in: 'The quick fox jumps over the dog.'",
        ["quick", "fox", "jumps", "dog"],
        2,
      ),
      mcq(
        "Which sentence uses the correct punctuation?",
        ["Lets eat, Grandma!", "Let's eat, Grandma!", "Lets eat Grandma!", "Let's eat Grandma!"],
        1,
      ),
      mcq("What is a synonym for 'arduous'?", ["Easy", "Difficult", "Swift", "Fragile"], 1),
    ],
  },
  {
    keywords: ["history", "ancient", "civilization"],
    questions: [
      mcq(
        "Which civilization built the Great Pyramid of Giza?",
        ["Roman", "Greek", "Egyptian", "Mesopotamian"],
        2,
      ),
      mcq("What year did World War II begin?", ["1937", "1938", "1939", "1940"], 2),
      mcq(
        "What was the name of the Allied invasion of Normandy?",
        ["Operation Barbarossa", "Operation Overlord", "Operation Torch", "Market Garden"],
        1,
      ),
      mcq(
        "Who was the first Emperor of unified China?",
        ["Confucius", "Qin Shi Huang", "Sun Tzu", "Genghis Khan"],
        1,
      ),
      mcq(
        "Which two cities were atomic bombs dropped on?",
        ["Tokyo and Osaka", "Hiroshima and Nagasaki", "Kyoto and Kobe", "Yokohama and Sapporo"],
        1,
      ),
    ],
  },
  {
    keywords: ["ai", "artificial intelligence", "machine learning"],
    questions: [
      mcq(
        "What does 'AI' stand for?",
        [
          "Automated Integration",
          "Artificial Intelligence",
          "Advanced Interface",
          "Analytic Inference",
        ],
        1,
      ),
      mcq(
        "Which algorithm is commonly used for supervised classification?",
        ["K-means clustering", "Linear regression", "Decision tree", "Apriori"],
        2,
      ),
      mcq(
        "What is the output layer of a neural network responsible for?",
        ["Feeding inputs", "Adjusting weights", "Producing predictions", "Normalizing data"],
        2,
      ),
      mcq(
        "Which term describes teaching a model using labeled data?",
        [
          "Unsupervised learning",
          "Supervised learning",
          "Reinforcement learning",
          "Transfer learning",
        ],
        1,
      ),
      mcq(
        "What is overfitting in machine learning?",
        [
          "Model fails to train",
          "Model learns noise too well",
          "Model is too small",
          "Data is unbalanced",
        ],
        1,
      ),
    ],
  },
  {
    keywords: ["javascript", "typescript", "programming", "computer", "web", "coding"],
    questions: [
      mcq(
        "Which keyword declares a constant variable in JavaScript?",
        ["var", "let", "const", "static"],
        2,
      ),
      mcq(
        "What does 'DOM' stand for?",
        [
          "Document Object Model",
          "Data Object Method",
          "Digital Output Manager",
          "Dynamic Order Module",
        ],
        0,
      ),
      mcq(
        "Which method adds an element to the end of an array?",
        ["push()", "pop()", "shift()", "unshift()"],
        0,
      ),
      mcq(
        "What type is the result of `typeof null` in JavaScript?",
        ["null", "undefined", "object", "number"],
        2,
      ),
      mcq("Which operator checks both value and type?", ["==", "=", "===", "=>"], 2),
    ],
  },
];

const FALLBACK_QUESTIONS: DuelQuestion[] = [
  mcq("What is the capital of France?", ["London", "Paris", "Berlin", "Madrid"], 1),
  mcq("What is 2 + 2?", ["3", "4", "5", "6"], 1),
  mcq("Which planet is known as the Red Planet?", ["Venus", "Jupiter", "Mars", "Saturn"], 2),
  mcq("What is the largest ocean on Earth?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3),
  mcq("Who wrote 'Romeo and Juliet'?", ["Dickens", "Hemingway", "Shakespeare", "Austen"], 2),
];

function pickDeck(subject: string): DuelQuestion[] {
  const query = subject.trim().toLowerCase();
  for (const deck of SUBJECT_DECKS) {
    if (deck.keywords.some((keyword) => query.includes(keyword))) {
      return deck.questions;
    }
  }
  return FALLBACK_QUESTIONS;
}

/**
 * Map an authored question (from the backend) into a participant DuelQuestion.
 * Accepts both the topic-battle snapshot (`TopicBattleQuestion`) and the
 * standalone authored payload a Live Duel host posts live (`CodingQuestion`) —
 * they share the same authored surface, so the answering UI and grading rules
 * are identical everywhere.
 */
export function toDuelQuestion(
  q: CodingQuestion | TopicBattleQuestion,
): DuelQuestion | null {
  const base = {
    id: q.id,
    difficulty: q.difficulty,
    points: q.points || 100,
    hint: q.hintText || undefined,
  };
  const text = q.description || q.title;

  switch (q.kind) {
    case "multiple_choice": {
      const options = (q.mcqOptions ?? []).filter((option) => option.text.trim());
      if (options.length < 2) {
        return null;
      }
      return {
        ...base,
        kind: "multiple_choice",
        text: text || q.title || "Multiple choice question",
        options,
        correctId: q.mcqCorrectId,
      };
    }
    case "true_false":
      return {
        ...base,
        kind: "true_false",
        text: text || q.title || "True or false statement",
        correct: q.tfAnswer ?? true,
      };
    case "fill_blank":
      return {
        ...base,
        kind: "fill_blank",
        text: text || q.title || "Fill in the blank",
        expected: q.fillExpected ?? "",
        answers: q.fillAnswers ?? [],
      };
    case "matching": {
      const pool = (q.matchingAnswers ?? []).filter((a) => a.text.trim());
      const rawPairs = (q.matchingPairs ?? []).filter((p) => p.prompt.trim());

      // Legacy battles store `{ prompt, answer }` without an answer pool —
      // synthesize one (deduped by text) and map pairs onto it so grading
      // still works by answer id.
      if (pool.length === 0 && rawPairs.length > 0) {
        const seen = new Map<string, string>();
        const pairs: TopicBattleMatchingPair[] = [];
        for (const pair of rawPairs as Array<TopicBattleMatchingPair & { answer?: string }>) {
          const text = (pair.answer ?? "").trim();
          if (!text) {
            continue;
          }
          const key = text.toLowerCase();
          let answerId = seen.get(key);
          if (!answerId) {
            answerId = `legacy_ans_${pool.length + 1}`;
            seen.set(key, answerId);
            pool.push({ id: answerId, text });
          }
          pairs.push({ id: pair.id, prompt: pair.prompt, answerId });
        }
        rawPairs.splice(0, rawPairs.length, ...pairs);
      }

      if (pool.length === 0 || rawPairs.length === 0) {
        return null;
      }
      return {
        ...base,
        kind: "matching",
        text: text || q.title || "Match the pairs",
        answers: pool,
        pairs: rawPairs,
      };
    }
    case "ordering":
      return {
        ...base,
        kind: "ordering",
        text: text || q.title || "Order the items",
        items: q.orderingItems ?? [],
      };
    case "writing":
      return {
        ...base,
        kind: "writing",
        text: text || q.title || "Written response",
      };
    case "markdown":
      return {
        ...base,
        kind: "markdown",
        text: q.title || "Markdown question",
        source: q.markdown?.source ?? "",
        rubric: q.markdown?.rubric || undefined,
      };
    case "design": {
      const design = q.design;
      return {
        ...base,
        kind: "design",
        text: q.title || "Design challenge",
        brief: design?.brief ?? "",
        deliverables: design?.deliverables ?? [],
        coverUrl: design?.cover?.url ?? null,
        canvasWidth: design?.canvasWidth ?? 1080,
        canvasHeight: design?.canvasHeight ?? 1080,
        rubric: design?.rubric || undefined,
      };
    }
    case "coding":
      return {
        ...base,
        kind: "coding",
        text: text || q.title || "Coding challenge",
        codeTemplate: q.codeTemplate ?? "",
        language: q.language || "HTML",
        constraints: q.constraints || undefined,
        testCases: (q.testCases ?? [])
          .filter((tc) => tc.isSample === true)
          .map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation || undefined,
          })),
      };
    default:
      return null;
  }
}

function buildLeaderboard(battle: TopicBattle): DuelLeaderboardEntry[] {
  const entries: DuelLeaderboardEntry[] = [];
  const declared = battle.playersMax > 0 ? battle.playersMax : battle.playersJoined;
  const count = Math.min(8, Math.max(2, declared));
  const seed = battle.id.length;
  for (let i = 0; i < count; i += 1) {
    const points = 5000 - i * 700 + ((seed + i) % 400);
    if (i === 0) {
      entries.push({ rank: i + 1, name: "You", points, isCurrentUser: true });
    } else if (i === 1) {
      entries.push({
        rank: i + 1,
        name: battle.isOwner ? "Opponent" : battle.creator.name,
        points,
      });
    } else {
      entries.push({ rank: i + 1, name: `Player ${i + 1}`, points });
    }
  }
  return entries;
}

/** Resolve the full participant quiz for the given battle. */
export function buildDuelQuiz(battle: TopicBattle): DuelQuiz {
  const subject =
    battle.subject.trim() || battle.title.split(" ").slice(0, 2).join(" ") || "Topic Battle";

  const authored = (battle.questions ?? [])
    .map(toDuelQuestion)
    .filter((q): q is DuelQuestion => q !== null);

  return {
    battleId: battle.id,
    battleTitle: battle.title,
    questions: authored.length > 0 ? authored : pickDeck(subject),
    leaderboard: buildLeaderboard(battle),
  };
}
