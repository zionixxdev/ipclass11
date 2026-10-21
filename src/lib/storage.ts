import type { ProgressState, Settings } from '../data/types';

export const PROGRESS_KEY = 'ipprep11.progress.v1';
const KEY = PROGRESS_KEY;
// Progress saved under the app's earlier name is still read, so anyone who used
// the site before the rename keeps their data.
const LEGACY_KEY = 'compprep11.progress.v1';

export const defaultSettings: Settings = {
  theme: 'dark',
  examDate: '',
  name: '',
  timedDefaultSec: 600,
  laMarks: 5,
  showHinglish: true,
};

export const defaultProgress: ProgressState = {
  learnedTopics: [],
  attempts: [],
  bookmarks: [],
  mistakes: [],
  mocks: [],
  recentTopics: [],
  settings: defaultSettings,
};

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return structuredClone(defaultProgress);
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...structuredClone(defaultProgress),
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(defaultProgress);
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function exportProgress(state: ProgressState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ipprep11-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
