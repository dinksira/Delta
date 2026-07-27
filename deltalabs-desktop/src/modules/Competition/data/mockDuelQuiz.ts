/**
 * mockDuelQuiz
 * Mock quiz data for topic battle duels.
 */

import type { DuelQuiz } from "@/modules/Competition/types/duelQuiz";

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_DUEL_QUIZ: Record<string, DuelQuiz> = {
  "tb-1": {
    battleId: "tb-1",
    battleTitle: "Calculus Showdown",
    questions: [
      {
        id: "q-1",
        text: "What is the derivative of x²?",
        options: ["x", "2x", "2", "x²"],
        correctIndex: 1,
      },
      {
        id: "q-2",
        text: "What is the integral of 1/x with respect to x?",
        options: ["ln|x| + C", "e^x + C", "1/x² + C", "x + C"],
        correctIndex: 0,
      },
      {
        id: "q-3",
        text: "What does the limit of (sin x)/x approach as x → 0?",
        options: ["0", "∞", "1", "undefined"],
        correctIndex: 2,
      },
      {
        id: "q-4",
        text: "Which rule is used to differentiate a product of two functions?",
        options: ["Chain rule", "Product rule", "Quotient rule", "Power rule"],
        correctIndex: 1,
      },
      {
        id: "q-5",
        text: "What is the second derivative of position with respect to time?",
        options: ["Velocity", "Acceleration", "Jerk", "Momentum"],
        correctIndex: 1,
      },
    ],
    leaderboard: [
      { rank: 1, name: "MathWizard", points: 4800, isCurrentUser: false },
      { rank: 2, name: "Dinksira Elsa", points: 4100, isCurrentUser: true },
      { rank: 3, name: "Yonas Ayele", points: 3600, isCurrentUser: false },
      { rank: 4, name: "Selam Tesfaye", points: 2900, isCurrentUser: false },
      { rank: 5, name: "Biruk Assefa", points: 2300, isCurrentUser: false },
    ],
  },
  "tb-2": {
    battleId: "tb-2",
    battleTitle: "Quantum Physics Duel",
    questions: [
      {
        id: "q-1",
        text: "Who is widely considered the father of modern physics?",
        options: [
          "Albert Einstein",
          "Isaac Newton",
          "Galileo Galilei",
          "Niels Bohr",
        ],
        correctIndex: 1,
      },
      {
        id: "q-2",
        text: "Which phenomenon describes the emission of electrons from a material when light shines on it?",
        options: [
          "Compton scattering",
          "Photoelectric effect",
          "Blackbody radiation",
          "Wave-particle duality",
        ],
        correctIndex: 1,
      },
      {
        id: "q-3",
        text: "What is the SI unit of electric current?",
        options: ["Volt", "Ampere", "Ohm", "Watt"],
        correctIndex: 1,
      },
      {
        id: "q-4",
        text: "Which law states that entropy of an isolated system always increases?",
        options: [
          "First law of thermodynamics",
          "Second law of thermodynamics",
          "Third law of thermodynamics",
          "Zeroth law of thermodynamics",
        ],
        correctIndex: 1,
      },
      {
        id: "q-5",
        text: "What particle is responsible for mediating the electromagnetic force?",
        options: ["Gluon", "W boson", "Photon", "Graviton"],
        correctIndex: 2,
      },
    ],
    leaderboard: [
      { rank: 1, name: "QuantumWiz", points: 5000, isCurrentUser: false },
      { rank: 2, name: "Dinksira Elsa", points: 4200, isCurrentUser: true },
      { rank: 3, name: "Leul Solomon", points: 3800, isCurrentUser: false },
      { rank: 4, name: "Meron Tadesse", points: 3100, isCurrentUser: false },
      { rank: 5, name: "Biruk Assefa", points: 2700, isCurrentUser: false },
      { rank: 6, name: "Hanna Wondimu", points: 2200, isCurrentUser: false },
      { rank: 7, name: "Yonas Ayele", points: 1800, isCurrentUser: false },
    ],
  },
  "tb-3": {
    battleId: "tb-3",
    battleTitle: "Chemical Equations Sprint",
    questions: [
      {
        id: "q-1",
        text: "What is the chemical symbol for potassium?",
        options: ["Po", "Pt", "K", "Ka"],
        correctIndex: 2,
      },
      {
        id: "q-2",
        text: "What is the pH of a neutral solution at 25°C?",
        options: ["0", "7", "14", "1"],
        correctIndex: 1,
      },
      {
        id: "q-3",
        text: "Which gas is produced when hydrochloric acid reacts with zinc?",
        options: ["Oxygen", "Hydrogen", "Chlorine", "Carbon dioxide"],
        correctIndex: 1,
      },
      {
        id: "q-4",
        text: "How many hydrogen atoms are in one molecule of water?",
        options: ["1", "2", "3", "4"],
        correctIndex: 1,
      },
      {
        id: "q-5",
        text: "What type of bond involves the sharing of electron pairs?",
        options: ["Ionic bond", "Metallic bond", "Covalent bond", "Hydrogen bond"],
        correctIndex: 2,
      },
    ],
    leaderboard: [
      { rank: 1, name: "ChemPro", points: 4700, isCurrentUser: false },
      { rank: 2, name: "Meron Tadesse", points: 4000, isCurrentUser: true },
      { rank: 3, name: "Hanna Wondimu", points: 3400, isCurrentUser: false },
      { rank: 4, name: "Leul Solomon", points: 2800, isCurrentUser: false },
      { rank: 5, name: "Yonas Ayele", points: 2100, isCurrentUser: false },
    ],
  },
  "tb-4": {
    battleId: "tb-4",
    battleTitle: "Ancient Civilizations Clash",
    questions: [
      {
        id: "q-1",
        text: "Which civilization built the Great Pyramid of Giza?",
        options: ["Roman", "Greek", "Egyptian", "Mesopotamian"],
        correctIndex: 2,
      },
      {
        id: "q-2",
        text: "What was the primary writing system of ancient Mesopotamia?",
        options: ["Hieroglyphics", "Cuneiform", "Linear A", "Sanskrit"],
        correctIndex: 1,
      },
      {
        id: "q-3",
        text: "Who was the first Emperor of unified China?",
        options: [
          "Confucius",
          "Qin Shi Huang",
          "Sun Tzu",
          "Genghis Khan",
        ],
        correctIndex: 1,
      },
      {
        id: "q-4",
        text: "Which ancient civilization is known for its advanced road system and Machu Picchu?",
        options: ["Aztec", "Maya", "Inca", "Olmec"],
        correctIndex: 2,
      },
      {
        id: "q-5",
        text: "What year did the Roman Empire fall?",
        options: ["376 AD", "410 AD", "476 AD", "500 AD"],
        correctIndex: 2,
      },
    ],
    leaderboard: [
      { rank: 1, name: "HistoryBuff", points: 4900, isCurrentUser: false },
      { rank: 2, name: "Biruk Assefa", points: 4300, isCurrentUser: true },
      { rank: 3, name: "Selam Tesfaye", points: 3700, isCurrentUser: false },
      { rank: 4, name: "Leul Solomon", points: 3000, isCurrentUser: false },
      { rank: 5, name: "Meron Tadesse", points: 2400, isCurrentUser: false },
      { rank: 6, name: "Yonas Ayele", points: 1900, isCurrentUser: false },
    ],
  },
  "tb-5": {
    battleId: "tb-5",
    battleTitle: "The Great Biology Quiz",
    questions: [
      {
        id: "q-1",
        text: "What is the basic unit of life?",
        options: ["Atom", "Molecule", "Cell", "Tissue"],
        correctIndex: 2,
      },
      {
        id: "q-2",
        text: "Which organ is responsible for pumping blood in the human body?",
        options: ["Lungs", "Brain", "Heart", "Liver"],
        correctIndex: 2,
      },
      {
        id: "q-3",
        text: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
        correctIndex: 2,
      },
      {
        id: "q-4",
        text: "How many chromosomes do humans have?",
        options: ["23", "44", "46", "48"],
        correctIndex: 2,
      },
      {
        id: "q-5",
        text: "What process do plants use to convert sunlight into energy?",
        options: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"],
        correctIndex: 1,
      },
    ],
    leaderboard: [
      { rank: 1, name: "BioNinja", points: 4600, isCurrentUser: false },
      { rank: 2, name: "Hanna Wondimu", points: 3900, isCurrentUser: true },
      { rank: 3, name: "Meron Tadesse", points: 3300, isCurrentUser: false },
      { rank: 4, name: "Dinksira Elsa", points: 2600, isCurrentUser: false },
      { rank: 5, name: "Biruk Assefa", points: 2000, isCurrentUser: false },
    ],
  },
  "tb-6": {
    battleId: "tb-6",
    battleTitle: "Algebra Speed Run",
    questions: [
      {
        id: "q-1",
        text: "Solve for x: 2x + 6 = 14",
        options: ["3", "4", "5", "6"],
        correctIndex: 1,
      },
      {
        id: "q-2",
        text: "What is the slope of the line y = 3x + 5?",
        options: ["3", "5", "-3", "0"],
        correctIndex: 0,
      },
      {
        id: "q-3",
        text: "Factor x² - 9",
        options: [
          "(x - 3)(x + 3)",
          "(x - 3)²",
          "(x + 3)²",
          "(x - 9)(x + 1)",
        ],
        correctIndex: 0,
      },
      {
        id: "q-4",
        text: "What is the y-intercept of y = -2x + 7?",
        options: ["-2", "2", "7", "-7"],
        correctIndex: 2,
      },
      {
        id: "q-5",
        text: "If f(x) = x² + 2x, what is f(3)?",
        options: ["9", "12", "15", "18"],
        correctIndex: 2,
      },
    ],
    leaderboard: [
      { rank: 1, name: "AlgebraKing", points: 5000, isCurrentUser: false },
      { rank: 2, name: "Yonas Ayele", points: 4400, isCurrentUser: true },
      { rank: 3, name: "Dinksira Elsa", points: 3800, isCurrentUser: false },
      { rank: 4, name: "Selam Tesfaye", points: 3100, isCurrentUser: false },
      { rank: 5, name: "Biruk Assefa", points: 2500, isCurrentUser: false },
    ],
  },
  "tb-7": {
    battleId: "tb-7",
    battleTitle: "World War II Challenge",
    questions: [
      {
        id: "q-1",
        text: "What year did World War II begin?",
        options: ["1937", "1938", "1939", "1940"],
        correctIndex: 2,
      },
      {
        id: "q-2",
        text: "Which country was invaded first by Germany in WWII?",
        options: ["France", "Belgium", "Poland", "Netherlands"],
        correctIndex: 2,
      },
      {
        id: "q-3",
        text: "What was the name of the Allied invasion of Normandy?",
        options: ["Operation Barbarossa", "Operation Overlord", "Operation Torch", "Market Garden"],
        correctIndex: 1,
      },
      {
        id: "q-4",
        text: "Which two cities were atomic bombs dropped on?",
        options: ["Tokyo and Osaka", "Hiroshima and Nagasaki", "Kyoto and Kobe", "Yokohama and Sapporo"],
        correctIndex: 1,
      },
      {
        id: "q-5",
        text: "Who was the leader of Nazi Germany?",
        options: ["Hermann Göring", "Joseph Goebbels", "Adolf Hitler", "Heinrich Himmler"],
        correctIndex: 2,
      },
    ],
    leaderboard: [
      { rank: 1, name: "WarHistorian", points: 5100, isCurrentUser: false },
      { rank: 2, name: "Selam Tesfaye", points: 4500, isCurrentUser: true },
      { rank: 3, name: "Biruk Assefa", points: 3900, isCurrentUser: false },
      { rank: 4, name: "Leul Solomon", points: 3200, isCurrentUser: false },
      { rank: 5, name: "Hanna Wondimu", points: 2600, isCurrentUser: false },
      { rank: 6, name: "Yonas Ayele", points: 2000, isCurrentUser: false },
    ],
  },
  "tb-8": {
    battleId: "tb-8",
    battleTitle: "Physics Laws Challenge",
    questions: [
      {
        id: "q-1",
        text: "What is Newton's First Law also known as?",
        options: ["Law of Acceleration", "Law of Inertia", "Law of Action-Reaction", "Law of Gravity"],
        correctIndex: 1,
      },
      {
        id: "q-2",
        text: "What is the formula for force?",
        options: ["F = m/a", "F = ma", "F = mv", "F = m + a"],
        correctIndex: 1,
      },
      {
        id: "q-3",
        text: "What is the acceleration due to gravity on Earth?",
        options: ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "7.8 m/s²"],
        correctIndex: 1,
      },
      {
        id: "q-4",
        text: "Which law states that energy cannot be created or destroyed?",
        options: [
          "Law of Conservation of Mass",
          "Law of Conservation of Energy",
          "Newton's Third Law",
          "Ohm's Law",
        ],
        correctIndex: 1,
      },
      {
        id: "q-5",
        text: "What is the SI unit of power?",
        options: ["Joule", "Newton", "Watt", "Volt"],
        correctIndex: 2,
      },
    ],
    leaderboard: [
      { rank: 1, name: "PhysicsPro", points: 4900, isCurrentUser: false },
      { rank: 2, name: "Dinksira Elsa", points: 4100, isCurrentUser: true },
      { rank: 3, name: "Leul Solomon", points: 3500, isCurrentUser: false },
      { rank: 4, name: "Meron Tadesse", points: 2800, isCurrentUser: false },
      { rank: 5, name: "Selam Tesfaye", points: 2200, isCurrentUser: false },
    ],
  },
};

export function getDuelQuiz(battleId: string): DuelQuiz | undefined {
  const existing = MOCK_DUEL_QUIZ[battleId];
  if (existing) return existing;

  // Generate fallback quiz data for API-created battles
  const id = battleId.replace(/^tb_/, "tb-");
  const fromMock = MOCK_DUEL_QUIZ[id];
  if (fromMock) return fromMock;

  return {
    battleId,
    battleTitle: "Topic Battle",
    questions: [
      { id: "fq-1", text: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correctIndex: 1 },
      { id: "fq-2", text: "What is 2 + 2?", options: ["3", "4", "5", "6"], correctIndex: 1 },
      { id: "fq-3", text: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctIndex: 2 },
      { id: "fq-4", text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
      { id: "fq-5", text: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Hemingway", "Shakespeare", "Austen"], correctIndex: 2 },
    ],
    leaderboard: [
      { rank: 1, name: "You", points: 0, isCurrentUser: true },
      { rank: 2, name: "Opponent", points: 0 },
    ],
  };
}
