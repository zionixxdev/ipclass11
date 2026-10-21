import type { Question } from '../data/types';

/** Fisher–Yates shuffle on a copy. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Normalise free text for tolerant comparison. */
export function normalize(s: string): string {
  return (s ?? '')
    .toString()
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim()
    .replace(/\s+$/gm, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Check an objective answer.
 * Returns true/false, or null when the question needs self-evaluation
 * (descriptive / program / debug / case).
 * `given` shapes: mcq & assertion -> number index; truefalse/fillblank/output/numerical -> string;
 * match -> Record<leftIndex, rightIndex>.
 */
export function checkObjective(q: Question, given: unknown): boolean | null {
  switch (q.type) {
    case 'mcq':
    case 'assertion': {
      if (typeof given !== 'number') return null;
      return given === q.correctAnswer;
    }
    case 'truefalse':
    case 'output':
    case 'numerical': {
      if (typeof given !== 'string') return null;
      const expected = normalize(String(q.correctAnswer));
      const got = normalize(given);
      if (got === expected) return true;
      // For numeric answers accept numerically-equal values.
      if (q.type === 'numerical') {
        const a = Number(got.replace(/[^0-9.\-]/g, ''));
        const b = Number(expected.replace(/[^0-9.\-]/g, ''));
        if (!isNaN(a) && !isNaN(b) && a === b) return true;
      }
      return false;
    }
    case 'fillblank': {
      if (typeof given !== 'string') return null;
      const got = normalize(given);
      if (!got) return false;
      const accepted = [String(q.correctAnswer), ...(q.acceptedAnswers || [])].map(normalize);
      return accepted.includes(got);
    }
    case 'match': {
      if (typeof given !== 'object' || given === null) return null;
      const map = given as Record<string, number>;
      const pairs = q.matchPairs || [];
      return pairs.every((_, i) => map[String(i)] === i);
    }
    default:
      return null; // vsa, sa, la, program, debug, case -> self-evaluated
  }
}

/** Does this question type auto-score? */
export function isAutoScored(q: Question): boolean {
  return ['mcq', 'assertion', 'truefalse', 'fillblank', 'match', 'output', 'numerical'].includes(q.type);
}

/** Short human-readable rendering of a given answer, for review screens. */
export function describeGiven(q: Question, given: unknown): string {
  if (given == null || given === '') return 'Not answered';
  if (q.type === 'mcq' || q.type === 'assertion') {
    if (typeof given !== 'number' || !q.options) return String(given);
    return `${OPTION_LETTERS[given]}. ${q.options[given]}`;
  }
  if (q.type === 'match') {
    const map = (given as Record<string, number>) || {};
    const pairs = q.matchPairs || [];
    return pairs.map((p, i) => `${p.left} → ${map[String(i)] != null ? pairs[map[String(i)]].right : '—'}`).join('; ');
  }
  return String(given);
}

/** Human-readable correct answer for review screens. */
export function describeCorrect(q: Question): string {
  if (q.type === 'mcq' || q.type === 'assertion') {
    const idx = typeof q.correctAnswer === 'number' ? q.correctAnswer : -1;
    return q.options && idx >= 0 ? `${OPTION_LETTERS[idx]}. ${q.options[idx]}` : '—';
  }
  if (q.type === 'match') {
    return (q.matchPairs || []).map((p) => `${p.left} → ${p.right}`).join('; ');
  }
  return String(q.correctAnswer ?? q.modelAnswer ?? '—');
}

/** Score a case-based question: returns correct sub-answers out of total. */
export function scoreCase(q: Question, answers: (string | number)[]): { correct: number; total: number } {
  const subs = q.caseStudy?.subQuestions || [];
  let correct = 0;
  subs.forEach((s, i) => {
    const given = answers[i];
    if (given == null || given === '') return;
    if (s.kind === 'mcq') {
      if (typeof given === 'number' && s.options && s.options[given] === s.answer) correct++;
    } else {
      // short answer: self-evaluated, count as attempted-correct only if the
      // student's text shares a meaningful keyword with the model answer.
      const norm = normalize(String(given));
      const model = normalize(s.answer);
      const words = model.split(' ').filter((w) => w.length > 4);
      if (words.some((w) => norm.includes(w))) correct++;
    }
  });
  return { correct, total: subs.length };
}
