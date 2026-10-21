import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Circle,
  FileText,
  GitCompare,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Quote,
  RefreshCw,
  Table as TableIcon,
  Terminal,
  XCircle,
} from 'lucide-react';
import { getChapter, getTopic } from '../data';
import type { Table } from '../data/types';
import { useProgress } from '../lib/store';
import { cn } from '../lib/utils';
import { Card } from '../components/ui';
import { CodeBlock } from '../components/CodeBlock';
import NotFound from './NotFound';

function DataTable({ t }: { t: Table }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        {t.title && (
          <caption className="border-b border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-300">{t.title}</caption>
        )}
        <thead className="bg-white/5 text-slate-300">
          <tr>{t.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {t.rows.map((row, ri) => (
            <tr key={ri} className="border-t border-white/5">
              {row.map((cell, ci) => <td key={ci} className="px-3 py-2 align-top text-slate-300">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ icon, title, children, tone = 'brand' }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone?: 'brand' | 'green' | 'amber' | 'rose' | 'violet' }) {
  const tones: Record<string, string> = {
    brand: 'text-brand-300',
    green: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
    violet: 'text-violet-300',
  };
  return (
    <section>
      <h3 className={cn('mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide', tones[tone])}>
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

export default function TopicView() {
  const { chapterId, topicId } = useParams();
  const navigate = useNavigate();
  const { state, markLearned, visitTopic, recordAttempt } = useProgress();
  const chapter = chapterId ? getChapter(chapterId) : undefined;
  const topic = topicId ? getTopic(topicId) : undefined;

  useEffect(() => {
    if (topic) visitTopic(topic.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizRevealed, setQuizRevealed] = useState(false);

  const { prev, next } = useMemo(() => {
    if (!chapter || !topic) return { prev: undefined, next: undefined };
    const idx = chapter.topics.findIndex((t) => t.id === topic.id);
    return { prev: idx > 0 ? chapter.topics[idx - 1] : undefined, next: idx < chapter.topics.length - 1 ? chapter.topics[idx + 1] : undefined };
  }, [chapter, topic]);

  if (!chapter || !topic) return <NotFound />;
  const c = topic.content;
  const isLearned = state.learnedTopics.includes(topic.id);
  const quiz = c.quiz || [];
  const quizScore = quiz.reduce((n, q, i) => (quizAnswers[i] === q.answer ? n + 1 : n), 0);

  const submitQuiz = () => {
    setQuizRevealed(true);
    quiz.forEach((q, i) => {
      const given = quizAnswers[i];
      if (given == null) return;
      recordAttempt({
        questionId: `${topic.id}-quiz-${i}`,
        chapterId: chapter.id,
        topicId: topic.id,
        type: 'mcq',
        difficulty: 'easy',
        correct: given === q.answer,
        given: String(given),
        at: Date.now(),
        mode: 'topic-quiz',
      });
    });
  };

  const retakeQuiz = () => {
    setQuizAnswers({});
    setQuizRevealed(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/learn/${chapter.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft size={15} /> Chapter {chapter.number}: {chapter.title}
        </Link>
        <button
          className={cn('btn !py-2', isLearned ? 'btn-soft' : 'btn-ghost')}
          onClick={() => markLearned(topic.id, !isLearned)}
        >
          {isLearned ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          {isLearned ? 'Learned' : 'Mark as learned'}
        </button>
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-300">Chapter {chapter.number} · Topic</div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">{topic.title}</h1>
      </div>

      <div className="space-y-6">
        {/* 1. Hinglish */}
        <Card className="p-5">
          <Block icon={<Quote size={16} />} title="Simple explanation (Hinglish)">
            <p className="prose-note">{c.hinglish}</p>
          </Block>
        </Card>

        {/* 2. Formal definition */}
        <Card className="p-5">
          <Block icon={<BookOpen size={16} />} title="Formal definition (write this in the exam)">
            <p className="rounded-xl border border-brand-400/20 bg-brand-500/5 p-3 text-[15px] leading-relaxed text-slate-200">{c.formalDefinition}</p>
          </Block>
        </Card>

        {/* 3. Keywords */}
        {c.keywords?.length > 0 && (
          <Card className="p-5">
            <Block icon={<ListChecks size={16} />} title="Important keywords & facts">
              <div className="flex flex-wrap gap-2">
                {c.keywords.map((k, i) => <span key={i} className="chip !text-[13px]">{k}</span>)}
              </div>
            </Block>
          </Card>
        )}

        {/* 4. Examples */}
        {c.examples?.length > 0 && (
          <Card className="p-5">
            <Block icon={<Lightbulb size={16} />} title="Real-life examples" tone="amber">
              <ul className="space-y-2">
                {c.examples.map((e, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-slate-300"><span className="text-amber-300">•</span>{e}</li>
                ))}
              </ul>
            </Block>
          </Card>
        )}

        {/* 5. Tables */}
        {c.tables?.map((t, i) => (
          <Card key={i} className="p-5">
            <Block icon={<TableIcon size={16} />} title={t.title || 'Comparison table'}>
              <DataTable t={t} />
            </Block>
          </Card>
        ))}

        {/* 6. Diagrams */}
        {c.diagrams?.length ? (
          <Card className="p-5">
            <Block icon={<FileText size={16} />} title="Diagrams & flowcharts">
              <div className="space-y-3">
                {c.diagrams.map((d, i) => (
                  <pre key={i} className="code-block whitespace-pre-wrap font-mono text-xs text-slate-200">{d}</pre>
                ))}
              </div>
            </Block>
          </Card>
        ) : null}

        {/* 7. Differences */}
        {c.differences?.map((t, i) => (
          <Card key={i} className="p-5">
            <Block icon={<GitCompare size={16} />} title={t.title || 'Important differences'} tone="violet">
              <DataTable t={t} />
            </Block>
          </Card>
        ))}

        {/* 8. Python syntax + code */}
        {(c.pythonSyntax || c.codeExamples?.length) ? (
          <Card className="p-5">
            <Block icon={<Terminal size={16} />} title="Python syntax & code" tone="green">
              <div className="space-y-3">
                {c.pythonSyntax && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Syntax</p>
                    <CodeBlock code={c.pythonSyntax} />
                  </div>
                )}
                {c.codeExamples?.map((ex, i) => (
                  <div key={i} className="space-y-2">
                    <CodeBlock code={ex.code} />
                    {ex.output != null && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Output</p>
                        <pre className="code-block whitespace-pre-wrap text-slate-200">{ex.output}</pre>
                      </div>
                    )}
                    {ex.explanation && <p className="text-sm text-slate-400">{ex.explanation}</p>}
                  </div>
                ))}
              </div>
            </Block>
          </Card>
        ) : null}

        {/* 9. Common mistakes */}
        {c.commonMistakes?.length > 0 && (
          <Card className="p-5">
            <Block icon={<AlertTriangle size={16} />} title="Common student mistakes" tone="rose">
              <ul className="space-y-2">
                {c.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-slate-300"><XCircle size={15} className="mt-1 shrink-0 text-rose-300" />{m}</li>
                ))}
              </ul>
            </Block>
          </Card>
        )}

        {/* 10. Exam notes */}
        {c.examNotes?.length > 0 && (
          <Card className="p-5">
            <Block icon={<FileText size={16} />} title="Exam-oriented notes">
              <ul className="space-y-2">
                {c.examNotes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-slate-300"><CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-300" />{m}</li>
                ))}
              </ul>
            </Block>
          </Card>
        )}

        {/* 11. FAQs */}
        {c.faqs?.length > 0 && (
          <Card className="p-5">
            <Block icon={<HelpCircle size={16} />} title="Frequently asked questions">
              <div className="space-y-3">
                {c.faqs.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-semibold text-slate-100">Q. {f.q}</p>
                    <p className="mt-1 text-sm text-slate-400">A. {f.a}</p>
                  </div>
                ))}
              </div>
            </Block>
          </Card>
        )}

        {/* 12. Topic quiz */}
        {quiz.length > 0 && (
          <Card className="p-5">
            <Block icon={<ClipboardIcon />} title="Topic quiz">
              <div className="space-y-4">
                {quiz.map((q, i) => (
                  <div key={i} className="rounded-xl border border-white/10 p-3">
                    <p className="mb-2 text-sm font-medium text-slate-100">{i + 1}. {q.question}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        const chosen = quizAnswers[i] === oi;
                        let cls = 'border-white/10 bg-white/5 hover:bg-white/10';
                        if (quizRevealed) {
                          if (oi === q.answer) cls = 'border-emerald-400 bg-emerald-500/15';
                          else if (chosen) cls = 'border-rose-400 bg-rose-500/15';
                          else cls = 'border-white/10 bg-white/5 opacity-70';
                        } else if (chosen) cls = 'border-brand-400 bg-brand-500/15';
                        return (
                          <button
                            key={oi}
                            disabled={quizRevealed}
                            onClick={() => setQuizAnswers((a) => ({ ...a, [i]: oi }))}
                            className={cn('rounded-lg border px-3 py-2 text-left text-sm text-slate-200 transition', cls)}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizRevealed && <p className="mt-2 text-xs text-slate-400">{q.explanation}</p>}
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  {!quizRevealed ? (
                    <button className="btn-primary" onClick={submitQuiz} disabled={Object.keys(quizAnswers).length === 0}>
                      Check answers
                    </button>
                  ) : (
                    <>
                      <span className={cn('font-semibold', quizScore === quiz.length ? 'text-emerald-300' : 'text-amber-300')}>
                        Score: {quizScore}/{quiz.length}
                      </span>
                      <button className="btn-ghost" onClick={retakeQuiz}>
                        <RefreshCw size={15} /> Retake
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Block>
          </Card>
        )}

        {/* 13. Checklist */}
        {c.checklist?.length > 0 && (
          <Card className="p-5">
            <Block icon={<ListChecks size={16} />} title="Revision checklist">
              <ul className="space-y-2">
                {c.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-slate-300">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-white/20 text-[10px] text-slate-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Block>
          </Card>
        )}
      </div>

      {/* Prev / next / actions */}
      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {prev && (
            <button className="btn-ghost" onClick={() => navigate(`/learn/${chapter.id}/${prev.id}`)}>
              <ArrowLeft size={16} /> Previous
            </button>
          )}
          {next && (
            <button className="btn-ghost" onClick={() => navigate(`/learn/${chapter.id}/${next.id}`)}>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/practice?mode=topic&topic=${topic.id}`} className="btn-soft">
            <ClipboardIcon /> Practice this topic
          </Link>
          <Link to="/revision" className="btn-ghost">
            <Bookmark size={16} /> Revise
          </Link>
          <button className={cn('btn', isLearned ? 'btn-soft' : 'btn-primary')} onClick={() => markLearned(topic.id, !isLearned)}>
            {isLearned ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {isLearned ? 'Learned' : 'Mark as learned'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClipboardIcon() {
  return <ListChecks size={16} />;
}
