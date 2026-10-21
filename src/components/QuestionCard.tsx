import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, Eye, Lightbulb, XCircle } from 'lucide-react';
import type { Question } from '../data/types';
import { QUESTION_TYPE_LABELS } from '../data/types';
import { checkObjective, describeCorrect, OPTION_LETTERS, shuffle } from '../lib/quiz';
import { cn } from '../lib/utils';
import { CodeBlock } from './CodeBlock';
import { DifficultyBadge } from './ui';

export interface QuestionCardProps {
  q: Question;
  index?: number;
  total?: number;
  answer: any;
  onAnswer: (v: any) => void;
  revealed: boolean;
  bookmark?: boolean;
  onBookmark?: () => void;
  onSelfMark?: (correct: boolean) => void;
  selfMark?: boolean | null;
  showMeta?: boolean;
}

function Meta({ q, index, total, bookmark, onBookmark }: Pick<QuestionCardProps, 'q' | 'index' | 'total' | 'bookmark' | 'onBookmark' | 'showMeta'>) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {index != null && total != null && (
        <span className="chip !bg-brand-500/15 !text-brand-200">
          Q{index + 1} / {total}
        </span>
      )}
      <span className="chip">{QUESTION_TYPE_LABELS[q.type]}</span>
      <DifficultyBadge difficulty={q.difficulty} />
      <span className="chip">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
      <span className="chip capitalize">{q.chapterId.replace('ch', 'Chapter ')}</span>
      <div className="ml-auto">
        {onBookmark && (
          <button onClick={onBookmark} className={cn('btn-ghost !px-2.5 !py-1.5', bookmark && '!text-amber-300')} aria-label="Bookmark question">
            {bookmark ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function OptionButton({ label, text, state, onClick, disabled }: { label: string; text: string; state: 'idle' | 'selected' | 'correct' | 'wrong'; onClick: () => void; disabled?: boolean }) {
  const styles: Record<string, string> = {
    idle: 'border-white/10 bg-white/5 hover:bg-white/10',
    selected: 'border-brand-400 bg-brand-500/15',
    correct: 'border-emerald-400 bg-emerald-500/15',
    wrong: 'border-rose-400 bg-rose-500/15',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition', styles[state], disabled && 'cursor-default')}
    >
      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-bold', state === 'correct' ? 'border-emerald-400 text-emerald-300' : state === 'wrong' ? 'border-rose-400 text-rose-300' : 'border-white/20 text-slate-300')}>
        {label}
      </span>
      <span className="pt-0.5 text-slate-200">{text}</span>
    </button>
  );
}

function Feedback({ q, given }: { q: Question; given: any }) {
  const correct = checkObjective(q, given);
  if (correct === null) return null;
  return (
    <div className={cn('mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold', correct ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/30 bg-rose-500/10 text-rose-300')}>
      {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {correct ? 'Correct' : 'Incorrect'}
    </div>
  );
}

export function QuestionCard(props: QuestionCardProps) {
  const { q, answer, onAnswer, revealed, showMeta = true } = props;
  const [hintOpen, setHintOpen] = useState(false);

  const matchOrder = useMemo(() => {
    if (q.type !== 'match') return [];
    return shuffle((q.matchPairs || []).map((_, i) => i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  const caseAnswers: any[] = Array.isArray(answer) ? answer : [];

  const renderInput = () => {
    switch (q.type) {
      case 'mcq':
      case 'assertion': {
        const chosen = typeof answer === 'number' ? answer : -1;
        return (
          <div className="space-y-4">
            {q.type === 'assertion' && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <p><span className="font-bold text-brand-300">Assertion (A): </span><span className="text-slate-200">{q.assertion}</span></p>
                <p><span className="font-bold text-brand-300">Reason (R): </span><span className="text-slate-200">{q.reason}</span></p>
              </div>
            )}
            <div className="space-y-2">
              {(q.options || []).map((opt, i) => {
                let state: 'idle' | 'selected' | 'correct' | 'wrong' = chosen === i ? 'selected' : 'idle';
                if (revealed) {
                  if (i === q.correctAnswer) state = 'correct';
                  else if (chosen === i) state = 'wrong';
                  else state = 'idle';
                }
                return <OptionButton key={i} label={OPTION_LETTERS[i]} text={opt} state={state} onClick={() => !revealed && onAnswer(i)} disabled={revealed} />;
              })}
            </div>
          </div>
        );
      }
      case 'truefalse': {
        const chosen = typeof answer === 'string' ? answer : '';
        return (
          <div className="flex gap-3">
            {['True', 'False'].map((v) => {
              let state: 'idle' | 'selected' | 'correct' | 'wrong' = chosen === v ? 'selected' : 'idle';
              if (revealed) {
                if (String(q.correctAnswer) === v) state = 'correct';
                else if (chosen === v) state = 'wrong';
                else state = 'idle';
              }
              return (
                <button key={v} onClick={() => !revealed && onAnswer(v)} disabled={revealed} className={cn('flex-1 rounded-xl border p-3 text-sm font-semibold transition', state === 'correct' ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : state === 'wrong' ? 'border-rose-400 bg-rose-500/15 text-rose-200' : state === 'selected' ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10')}>
                  {v}
                </button>
              );
            })}
          </div>
        );
      }
      case 'fillblank':
      case 'numerical': {
        const val = typeof answer === 'string' ? answer : '';
        const correct = revealed ? checkObjective(q, val) : null;
        return (
          <input
            className={cn('input', revealed && (correct ? '!border-emerald-400' : '!border-rose-400'))}
            placeholder={q.type === 'numerical' ? `Your answer${q.unit ? ' (' + q.unit + ')' : ''}…` : 'Type the missing word / term…'}
            value={val}
            disabled={revealed}
            onChange={(e) => onAnswer(e.target.value)}
          />
        );
      }
      case 'match': {
        const map: Record<string, number> = (answer && typeof answer === 'object') ? answer : {};
        return (
          <div className="space-y-2">
            {(q.matchPairs || []).map((pair, i) => {
              const chosen = map[String(i)];
              const isRight = revealed && chosen === i;
              return (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="min-w-0 flex-1 text-sm text-slate-200">{pair.left}</span>
                  <span className="text-slate-500">→</span>
                  <select
                    className={cn('input max-w-[52%] !py-1.5 text-sm', revealed && (isRight ? '!border-emerald-400' : '!border-rose-400'))}
                    value={chosen != null ? String(chosen) : ''}
                    disabled={revealed}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value);
                      const next = { ...map };
                      if (v == null) delete next[String(i)];
                      else next[String(i)] = v;
                      onAnswer(next);
                    }}
                  >
                    <option value="">Select…</option>
                    {matchOrder.map((ri) => (
                      <option key={ri} value={ri}>
                        {(q.matchPairs || [])[ri].right}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        );
      }
      case 'output': {
        const val = typeof answer === 'string' ? answer : '';
        return (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Predicted output</p>
            <textarea
              className="code-block min-h-[90px] w-full resize-y !text-slate-100"
              placeholder="Type the exact output, line by line…"
              value={val}
              disabled={revealed}
              onChange={(e) => onAnswer(e.target.value)}
            />
          </div>
        );
      }
      case 'debug': {
        const val = typeof answer === 'string' ? answer : '';
        return (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Corrected code</p>
            <textarea
              className="code-block min-h-[110px] w-full resize-y !text-slate-100"
              placeholder="Rewrite the code with the error fixed…"
              value={val}
              disabled={revealed}
              onChange={(e) => onAnswer(e.target.value)}
            />
          </div>
        );
      }
      case 'program': {
        const val = typeof answer === 'string' ? answer : '';
        return (
          <div className="space-y-3">
            {q.hints && q.hints.length > 0 && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/5">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-amber-200" onClick={() => setHintOpen((v) => !v)}>
                  <Lightbulb size={15} /> Hints {hintOpen ? '(hide)' : '(reveal gradually)'}
                  <ChevronDown size={15} className={cn('ml-auto transition', hintOpen && 'rotate-180')} />
                </button>
                {hintOpen && (
                  <ol className="list-decimal space-y-1 px-6 pb-3 text-sm text-amber-100/90">
                    {q.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
            <textarea
              className="code-block min-h-[150px] w-full resize-y !text-slate-100"
              placeholder="Write your Python program here…"
              value={val}
              disabled={revealed}
              onChange={(e) => onAnswer(e.target.value)}
            />
          </div>
        );
      }
      case 'case': {
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{q.caseStudy?.passage}</div>
            {q.caseStudy?.table && (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>{q.caseStudy.table.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {q.caseStudy.table.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-white/5">
                        {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-300">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(q.caseStudy?.subQuestions || []).map((s, i) => {
              const val = caseAnswers[i];
              const isMcq = s.kind === 'mcq';
              const chosenIdx = typeof val === 'number' ? val : -1;
              const correctIdx = isMcq && s.options ? s.options.indexOf(s.answer) : -1;
              return (
                <div key={i} className="rounded-xl border border-white/10 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-200">
                    <span className="text-brand-300">({String.fromCharCode(97 + i)})</span> {s.question}{' '}
                    <span className="text-xs text-slate-500">[{s.marks} mark{s.marks === 1 ? '' : 's'}]</span>
                  </p>
                  {isMcq ? (
                    <div className="space-y-2">
                      {(s.options || []).map((opt, oi) => {
                        let state: 'idle' | 'selected' | 'correct' | 'wrong' = chosenIdx === oi ? 'selected' : 'idle';
                        if (revealed) {
                          if (oi === correctIdx) state = 'correct';
                          else if (chosenIdx === oi) state = 'wrong';
                          else state = 'idle';
                        }
                        return (
                          <OptionButton
                            key={oi}
                            label={OPTION_LETTERS[oi]}
                            text={opt}
                            state={state}
                            disabled={revealed}
                            onClick={() => {
                              const next = [...caseAnswers];
                              next[i] = oi;
                              onAnswer(next);
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      className="input min-h-[70px] resize-y"
                      placeholder="Your answer…"
                      value={typeof val === 'string' ? val : ''}
                      disabled={revealed}
                      onChange={(e) => {
                        const next = [...caseAnswers];
                        next[i] = e.target.value;
                        onAnswer(next);
                      }}
                    />
                  )}
                  {revealed && (
                    <p className="mt-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
                      <span className="font-semibold">Answer: </span>{s.answer} — {s.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      default: {
        // vsa, sa, la — descriptive
        const val = typeof answer === 'string' ? answer : '';
        return (
          <textarea
            className="input min-h-[110px] resize-y"
            placeholder="Write your answer…"
            value={val}
            disabled={revealed}
            onChange={(e) => onAnswer(e.target.value)}
          />
        );
      }
    }
  };

  const isDescriptive = ['vsa', 'sa', 'la', 'program', 'debug', 'case'].includes(q.type);

  return (
    <div className="card p-4 sm:p-5">
      {showMeta && <Meta {...props} />}

      <div className="mb-3 text-[15px] font-medium leading-relaxed text-slate-100 whitespace-pre-wrap">{q.question}</div>

      {q.code && q.type !== 'output' && q.type !== 'debug' && <CodeBlock code={q.code} className="mb-3" />}
      {q.code && (q.type === 'output' || q.type === 'debug') && <CodeBlock code={q.code} className="mb-3" />}

      {renderInput()}

      {revealed && !isDescriptive && <Feedback q={q} given={answer} />}

      {revealed && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {!isDescriptive && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-sm">
              <span className="font-semibold text-emerald-300">Correct answer: </span>
              <span className="text-slate-200">{describeCorrect(q)}</span>
            </div>
          )}

          {q.type === 'debug' && q.correctAnswer && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Corrected code</p>
              <CodeBlock code={String(q.correctAnswer)} />
            </div>
          )}
          {q.type === 'debug' && q.errorType && (
            <p className="text-sm text-amber-200"><AlertTriangle size={13} className="mr-1 inline" /> Error type: <span className="font-semibold capitalize">{q.errorType}</span></p>
          )}

          {(q.type === 'vsa' || q.type === 'sa' || q.type === 'la' || q.type === 'case') && q.modelAnswer && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">Model answer</p>
              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{q.modelAnswer}</p>
            </div>
          )}

          {q.type === 'program' && q.modelSolution && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">Model solution</p>
              <CodeBlock code={q.modelSolution} />
            </div>
          )}

          {q.lineExplanations && q.lineExplanations.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Line-by-line explanation</p>
              <ul className="space-y-1 text-sm text-slate-300">
                {q.lineExplanations.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <code className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-brand-200">{l.line}</code>
                    <span className="text-slate-400">{l.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {q.testCases && q.testCases.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Test cases</p>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-300"><tr><th className="px-3 py-2 text-left">Input</th><th className="px-3 py-2 text-left">Expected output</th></tr></thead>
                  <tbody>
                    {q.testCases.map((t, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="px-3 py-2 font-mono text-xs text-slate-300">{t.input}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-300 whitespace-pre-wrap">{t.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {q.executionSteps && q.executionSteps.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Step-by-step execution</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
                {q.executionSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-300">
              <Eye size={13} /> Explanation
            </p>
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{q.explanation}</p>
          </div>

          {q.optionExplanations && q.optionExplanations.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Why each option</p>
              <ul className="space-y-1 text-sm">
                {q.optionExplanations.map((e, i) => (
                  <li key={i} className={cn('flex gap-2', i === q.correctAnswer ? 'text-emerald-300' : 'text-slate-400')}>
                    <span className="font-bold">{OPTION_LETTERS[i]}.</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {q.type === 'truefalse' && q.correction && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200"><span className="font-semibold">Correction: </span>{q.correction}</p>
          )}

          {(q.rubric || q.keywords) && (
            <div className="flex flex-wrap gap-2">
              {(q.rubric || q.keywords || []).map((k, i) => (
                <span key={i} className="chip">{k}</span>
              ))}
            </div>
          )}

          {isDescriptive && props.onSelfMark && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-sm text-slate-300">Did you get it right? (self-evaluate)</span>
              <button className={cn('btn !py-1.5', props.selfMark === true ? 'bg-emerald-600 text-white' : 'btn-ghost')} onClick={() => props.onSelfMark?.(true)}>
                <CheckCircle2 size={15} /> Yes
              </button>
              <button className={cn('btn !py-1.5', props.selfMark === false ? 'bg-rose-600 text-white' : 'btn-ghost')} onClick={() => props.onSelfMark?.(false)}>
                <XCircle size={15} /> No
              </button>
            </div>
          )}

          {q.relatedConcepts && q.relatedConcepts.length > 0 && (
            <p className="text-xs text-slate-500">Related: {q.relatedConcepts.join(' · ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
