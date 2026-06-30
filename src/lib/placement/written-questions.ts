import type { CefrLevel } from "@/lib/types/cefr";

export interface WrittenQuestion {
  id: string;
  level: CefrLevel;
  question: string;
  options: string[];
  correctIndex: number;
}

export const WRITTEN_PLACEMENT_QUESTIONS: WrittenQuestion[] = [
  {
    id: "a1-1",
    level: "A1",
    question: "Complete : I ___ a student.",
    options: ["am", "is", "are", "be"],
    correctIndex: 0,
  },
  {
    id: "a1-2",
    level: "A1",
    question: "What is the plural of child?",
    options: ["childs", "children", "childes", "childrens"],
    correctIndex: 1,
  },
  {
    id: "a2-1",
    level: "A2",
    question: "She ___ to London last year.",
    options: ["go", "goes", "went", "gone"],
    correctIndex: 2,
  },
  {
    id: "a2-2",
    level: "A2",
    question: "I don't have ___ money.",
    options: ["some", "any", "many", "muchly"],
    correctIndex: 1,
  },
  {
    id: "b1-1",
    level: "B1",
    question: "If I ___ more time, I would travel.",
    options: ["have", "had", "has", "having"],
    correctIndex: 1,
  },
  {
    id: "b1-2",
    level: "B1",
    question: "The meeting was cancelled ___ the rain.",
    options: ["because", "because of", "although", "despite of"],
    correctIndex: 1,
  },
  {
    id: "b2-1",
    level: "B2",
    question: "Hardly ___ the train left when it started raining.",
    options: ["had", "has", "did", "was"],
    correctIndex: 0,
  },
  {
    id: "b2-2",
    level: "B2",
    question: "She suggested ___ early.",
    options: ["leave", "to leave", "leaving", "left"],
    correctIndex: 2,
  },
  {
    id: "c1-1",
    level: "C1",
    question: "The proposal was met with ___ skepticism.",
    options: ["considerable", "considerably", "considering", "considered"],
    correctIndex: 0,
  },
  {
    id: "c1-2",
    level: "C1",
    question: "Not until later ___ how serious the issue was.",
    options: ["I realized", "did I realize", "I did realize", "realized I"],
    correctIndex: 1,
  },
];

const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export function levelToIndex(level: CefrLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

export function indexToLevel(index: number): CefrLevel {
  return LEVEL_ORDER[Math.max(0, Math.min(LEVEL_ORDER.length - 1, index))];
}

export function getQuestionsForLevel(level: CefrLevel): WrittenQuestion[] {
  const idx = levelToIndex(level);
  const levels = LEVEL_ORDER.filter((_, i) => Math.abs(i - idx) <= 1);
  return WRITTEN_PLACEMENT_QUESTIONS.filter((q) => levels.includes(q.level));
}

export function computeWrittenLevel(
  answers: { questionId: string; selectedIndex: number }[],
): { level: CefrLevel; score: number; total: number } {
  let difficultyIndex = 2;
  let score = 0;

  for (const answer of answers) {
    const question = WRITTEN_PLACEMENT_QUESTIONS.find(
      (q) => q.id === answer.questionId,
    );
    if (!question) continue;

    const correct = answer.selectedIndex === question.correctIndex;
    if (correct) {
      score++;
      difficultyIndex = Math.min(4, difficultyIndex + 1);
    } else {
      difficultyIndex = Math.max(0, difficultyIndex - 1);
    }
  }

  return {
    level: indexToLevel(difficultyIndex),
    score,
    total: answers.length,
  };
}
