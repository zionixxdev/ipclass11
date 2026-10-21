import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Play, Search, Sparkles } from 'lucide-react';
import rawExamples from '../data/python-examples.json';
import { Card, DifficultyBadge } from '../components/ui';
import { CodeBlock } from '../components/CodeBlock';
import { LAB_CODE_KEY, LAB_STDIN_KEY } from '../lib/storage';
import { cn } from '../lib/utils';

interface Example {
  id: string;
  title: string;
  question: string;
  code: string;
  input?: string;
  output: string;
  explanation: string;
  concepts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Category {
  id: string;
  title: string;
  description: string;
  examples: Example[];
}

const data = rawExamples as unknown as { categories: Category[] };
const ALL: Example[] = data.categories.flatMap((c) => c.examples);

export default function PythonExamples() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  // Render a page at a time — 97 full cards at once is heavy on a low-end phone.
  const [visible, setVisible] = useState(12);

  const filtered = useMemo(() => {
    const pool = category === 'all' ? ALL : data.categories.find((c) => c.id === category)?.examples || [];
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.question.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.concepts.some((c) => c.toLowerCase().includes(q))
    );
  }, [category, query]);

  useEffect(() => {
    setVisible(12);
  }, [category, query]);

  const openInLab = (ex: Example) => {
    try {
      localStorage.setItem(LAB_CODE_KEY, ex.code);
      localStorage.setItem(LAB_STDIN_KEY, ex.input || '');
    } catch {
      /* storage unavailable — lab will just open with its default sample */
    }
    navigate('/lab');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Python Examples</h1>
        <p className="mt-1 text-sm text-slate-400">
          {ALL.length} ready-to-study programs in the style CBSE gives in Class 11 — read the code, check the output, then run it yourself in the Python Lab.
        </p>
      </div>

      {/* Search + category filter */}
      <Card className="p-3 sm:p-4">
        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search by title, code or concept (e.g. prime, slicing, range)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'shrink-0 rounded-xl border px-3 py-2 text-sm transition',
              category === 'all' ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            )}
          >
            All ({ALL.length})
          </button>
          {data.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                'shrink-0 rounded-xl border px-3 py-2 text-sm transition',
                category === c.id ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              )}
            >
              {c.title} ({c.examples.length})
            </button>
          ))}
        </div>
        {category !== 'all' && (
          <p className="mt-2 text-xs text-slate-400">{data.categories.find((c) => c.id === category)?.description}</p>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-300">No examples match “{query}”. Try a different word.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.slice(0, visible).map((ex) => (
            <Card key={ex.id} className="flex flex-col p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="chip !bg-brand-500/15 !text-brand-200"><Code2 size={13} /> {ex.title}</span>
                <DifficultyBadge difficulty={ex.difficulty} />
              </div>
              <p className="mb-3 text-sm text-slate-300">{ex.question}</p>
              <CodeBlock code={ex.code} />
              {ex.input ? (
                <p className="mt-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Sample input: </span>
                  <span className="font-mono">{ex.input.replace(/\n/g, ' ⏎ ')}</span>
                </p>
              ) : null}
              <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Output</p>
              <pre className="code-block whitespace-pre-wrap text-emerald-300">{ex.output}</pre>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{ex.explanation}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ex.concepts.map((c, i) => (
                  <span key={i} className="chip !text-[11px]">{c}</span>
                ))}
                <button className="btn-soft ml-auto !py-2" onClick={() => openInLab(ex)}>
                  <Play size={15} /> Run in Lab
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length > visible && (
        <div className="flex justify-center">
          <button className="btn-ghost" onClick={() => setVisible((v) => v + 12)}>
            Show {Math.min(12, filtered.length - visible)} more of {filtered.length}
          </button>
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Sparkles size={18} className="text-amber-300" />
        <p className="min-w-0 flex-1 text-sm text-slate-400">
          Tip: predict the output on paper first, then open the example in the Python Lab and run it. That is exactly how the “Predict the Output” questions work in the exam.
        </p>
      </Card>
    </div>
  );
}
