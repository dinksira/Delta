/**
 * duelQuiz data
 * Curated MCQ decks for topic battle duels, keyed by subject keyword, plus a
 * deterministic `buildDuelQuiz` that picks a matching deck for a TopicBattle
 * (falling back to a general-knowledge deck) and derives a mock leaderboard.
 */

import type { DuelLeaderboardEntry, DuelQuestion, DuelQuiz } from "@/modules/Competition/types/duelQuiz";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";

interface SubjectDeck {
  keywords: string[];
  questions: DuelQuestion[];
}

const SUBJECT_DECKS: SubjectDeck[] = [
  {
    keywords: ["math", "calculus", "algebra", "geometry", "arithmetic"],
    questions: [
      { id: "q-1", text: "What is the derivative of x²?", options: ["x", "2x", "2", "x²"], correctIndex: 1 },
      { id: "q-2", text: "Solve for x: 2x + 6 = 14", options: ["3", "4", "5", "6"], correctIndex: 1 },
      { id: "q-3", text: "Factor x² − 9", options: ["(x − 3)(x + 3)", "(x − 3)²", "(x + 3)²", "(x − 9)(x + 1)"], correctIndex: 0 },
      { id: "q-4", text: "What is the slope of the line y = 3x + 5?", options: ["3", "5", "−3", "0"], correctIndex: 0 },
      { id: "q-5", text: "If f(x) = x² + 2x, what is f(3)?", options: ["9", "12", "15", "18"], correctIndex: 2 },
    ],
  },
  {
    keywords: ["physics"],
    questions: [
      { id: "q-1", text: "Which phenomenon describes electrons emitted from a material when light shines on it?", options: ["Compton scattering", "Photoelectric effect", "Blackbody radiation", "Wave-particle duality"], correctIndex: 1 },
      { id: "q-2", text: "What is the SI unit of electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correctIndex: 1 },
      { id: "q-3", text: "What is the acceleration due to gravity on Earth?", options: ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "7.8 m/s²"], correctIndex: 1 },
      { id: "q-4", text: "What is the formula for force?", options: ["F = m/a", "F = ma", "F = mv", "F = m + a"], correctIndex: 1 },
      { id: "q-5", text: "What is the SI unit of power?", options: ["Joule", "Newton", "Watt", "Volt"], correctIndex: 2 },
    ],
  },
  {
    keywords: ["chemistry", "chemical"],
    questions: [
      { id: "q-1", text: "What is the chemical symbol for potassium?", options: ["Po", "Pt", "K", "Ka"], correctIndex: 2 },
      { id: "q-2", text: "What is the pH of a neutral solution at 25°C?", options: ["0", "7", "14", "1"], correctIndex: 1 },
      { id: "q-3", text: "How many hydrogen atoms are in one molecule of water?", options: ["1", "2", "3", "4"], correctIndex: 1 },
      { id: "q-4", text: "What type of bond involves the sharing of electron pairs?", options: ["Ionic bond", "Metallic bond", "Covalent bond", "Hydrogen bond"], correctIndex: 2 },
      { id: "q-5", text: "Which gas is produced when hydrochloric acid reacts with zinc?", options: ["Oxygen", "Hydrogen", "Chlorine", "Carbon dioxide"], correctIndex: 1 },
    ],
  },
  {
    keywords: ["biology", "bio", "life science"],
    questions: [
      { id: "q-1", text: "What is the basic unit of life?", options: ["Atom", "Molecule", "Cell", "Tissue"], correctIndex: 2 },
      { id: "q-2", text: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"], correctIndex: 2 },
      { id: "q-3", text: "How many chromosomes do humans have?", options: ["23", "44", "46", "48"], correctIndex: 2 },
      { id: "q-4", text: "Which organ is responsible for pumping blood?", options: ["Lungs", "Brain", "Heart", "Liver"], correctIndex: 2 },
      { id: "q-5", text: "What process do plants use to convert sunlight into energy?", options: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"], correctIndex: 1 },
    ],
  },
  {
    keywords: ["english", "language", "literature", "grammar"],
    questions: [
      { id: "q-1", text: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "Ernest Hemingway", "William Shakespeare", "Jane Austen"], correctIndex: 2 },
      { id: "q-2", text: "What is the antonym of 'benevolent'?", options: ["Kind", "Generous", "Hostile", "Charitable"], correctIndex: 2 },
      { id: "q-3", text: "Identify the verb in: 'The quick fox jumps over the dog.'", options: ["quick", "fox", "jumps", "dog"], correctIndex: 2 },
      { id: "q-4", text: "Which sentence uses the correct punctuation?", options: ["Lets eat, Grandma!", "Let's eat, Grandma!", "Lets eat Grandma!", "Let's eat Grandma!"], correctIndex: 1 },
      { id: "q-5", text: "What is a synonym for 'arduous'?", options: ["Easy", "Difficult", "Swift", "Fragile"], correctIndex: 1 },
    ],
  },
  {
    keywords: ["history", "ancient", "civilization"],
    questions: [
      { id: "q-1", text: "Which civilization built the Great Pyramid of Giza?", options: ["Roman", "Greek", "Egyptian", "Mesopotamian"], correctIndex: 2 },
      { id: "q-2", text: "What year did World War II begin?", options: ["1937", "1938", "1939", "1940"], correctIndex: 2 },
      { id: "q-3", text: "What was the name of the Allied invasion of Normandy?", options: ["Operation Barbarossa", "Operation Overlord", "Operation Torch", "Market Garden"], correctIndex: 1 },
      { id: "q-4", text: "Who was the first Emperor of unified China?", options: ["Confucius", "Qin Shi Huang", "Sun Tzu", "Genghis Khan"], correctIndex: 1 },
      { id: "q-5", text: "Which two cities were atomic bombs dropped on?", options: ["Tokyo and Osaka", "Hiroshima and Nagasaki", "Kyoto and Kobe", "Yokohama and Sapporo"], correctIndex: 1 },
    ],
  },
  {
    keywords: ["ai", "artificial intelligence", "machine learning"],
    questions: [
      { id: "q-1", text: "What does 'AI' stand for?", options: ["Automated Integration", "Artificial Intelligence", "Advanced Interface", "Analytic Inference"], correctIndex: 1 },
      { id: "q-2", text: "Which algorithm is commonly used for supervised classification?", options: ["K-means clustering", "Linear regression", "Decision tree", "Apriori"], correctIndex: 2 },
      { id: "q-3", text: "What is the output layer of a neural network responsible for?", options: ["Feeding inputs", "Adjusting weights", "Producing predictions", "Normalizing data"], correctIndex: 2 },
      { id: "q-4", text: "Which term describes teaching a model using labeled data?", options: ["Unsupervised learning", "Supervised learning", "Reinforcement learning", "Transfer learning"], correctIndex: 1 },
      { id: "q-5", text: "What is overfitting in machine learning?", options: ["Model fails to train", "Model learns noise too well", "Model is too small", "Data is unbalanced"], correctIndex: 1 },
    ],
  },
  {
    keywords: ["javascript", "typescript", "programming", "computer", "web", "coding"],
    questions: [
      { id: "q-1", text: "Which keyword declares a constant variable in JavaScript?", options: ["var", "let", "const", "static"], correctIndex: 2 },
      { id: "q-2", text: "What does 'DOM' stand for?", options: ["Document Object Model", "Data Object Method", "Digital Output Manager", "Dynamic Order Module"], correctIndex: 0 },
      { id: "q-3", text: "Which method adds an element to the end of an array?", options: ["push()", "pop()", "shift()", "unshift()"], correctIndex: 0 },
      { id: "q-4", text: "What type is the result of `typeof null` in JavaScript?", options: ["null", "undefined", "object", "number"], correctIndex: 2 },
      { id: "q-5", text: "Which operator checks both value and type?", options: ["==", "=", "===", "=>"], correctIndex: 2 },
    ],
  },
];

const FALLBACK_QUESTIONS: DuelQuestion[] = [
  { id: "fq-1", text: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correctIndex: 1 },
  { id: "fq-2", text: "What is 2 + 2?", options: ["3", "4", "5", "6"], correctIndex: 1 },
  { id: "fq-3", text: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctIndex: 2 },
  { id: "fq-4", text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
  { id: "fq-5", text: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Hemingway", "Shakespeare", "Austen"], correctIndex: 2 },
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

function buildLeaderboard(battle: TopicBattle): DuelLeaderboardEntry[] {
  const entries: DuelLeaderboardEntry[] = [];
  const count = Math.min(6, Math.max(2, battle.playersJoined));
  const seed = battle.id.length;
  for (let i = 0; i < count; i += 1) {
    const points = 5000 - i * 700 + ((seed + i) % 400);
    if (i === 0) {
      entries.push({ rank: i + 1, name: "You", points, isCurrentUser: true });
    } else if (i === 1) {
      entries.push({ rank: i + 1, name: battle.isOwner ? "Opponent" : battle.creator.name, points });
    } else {
      entries.push({ rank: i + 1, name: `Player ${i + 1}`, points });
    }
  }
  return entries;
}

/** Resolve a full quiz (curated deck or fallback) for the given battle. */
export function buildDuelQuiz(battle: TopicBattle): DuelQuiz {
  const subject =
    battle.subject.trim() ||
    battle.title.split(" ").slice(0, 2).join(" ") ||
    "Topic Battle";

  return {
    battleId: battle.id,
    battleTitle: battle.title,
    questions: pickDeck(subject),
    leaderboard: buildLeaderboard(battle),
  };
}
