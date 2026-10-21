import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Attempt, MockResult, ProgressState, Settings } from '../data/types';
import { clearProgress, defaultProgress, exportProgress, loadProgress, saveProgress } from './storage';

type Action =
  | { type: 'init'; state: ProgressState }
  | { type: 'markLearned'; topicId: string; learned: boolean }
  | { type: 'attempt'; attempt: Attempt }
  | { type: 'bookmark'; questionId: string }
  | { type: 'visit'; topicId: string; at: number }
  | { type: 'mock'; result: MockResult }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'reset' };

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case 'init':
      return action.state;
    case 'markLearned': {
      const set = new Set(state.learnedTopics);
      if (action.learned) set.add(action.topicId);
      else set.delete(action.topicId);
      return { ...state, learnedTopics: [...set] };
    }
    case 'attempt': {
      const a = action.attempt;
      const mistakes = new Set(state.mistakes);
      if (a.correct === false) mistakes.add(a.questionId);
      if (a.correct === true) mistakes.delete(a.questionId);
      return { ...state, attempts: [...state.attempts, a], mistakes: [...mistakes] };
    }
    case 'bookmark': {
      const set = new Set(state.bookmarks);
      if (set.has(action.questionId)) set.delete(action.questionId);
      else set.add(action.questionId);
      return { ...state, bookmarks: [...set] };
    }
    case 'visit': {
      const recent = state.recentTopics.filter((r) => r.topicId !== action.topicId);
      recent.unshift({ topicId: action.topicId, at: action.at });
      return { ...state, recentTopics: recent.slice(0, 12) };
    }
    case 'mock':
      return { ...state, mocks: [...state.mocks, action.result] };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'reset':
      return structuredClone(defaultProgress);
    default:
      return state;
  }
}

interface Store {
  state: ProgressState;
  markLearned: (topicId: string, learned: boolean) => void;
  recordAttempt: (attempt: Attempt) => void;
  toggleBookmark: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;
  visitTopic: (topicId: string) => void;
  addMock: (result: MockResult) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
  exportData: () => void;
}

const Ctx = createContext<Store | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadProgress());

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [state.settings.theme]);

  const markLearned = useCallback((topicId: string, learned: boolean) => dispatch({ type: 'markLearned', topicId, learned }), []);
  const recordAttempt = useCallback((attempt: Attempt) => dispatch({ type: 'attempt', attempt }), []);
  const toggleBookmark = useCallback((questionId: string) => dispatch({ type: 'bookmark', questionId }), []);
  const visitTopic = useCallback((topicId: string) => dispatch({ type: 'visit', topicId, at: Date.now() }), []);
  const addMock = useCallback((result: MockResult) => dispatch({ type: 'mock', result }), []);
  const updateSettings = useCallback((patch: Partial<Settings>) => dispatch({ type: 'settings', patch }), []);
  const resetProgress = useCallback(() => {
    clearProgress();
    dispatch({ type: 'reset' });
  }, []);
  const exportData = useCallback(() => exportProgress(state), [state]);

  const value = useMemo<Store>(
    () => ({
      state,
      markLearned,
      recordAttempt,
      toggleBookmark,
      isBookmarked: (id: string) => state.bookmarks.includes(id),
      visitTopic,
      addMock,
      updateSettings,
      resetProgress,
      exportData,
    }),
    [state, markLearned, recordAttempt, toggleBookmark, visitTopic, addMock, updateSettings, resetProgress, exportData]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
